#!/usr/bin/env node
/**
 * مجموعة اختبارات تكامل شاملة لنظام جدار الأسئلة الحية (Live Q&A Wall).
 *
 * تغطي هذه النسخة (المرحلة 2 — الإصلاح الحرج):
 *   - تطابق شكل استجابة البث مع /session/current بنيوياً
 *   - عدم تسرّب الأسئلة المعلّقة/المرفوضة أو أسماء الحاضرين أو الحقول الإدارية
 *   - احترام ?view=live|speaker في النقطتين
 *   - ترويسات SSE + Origin + تحديد المعدّل + رفض view غير صالح
 *   - عدم تكرار الإطارات عند عدم التغيّر
 *
 * الاستخدام:
 *   node scripts/qa-suite.mjs --base=http://localhost:3110
 *
 * بيانات الدخول تُقرأ من .env.local تلقائياً (ADMIN_PASSWORD) بدون طباعتها.
 * ينظّف السكربت كل ما أنشأه قبل الخروج.
 * رمز الخروج: 0 نجاح كامل، 1 وجود فشل.
 */
import { readFileSync, existsSync } from "node:fs";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveDataDir } from "./qa-data-dir.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------- إعدادات ---------- */

function arg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const BASE = (arg("base") || process.env.QA_BASE || "http://localhost:3000").replace(/\/+$/, "");

function loadEnvLocal() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

const ENV = loadEnvLocal();
const ADMIN_USER = arg("user", "admin");
const ADMIN_PASS = arg("pass", process.env.ADMIN_PASSWORD || ENV.ADMIN_PASSWORD || "");

/* ---------- عدّادات ---------- */

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, label, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
}

/* ---------- عميل HTTP ---------- */

async function api(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json, headers: res.headers };
}

/** مثل `api` لكنه يعيد النص الخام — لازم لردود CSV. */
async function apiText(method, path, { token, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  return { status: res.status, text: await res.text(), headers: res.headers };
}

/**
 * يقرأ إطار SSE واحد فقط ثم يقطع الاتصال.
 * @returns {{status:number, headers:Headers, frame:object|null, raw:string}}
 */
async function readFirstFrame(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      headers: { Accept: "text/event-stream" },
    });
    if (!res.ok || !res.body) {
      return { status: res.status, headers: res.headers, frame: null, raw: "" };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (!buffer.includes("\n\n")) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
    }
    const raw = buffer.split("\n\n")[0] ?? "";
    const payload = raw.startsWith("data: ") ? raw.slice(6) : "";
    let frame = null;
    try {
      frame = JSON.parse(payload);
    } catch {
      frame = null;
    }
    controller.abort();
    return { status: res.status, headers: res.headers, frame, raw };
  } catch {
    return { status: 0, headers: new Headers(), frame: null, raw: "" };
  } finally {
    clearTimeout(timer);
  }
}

const unique = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

/**
 * ينشئ JWT صالحاً بدور "viewer" لمستخدم موجود فعلاً.
 *
 * ⚠️ لماذا نوقّع بأنفسنا بدل تسجيل دخول viewer عبر API؟ لأن سجل المستخدمين
 * lives في Google Sheet، وبيئة الاختبار بلا اعتمادات، فغير مستحيل إنشاء حساب
 * viewer من خارج الخادم. المفتاح متاح للتطبيق أصلاً عبر JWT_SECRET.
 *
 * الاختبار هنا لا يثبت صحة التوقيع (لو كان السر خاطئاً لَرجع 401 وليس 403)،
 * بل يثبت أن `verifySession` يقبل جلسة صحيحة بدور viewer ثم تُرفضه المسارات
 * التي تتطلب دور admin.
 *
 * يعيد null عند غياب JWT_SECRET حتى لا يُبلّغ الاختبار بنجاح كاذب.
 */
async function ensureViewerToken() {
  const secret = process.env.JWT_SECRET || ENV.JWT_SECRET || "";
  if (!secret) {
    console.log("  SKIP  لا JWT_SECRET — يُختبر فحص الدور يدوياً على الاستضافة");
    return null;
  }
  const username = process.env.QA_VIEWER_USER || "admin";
  const encoded = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const header = encoded({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = encoded({ sub: username, role: "viewer", tv: 0, iat: now, exp: now + 600 });
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

/**
 * يقرأ سؤالاً من لوحة الإدارة داخل جلستنا.
 *
 * `/api/qa/admin/questions` يعيد `{ settings, meta, sessions: [...] }` ويُرجع كل
 * الجلسات لا جلسة واحدة، لذلك نبحث داخل `sessions` بالمعرّف.
 */
async function adminQuestion(id) {
  const res = await api("GET", "/api/qa/admin/questions", { token });
  const sessions = res.json?.sessions ?? [];
  for (const s of sessions) {
    const found = (s.questions ?? []).find((q) => q.id === id);
    if (found) return found;
  }
  return null;
}

/* ---------- الحالة المشتركة ---------- */

const run = unique("QASUITE");
// ⚠️ يجب أن تكون نصوص العلامات **متباعدة جوهرياً** في الكلمات، وإلا فactivّل
// كشف التكرار في الخادم واعتبر الأسئلة الخمسة مكررة (سلوك صحيح، لكنه يفسّر
// الاختبار). لكل علامة جملة بموضوع مختلف تماماً وبلاحقة فريدة خاصة بها.
const MARK = {
  approved: `ما الذي دفعك لاختيار الهندسة كمسار دراسي؟ #${run}a`,
  pending: `كيف كانت تجربتك في مادة الرياضيات بالابتدائي؟ #${run}b`,
  rejected: `هل سيغيّر الذكاء الاصطناعي سوق العمل خلال عقد؟ #${run}c`,
  hiddenLive: `ما الكتاب الذي تنصح به من يبحث عن الإلهام؟ #${run}d`,
  hiddenSpeaker: `كيف تصف شعورك وأنت واقف على هذه المنصة؟ #${run}e`,
  attendee: `${run}-ATTENDEE-SECRET`,
  // حاضر ثانٍ لا يطرح أي سؤال إطلاقاً — يُستخدم للتحقق من عدم تسرّب
  // «قائمة أسماء الحاضرين». لا يمكن استخدام `attendee` لهذا الفحص لأن اسمه
  // يظهر بشكل مشروع كـ`author` على الأسئلة التي يكتبها.
  silentAttendee: `${run}-SILENT-ATTENDEE`,
  spoofed: `${run}-SPOOFED-NAME`,
};

let token = null;
let sessionId = null;
let attendeeId = null;
let questionIds = {};

/* ---------- التهيئة ---------- */

async function setup() {
  section("0) التهيئة والدخول الإداري");
  if (!ADMIN_PASS) {
    console.error("  لا توجد كلمة مرور إدارية. مرّر --pass=... أو اضبط ADMIN_PASSWORD في .env.local");
    process.exit(1);
  }

  const login = await api("POST", "/api/admin/login", {
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  assert(login.status === 200 && login.json?.ok, "دخول إداري", `status=${login.status}`);
  token = login.json?.token;
  if (!token) {
    console.log("  لا يوجد token — توقّف");
    process.exit(1);
  }

  const created = await api("POST", "/api/qa/admin/session", {
    token,
    body: { action: "create", title: run },
  });
  assert(created.status === 200 && created.json?.result?.id, "إنشاء جلسة", `status=${created.status}`);
  sessionId = created.json?.result?.id;
  if (!sessionId) {
    console.log("  لا توجد جلسة — توقّف");
    process.exit(1);
  }

  const activated = await api("POST", "/api/qa/admin/session", {
    token,
    body: { action: "activate", sessionId },
  });
  assert(activated.json?.result?.active === true, "تفعيل الجلسة");
}

/* ---------- المرحلة 2: اللقطة العامة والبث ---------- */

async function testPublicSnapshotParity() {
  section("1) تطابق شكل اللقطة العامة بين REST والبث");

  const rest = await api("GET", "/api/qa/session/current?view=live");
  assert(rest.status === 200, "GET /session/current يعيد 200", `status=${rest.status}`);
  assert(
    ["active", "settings", "session", "questions", "polls"].every((k) => k in (rest.json ?? {})),
    "الاستجابة تحتوي كل المفاتيح المتوقعة",
    Object.keys(rest.json ?? {}).join(",")
  );
  assert(
    !("sessions" in (rest.json ?? {})) && !("meta" in (rest.json ?? {})),
    "REST لا يسرّب sessions/meta",
    Object.keys(rest.json ?? {}).join(",")
  );

  const sse = await readFirstFrame("/api/qa/stream?view=live");
  assert(sse.status === 200, "GET /api/qa/stream يعيد 200", `status=${sse.status}`);
  assert(
    sse.headers.get("content-type")?.includes("text/event-stream"),
    "ترويسة Content-Type = text/event-stream",
    sse.headers.get("content-type")
  );
  assert(
    sse.headers.get("cache-control")?.includes("no-cache"),
    "ترويسة Cache-Control تمنع التخزين المؤقت",
    sse.headers.get("cache-control")
  );
  assert(
    sse.headers.get("x-accel-buffering") === "no",
    "ترويسة X-Accel-Buffering: no",
    sse.headers.get("x-accel-buffering")
  );
  assert(sse.frame !== null, "أول إطار SSE قابل للتحليل كـ JSON", sse.raw.slice(0, 120));

  // المقارنة البنيوية: نفس المفاتيح ونفس النوع تماماً
  const restKeys = Object.keys(rest.json ?? {}).sort();
  const sseKeys = Object.keys(sse.frame ?? {}).sort();
  assert(
    restKeys.join("|") === sseKeys.join("|"),
    "البث يستخدم نفس مفاتيح REST تماماً",
    `rest=${restKeys.join(",")} sse=${sseKeys.join(",")}`
  );
  assert(
    Array.isArray(sse.frame?.questions) && Array.isArray(sse.frame?.polls),
    "البث يعيد questions و polls كمصفوفتين",
    typeof sse.frame?.questions
  );
}

async function testNoLeak() {
  section("2) منع تسرّب البيانات الإدارية (المهمة الأهم)");

  // حاضر باسم مميز نبحث عنه في كل مخرجات العامة
  const join = await api("POST", "/api/qa/attendee/join", { body: { name: MARK.attendee } });
  assert(join.status === 200 && !!join.json?.attendeeId, "انضمام حاضر", `status=${join.status}`);
  attendeeId = join.json?.attendeeId;
  if (!attendeeId) return;

  // حاضر ثانٍ صامت — لازم leaked اسم من قائمة الحاضرين يظهر
  const silent = await api("POST", "/api/qa/attendee/join", { body: { name: MARK.silentAttendee } });
  assert(silent.status === 200 && !!silent.json?.attendeeId, "انضمام حاضر ثانٍ", `status=${silent.status}`);

  const submitted = [];
// كشف التكرار في الخادم يعمل بالمقارنة النصية، فالأسئلة الخمسة تستخدم نصوصاً
// مختلفة جوهرياً كي لا تتصادم.
let duplicateDetected = false;
for (const [key, text] of [
  ["approved", MARK.approved],
  ["pending", MARK.pending],
  ["rejected", MARK.rejected],
  ["hiddenLive", MARK.hiddenLive],
  ["hiddenSpeaker", MARK.hiddenSpeaker],
]) {
  // نرسل اسماً مزيّفاً مع كل سؤال للتحقق من أن الخادم يتجاهله
  const res = await api("POST", "/api/qa/question", {
    body: { attendeeId, name: MARK.spoofed, text },
  });
  assert(res.status === 201 || res.status === 200, `إرسال سؤال (${key})`, `status=${res.status}`);
  if (res.json?.duplicate === true) duplicateDetected = true;
  const id = res.json?.question?.id;
  if (id) {
    questionIds[key] = id;
    submitted.push(key);
  }
}
assert(
  submitted.length === 5 && !duplicateDetected,
  "أُرسلت الأسئلة الخمسة دون اعتبارها مكررة",
  `أُرسل ${submitted.length}${duplicateDetected ? " (رُصد تكرار)" : ""}`
);

  // نعتمد واحداً ونرفض واحداً
  if (questionIds.approved) {
    await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "approve", sessionId, questionId: questionIds.approved },
    });
  }
  if (questionIds.rejected) {
    await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "reject", sessionId, questionId: questionIds.rejected },
    });
  }
  // نخفي سؤالين: واحد عن الشاشة الرئيسية وآخر عن شاشة المتحدث
  if (questionIds.hiddenLive) {
    await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "setVisibility", sessionId, questionId: questionIds.hiddenLive, showOnLive: false },
    });
  }
  if (questionIds.hiddenSpeaker) {
    await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "setVisibility", sessionId, questionId: questionIds.hiddenSpeaker, showOnSpeaker: false },
    });
  }

  const live = await api("GET", "/api/qa/session/current?view=live");
  const speaker = await api("GET", "/api/qa/session/current?view=speaker");
  const liveText = JSON.stringify(live.json ?? {});
  const speakerText = JSON.stringify(speaker.json ?? {});

  assert(liveText.includes(MARK.approved), "السؤال المعتمد ظاهر للجمهور");
  assert(!liveText.includes(MARK.pending), "السؤال المعلّق لا يظهر للجمهور");
  assert(!liveText.includes(MARK.rejected), "السؤال المرفوض لا يظهر للجمهور");
  assert(!liveText.includes(MARK.hiddenLive), "showOnLive=false يُخفي من شاشة العرض");
  assert(!speakerText.includes(MARK.hiddenSpeaker), "showOnSpeaker=false يُخفي من شاشة المتحدث");
  assert(!liveText.includes(MARK.silentAttendee), "قائمة أسماء الحاضرين لا تتسرّب");
  assert(!speakerText.includes(MARK.silentAttendee), "قائمة الأسماء لا تتسرّب في شاشة المتحدث");
  assert(!liveText.includes(MARK.spoofed), "الاسم المزيّف المرسل من العميل لا يُستخدم");

  const q0 = live.json?.questions?.[0] ?? {};
  assert(
    !("status" in q0) && !("sentiment" in q0) && !("tag" in q0) && !("createdAt" in q0),
    "لا حقول إدارية في سؤال عام",
    Object.keys(q0).join(",")
  );

  const sseLive = await readFirstFrame("/api/qa/stream?view=live");
  const sseSpeaker = await readFirstFrame("/api/qa/stream?view=speaker");
  const sseLiveText = JSON.stringify(sseLive.frame ?? {});
  const sseSpeakerText = JSON.stringify(sseSpeaker.frame ?? {});

  assert(sseLiveText.includes(MARK.approved), "البث يعرض السؤال المعتمد (العلامة الحاسمة)");
  assert(!sseLiveText.includes(MARK.pending), "البث لا يسرّب السؤال المعلّق");
  assert(!sseLiveText.includes(MARK.rejected), "البث لا يسرّب السؤال المرفوض");
  assert(!sseLiveText.includes(MARK.hiddenLive), "البث يحترم showOnLive=false");
  assert(!sseSpeakerText.includes(MARK.hiddenSpeaker), "البث يحترم showOnSpeaker=false");
  assert(!sseLiveText.includes(MARK.silentAttendee), "البث لا يسرّب أسماء الحاضرين");
  assert(!sseLiveText.includes(MARK.spoofed), "البث لا يستخدم الاسم المزيّف");
  assert(!sseLiveText.includes('"sessions"'), "البث لا يسرّب مصفوفة sessions");
  assert(!sseLiveText.includes('"meta"'), "البث لا يسرّب meta");
  assert(!sseLiveText.includes('"attendeeNames"'), "البث لا يسرّب attendeeNames");
}

async function testViewValidation() {
  section("3) التحقق من view و Origin");

  const badRest = await api("GET", "/api/qa/session/current?view=hacker");
  assert(badRest.status === 400, "REST يرفض view غير صالح", `status=${badRest.status}`);

  const badSse = await readFirstFrame("/api/qa/stream?view=hacker");
  assert(badSse.status === 400, "البث يرفض view غير صالح", `status=${badSse.status}`);

  // مشغّل الخادم يضمن وجود منفذ الاختبار ضمن ALLOWED_API_ORIGINS
  const selfOrigin = BASE;
  const ok = await api("GET", "/api/qa/session/current?view=live", {
    headers: { Origin: selfOrigin },
  });
  assert(ok.status === 200, "Origin مسموح يمرّ", `status=${ok.status} origin=${selfOrigin}`);

  const blockedRest = await api("GET", "/api/qa/session/current?view=live", {
    headers: { Origin: "https://evil.example" },
  });
  assert(blockedRest.status === 403, "REST يرفض Origin غير مسموح", `status=${blockedRest.status}`);

  const withBadOrigin = await fetch(`${BASE}/api/qa/stream?view=live`, {
    headers: { Origin: "https://evil.example", Accept: "text/event-stream" },
  });
  assert(withBadOrigin.status === 403, "البث يرفض Origin غير مسموح", `status=${withBadOrigin.status}`);
  if (withBadOrigin.body) await withBadOrigin.body.cancel();

  const noOrigin = await api("GET", "/api/qa/session/current?view=live");
  assert(noOrigin.status === 200, "غياب Origin يمرّ (سلوك مقصود)", `status=${noOrigin.status}`);
}

async function testNoDuplicateFrames() {
  section("4) البث لا يكرّر الإطار عند عدم التغيّر");

  const controller = new AbortController();
  let expectedAbort = false;
  let frameCount = 0;
  try {
    const res = await fetch(`${BASE}/api/qa/stream?view=live`, {
      signal: controller.signal,
      headers: { Accept: "text/event-stream" },
    });
    assert(res.status === 200, "الاتصال مفتوح", `status=${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    // ننتظر أكثر من دورتين (3 ثوانٍ) للتأكد من عدم تكرار الإطار.
    // `reader.read()` يحجب ما دام لا تصل بيانات، فنraceه بمؤقّت حتى لا يتجمّد
    // الفحص لو لم تصل أي بيانات أصلاً.
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      const remaining = deadline - Date.now();
      const timeoutRace = new Promise((resolve) => setTimeout(() => resolve({ done: true }), remaining));
      const { done, value } = await Promise.race([reader.read(), timeoutRace]);
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (chunk.startsWith("data: ")) frameCount += 1;
      }
    }
    assert(frameCount === 1, "إطار واحد فقط رغم مرور 9 ثوانٍ بلا تغيير", `إطارات=${frameCount}`);
  } catch (err) {
    if (!expectedAbort) {
      assert(false, "قراءة البث لم تفشل", String(err));
    }
  } finally {
    expectedAbort = true;
    controller.abort();
  }
}

/* ---------- المرحلة 4: هوية الحاضر ومنع الانتحال ---------- */

async function testAttendeeIdentity() {
  section("5) هوية الحاضر (منع الانتحال والتحقق من attendeeId)");

  // 5.1 — attendeeId عشوائي غير مسجَّل
  const fake = await api("POST", "/api/qa/question", {
    body: { attendeeId: `${run}-FORGED`, text: `سؤال بمعرّف حضور مزيّف لا صلة له بأحد ${run}f` },
  });
  assert(fake.status === 403, "سؤال بمعرّف حضور غير مسجَّل يُرفض", `status=${fake.status}`);

  // 5.2 — معرّف فارغ
  const empty = await api("POST", "/api/qa/question", {
    body: { attendeeId: "", text: "سؤال بلا معرّف حضور" },
  });
  assert(empty.status === 400, "سؤال بلا attendeeId يُرفض", `status=${empty.status}`);

  // 5.3 — معرّف حضور من جلسة أخرى
  const otherTitle = unique("QASUITE-OTHER");
  const other = await api("POST", "/api/qa/admin/session", { token, body: { action: "create", title: otherTitle } });
  const otherSessionId = other.json?.result?.id;
  await api("POST", "/api/qa/admin/session", { token, body: { action: "activate", sessionId: otherSessionId } });
  const otherJoin = await api("POST", "/api/qa/attendee/join", { body: { name: `${run}-OTHER-ATTENDEE` } });
  const otherAttendeeId = otherJoin.json?.attendeeId;
  assert(!!otherAttendeeId, "انضمام في الجلسة الأخرى");

  // نعيد تفعيل جلستنا، ثم نحاول استخدام معرّف الجلسة الأخرى
  await api("POST", "/api/qa/admin/session", { token, body: { action: "activate", sessionId } });
  const crossSession = await api("POST", "/api/qa/question", {
    body: { attendeeId: otherAttendeeId, text: `محاولة سؤال بمعرّف جلسة أخرى ${run}g` },
  });
  assert(crossSession.status === 403, "معرّف حضور من جلسة أخرى يُرفض", `status=${crossSession.status}`);

  // 5.4 — الاسم يُشتقّ من السجل، والاسم المزيّف يُتجاهل
  const spoofRes = await api("POST", "/api/qa/question", {
    body: { attendeeId, name: MARK.spoofed, text: `من أنت حين تقول إنك غير نفسك ${run}h` },
  });
  assert(spoofRes.status === 201 || spoofRes.status === 200, "السؤال قُبل", `status=${spoofRes.status}`);
  const spoofedId = spoofRes.json?.question?.id;
  if (spoofedId) {
    await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "approve", sessionId, questionId: spoofedId },
    });
    const found = await adminQuestion(spoofedId);
    assert(found?.author === MARK.attendee, "اسم السؤال مأخوذ من سجل الحضور", `author=${found?.author}`);
    assert(found?.author !== MARK.spoofed, "الاسم المزيّف لم يُستخدم");
  }

  // 5.5 — التصويت بمعرّف غير مسجَّل
  const poll = await api("POST", "/api/qa/admin/poll", {
    token,
    body: { action: "create", sessionId, prompt: `${run}-poll`, options: ["أ", "ب"] },
  });
  const pollId = poll.json?.result?.id ?? poll.json?.result?.poll?.id;
  if (pollId) {
    await api("POST", "/api/qa/admin/poll", { token, body: { action: "start", sessionId, pollId } });
    const badVote = await api("POST", "/api/qa/poll/vote", {
      body: { attendeeId: `${run}-FORGED`, pollId, optionIndex: 0 },
    });
    assert(badVote.status === 403, "تصويت بمعرّف غير مسجَّل يُرفض", `status=${badVote.status}`);
    const goodVote = await api("POST", "/api/qa/poll/vote", {
      body: { attendeeId, pollId, optionIndex: 0 },
    });
    assert(goodVote.status === 200, "تصويت بمعرّف مسجَّل يُقبل", `status=${goodVote.status}`);
    const dupVote = await api("POST", "/api/qa/poll/vote", {
      body: { attendeeId, pollId, optionIndex: 1 },
    });
    assert(dupVote.status === 409, "التصويت المزدوج يُرفض", `status=${dupVote.status}`);
    await api("POST", "/api/qa/admin/poll", { token, body: { action: "delete", sessionId, pollId } });
  } else {
    assert(false, "إنشاء استفتاء للاختبار", JSON.stringify(poll.json).slice(0, 160));
  }

  // تنظيف الجلسة الأخرى
  await api("POST", "/api/qa/admin/session", { token, body: { action: "delete", sessionId: otherSessionId } });
}

/* ---------- سر استرداد الحضور: الاسم لا يكفي ---------- */

async function testAttendeeReclaimSecret() {
  section("5b) انتحال الحضور: الاسم وحده لا يُعيد معرّف شخص آخر");

  const name = `${run}-RECLAIM`;
  const first = await api("POST", "/api/qa/attendee/join", { body: { name } });
  const id1 = first.json?.attendeeId;
  const secret1 = first.json?.reclaimSecret;
  assert(!!id1, "أول انضمام ينجح", `status=${first.status}`);
  assert(!!secret1, "الاستجابة تعيد سر الاسترداد");
  if (!id1 || !secret1) return;

  // ⛔ المحاولة الأساسية للهجوم: نفس الاسم، بلا سر.
  const hijack = await api("POST", "/api/qa/attendee/join", { body: { name } });
  const hijackId = hijack.json?.attendeeId;
  assert(hijackId !== id1, "الاسم بلا سر لا يُعيد معرّف الحاضر الأصلي", `id=${hijackId} original=${id1}`);
  assert(
    hijack.json?.reclaimSecret !== secret1,
    "المهاجم لا يستلم سر الحاضر الأصلي"
  );

  // ⛔ وسر خاطئ صراحةً: يجب ألا يُعيد المعرّف أيضاً.
  const wrongSecret = await api("POST", "/api/qa/attendee/join", {
    body: { name, reclaimSecret: "0".repeat(32) },
  });
  assert(wrongSecret.json?.attendeeId !== id1, "سر خاطئ لا يُعيد معرّف الحاضر");

  // ✅ عودة الشخص الحقيقي: بالسر ⇒ نفس المعرّف (تحديث الصفحة لا يضاعف العدّ).
  const returning = await api("POST", "/api/qa/attendee/join", { body: { name, reclaimSecret: secret1 } });
  assert(returning.json?.attendeeId === id1, "الحاضر العائد بالسر يحصل على نفس المعرّف", `id=${returning.json?.attendeeId}`);

  // المعرّف المسروق (إن وُجد) لا يمنح صاحبه حق السؤال باسم الحاضر الأصلي.
  if (hijackId) {
    const asHijacker = await api("POST", "/api/qa/question", {
      body: { attendeeId: hijackId, name, text: `سؤال من معرّف مسروق ${run}-hijack` },
    });
    assert(asHijacker.status === 200 || asHijacker.status === 201, "السؤال من المعرّف الجديد يُقبل");
    if (asHijacker.json?.question?.id) {
      const found = await adminQuestion(asHijacker.json.question.id);
      // Either identity is "fine" from the server's view — the point proven above
      // is that the attacker cannot *claim* the original attendeeId. What must
      // never happen is the original id being handed out without the secret.
      assert(typeof found?.author === "string" && found.author.length > 0, "اسم الكاتب مستخرَج من السجل");
    }
  }

  // المعرّف الأصلي ما زال صالحاً لصاحبه (لم نقفله بالإصلاح).
  const stillWorks = await api("POST", "/api/qa/question", {
    body: { attendeeId: id1, text: `سؤال من الحاضر الأصلي بعد محاولة الانتحال ${run}-owner` },
  });
  assert(
    stillWorks.status === 200 || stillWorks.status === 201,
    "الحاضر الأصلي لم يُقفل بعد تطبيق السر",
    `status=${stillWorks.status}`
  );
}

/* ---------- المرحلة 8: التخزين الخام بلا ترميز مزدوج ---------- */

async function testRawTextStorage() {
  section("6) تخزين النص الخام (لا ترميز مزدوج)");

  const html = `<b>${run}-BOLD</b>`;
  const res = await api("POST", "/api/qa/question", {
    body: { attendeeId, text: `سؤال فيه وسم ${html} لاختبار التخزين ${run}i` },
  });
  const id = res.json?.question?.id;
  assert(!!id, "سؤال فيه HTML قُبل", `status=${res.status}`);
  if (!id) return;

  await api("POST", "/api/qa/admin/moderate", { token, body: { action: "approve", sessionId, questionId: id } });
  const found = await adminQuestion(id);
  const stored = found?.text ?? "";

  assert(stored.includes("<b>"), "الوسم مخزَّن خاماً بلا تهريب", stored.slice(0, 120));
  assert(!stored.includes("&lt;b&gt;"), "لا يوجد ترميز HTML في التخزين", stored.slice(0, 120));
  assert(!stored.includes("&amp;lt;"), "لا يوجد ترميز مزدوج", stored.slice(0, 120));
}

/* ---------- المرحلة 9: التصويت على الأسئلة ---------- */

/** يقرأ meta الإجمالي من لوحة الإدارة. */
async function adminMeta() {
  const res = await api("GET", "/api/qa/admin/questions", { token });
  return res.json?.meta ?? null;
}

async function testQuestionVoting() {
  section("7) التصويت على الأسئلة (صوت واحد لكل حاضر)");

  const questionId = questionIds.approved;
  if (!questionId || !attendeeId) {
    assert(false, "السؤال المعتمد متاح للتصويت", "لا يوجد سؤال معتمد");
    return;
  }

  const before = (await adminMeta())?.totalVotes ?? 0;

  const first = await api("POST", "/api/qa/question/vote", { body: { attendeeId, questionId } });
  assert(first.status === 200 && first.json?.ok, "التصويت الأول يُقبل", `status=${first.status}`);
  assert(first.json?.votes === 1, "عدّاد السؤال صار 1", `votes=${first.json?.votes}`);

  const dup = await api("POST", "/api/qa/question/vote", { body: { attendeeId, questionId } });
  assert(dup.status === 409, "التصويت المزدوج لنفس الحاضر يُرفض", `status=${dup.status}`);

  const afterDup = await adminQuestion(questionId);
  assert(afterDup?.votes === 1, "العدّاد لم يتضاعف مع التكرار", `votes=${afterDup?.votes}`);

  const afterVote = (await adminMeta())?.totalVotes ?? 0;
  assert(afterVote === before + 1, "meta.totalVotes زاد 1 بعد التصويت", `قبل=${before} بعد=${afterVote}`);

  // حضور غير مسجَّل
  const forged = await api("POST", "/api/qa/question/vote", {
    body: { attendeeId: unique("FORGED"), questionId },
  });
  assert(forged.status === 403, "تصويت بمعرّف حضور غير مسجَّل يُرفض", `status=${forged.status}`);

  // سؤال معلّق
  if (questionIds.pending) {
    const pendingVote = await api("POST", "/api/qa/question/vote", {
      body: { attendeeId, questionId: questionIds.pending },
    });
    assert(
      pendingVote.status === 404 || pendingVote.status === 403,
      "التصويت على سؤال معلّق يُرفض",
      `status=${pendingVote.status}`
    );
  }

  // التراجع عن الصوت
  const undo = await api("DELETE", `/api/qa/question/vote?attendeeId=${encodeURIComponent(attendeeId)}&questionId=${encodeURIComponent(questionId)}`);
  assert(undo.status === 200 && undo.json?.ok, "سحب الصوت يعمل", `status=${undo.status}`);
  assert(undo.json?.votes === 0, "العدّاد عاد إلى 0", `votes=${undo.json?.votes}`);

  const afterUndo = (await adminQuestion(questionId))?.votes ?? -1;
  assert(afterUndo === 0, "العدّاد في الخادم صفري بعد السحب", `votes=${afterUndo}`);

  const afterUndoMeta = (await adminMeta())?.totalVotes ?? -1;
  assert(afterUndoMeta === before, "meta.totalVotes رجع لقيمته بعد السحب", `قبل=${before} بعد=${afterUndoMeta}`);

  const undoAgain = await api("DELETE", `/api/qa/question/vote?attendeeId=${encodeURIComponent(attendeeId)}&questionId=${encodeURIComponent(questionId)}`);
  assert(undoAgain.status === 409 || undoAgain.status === 404, "سحب صوت غير موجود يُرفض", `status=${undoAgain.status}`);

  // نعيد التصويت في النهاية ليبقى الاختبار اللاحق متسقاً
  await api("POST", "/api/qa/question/vote", { body: { attendeeId, questionId } });
}

/* ---------- المرحلة 10: التزامن على مستوى العملية ---------- */

async function testConcurrentVotes() {
  section("8) التزامن: أصوات متزامنة من عدة حاضرين");

  const questionId = questionIds.approved;
  if (!questionId) {
    assert(false, "السؤال متاح لاختبار التزامن", "لا يوجد سؤال");
    return;
  }

  // نبدأ من صفر: نسحب أي صوت سابق
  const existing = await adminQuestion(questionId);
  const startVotes = existing?.votes ?? 0;

  const joiners = [];
  for (let i = 0; i < 8; i++) {
    const join = await api("POST", "/api/qa/attendee/join", { body: { name: `${run}-CONC-${i}` } });
    if (join.json?.attendeeId) joiners.push(join.json.attendeeId);
  }
  assert(joiners.length === 8, "انضمام 8 حاضرين بالتوازي", `عدد=${joiners.length}`);
  if (joiners.length < 2) return;

  // 8 عمليات تصويت متزامنة على نفس السؤال
  const results = await Promise.all(
    joiners.map((id) => api("POST", "/api/qa/question/vote", { body: { attendeeId: id, questionId } }))
  );
  const accepted = results.filter((r) => r.status === 200).length;
  assert(accepted === joiners.length, "كل الأصوات المتزامنة قُبلت", `قُبل=${accepted}/${joiners.length}`);

  const after = await adminQuestion(questionId);
  const expected = startVotes + joiners.length;
  assert(after?.votes === expected, "لا ضياع تحت التزامن (كل صوت محسوب)", `المتوقع=${expected} الفعلي=${after?.votes}`);

  // نفس الحاضر يرسل طلبين متزامنين على نفس السؤال ⇒ واحد فقط
  const [r1, r2] = await Promise.all([
    api("POST", "/api/qa/question/vote", { body: { attendeeId: joiners[0], questionId: questionIds.approved } }),
    api("POST", "/api/qa/question/vote", { body: { attendeeId: joiners[0], questionId: questionIds.approved } }),
  ]);
  const dupOk = [r1, r2].filter((r) => r.status === 200).length;
  const afterDup = await adminQuestion(questionId);
  assert(dupOk <= 1, "طلبان متزامنان لنفس الحاضر ⇒ صوت واحد فقط", `نجح=${dupOk}`);
  assert(
    afterDup?.votes === after?.votes + dupOk,
    "العدّاد متسق مع عدد الطلبات الناجحة",
    `قبل=${after?.votes} بعد=${afterDup?.votes} ناجح=${dupOk}`
  );

  // تنظيف أصوات هذا القسم
  await Promise.all(
    joiners.map((id) =>
      api("DELETE", `/api/qa/question/vote?attendeeId=${encodeURIComponent(id)}&questionId=${encodeURIComponent(questionId)}`)
    )
  );
}

/* ---------- المرحلة 11: أمان الاستبيان ---------- */

async function testSurveySecurity() {
  section("9) الاستبيان: مصادقة + سجل حضور + منع التكرار");

  if (!attendeeId) {
    assert(false, "معرّف الحاضر متاح", "لا يوجد حاضر");
    return;
  }

  // 1) GET بلا مصادقة
  const noAuth = await api("GET", `/api/qa/survey?sessionId=${encodeURIComponent(sessionId)}`);
  assert(noAuth.status === 401 || noAuth.status === 403, "GET بلا token يُرفض", `status=${noAuth.status}`);

  // 2) GET مع token
  const withAuth = await api("GET", `/api/qa/survey?sessionId=${encodeURIComponent(sessionId)}`, { token });
  assert(withAuth.status === 200 && withAuth.json?.ok, "GET مع token إداري يُقبل", `status=${withAuth.status}`);

  // 3) GET بلا sessionId
  const noSession = await api("GET", "/api/qa/survey", { token });
  assert(noSession.status === 400, "GET بلا sessionId يُرفض", `status=${noSession.status}`);

  // 4) POST بمعرّف حضور مختلق
  const forged = await api("POST", "/api/qa/survey", {
    body: { sessionId, attendeeId: unique("FORGED"), nps: 9, rating: 5 },
  });
  assert(forged.status === 403, "POST بمعرّف حضور غير مسجَّل يُرفض", `status=${forged.status}`);

  // 5) POST بمعرّف جلسة مختلق
  const badSession = await api("POST", "/api/qa/survey", {
    body: { sessionId: unique("NOSUCH"), attendeeId, nps: 9, rating: 5 },
  });
  assert(badSession.status === 404, "POST بجلسة غير موجودة يُرفض", `status=${badSession.status}`);

  // 6) POST سليم
  const comment = `تعليق <b>${run}</b> يجب أن يبقى خاماً`;
  const ok = await api("POST", "/api/qa/survey", {
    body: { sessionId, attendeeId, nps: 10, rating: 5, comment },
  });
  assert(ok.status === 201 || ok.status === 200, "POST سليم يُقبل", `status=${ok.status}`);

  // 7) منع الإرسال المزدوج
  const dup = await api("POST", "/api/qa/survey", {
    body: { sessionId, attendeeId, nps: 1, rating: 1 },
  });
  assert(dup.status === 409, "الإرسال المزدوج لنفس الحاضر يُرفض", `status=${dup.status}`);

  // 8) التخزين الخام للتعليق
  const afterSubmit = await api("GET", `/api/qa/survey?sessionId=${encodeURIComponent(sessionId)}`, { token });
  const found = (afterSubmit.json?.responses ?? []).find((r) => r.attendeeId === attendeeId);
  assert(!!found, "الرد محفوظ ويُقرأ إدارياً");
  assert(
    (found?.comment ?? "").includes("<b>"),
    "تعليق الاستبيان مخزَّن خاماً بلا ترميز مزدوج",
    String(found?.comment ?? "").slice(0, 100)
  );

  // 9) القيم خارج المدى
  const outOfRange = await api("POST", "/api/qa/survey", {
    body: { sessionId, attendeeId: unique("X"), nps: 99, rating: 9 },
  });
  assert(outOfRange.status === 400, "قيم خارج المدى تُرفض", `status=${outOfRange.status}`);
}

/* ---------- المرحلة 12: تصدير CSV: الدور + حقن الصيغ ---------- */

async function testExportSecurity() {
  section("11) تصدير CSV: فحص الدور وحقن الصيغ");

  if (!questionIds.approved) {
    assert(false, "السؤال متاح لاختبار التصدير", "لا يوجد سؤال");
    return;
  }

  // 1) بلا مصادقة إطلاقاً
  const noAuth = await apiText("GET", `/api/qa/admin/export?sessionId=${encodeURIComponent(sessionId)}`);
  assert(noAuth.status === 401 || noAuth.status === 503, "تصدير بلا token يُرفض", `status=${noAuth.status}`);

  // 2) بدور administrations حقيقي
  const okRes = await apiText("GET", `/api/qa/admin/export?sessionId=${encodeURIComponent(sessionId)}`, { token });
  assert(okRes.status === 200, "تصدير بدور admin يُقبل", `status=${okRes.status}`);
  assert(
    (okRes.headers.get("content-type") ?? "").includes("text/csv"),
    "الرد من نوع CSV",
    okRes.headers.get("content-type") ?? ""
  );
  assert(okRes.text.startsWith("id,author,text,status"), "ترويسة CSV صحيحة", okRes.text.slice(0, 60));

  // 3) ⚠️ فحص الدور على مسار Authorization
  //    `requireAdmin` يتحقق من صلاحية الجلسة فقط. كنا نختبر هنا أن دوراً
  //    غير admin يُرفض — وإن فشل الاختبار فالمسار متجاوز.
  const viewer = await ensureViewerToken();
  if (viewer) {
    const viaHeader = await apiText("GET", `/api/qa/admin/export?sessionId=${encodeURIComponent(sessionId)}`, {
      token: viewer,
    });
    assert(viaHeader.status === 403, "تصدير بدور viewer عبر ترويسة Authorization يُرفض", `status=${viaHeader.status}`);

    const viaQuery = await apiText("GET", `/api/qa/admin/export?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(viewer)}`);
    assert(viaQuery.status === 403, "تصدير بدور viewer عبر ?token= يُرفض", `status=${viaQuery.status}`);

    const surveyAsViewer = await api("GET", `/api/qa/survey?sessionId=${encodeURIComponent(sessionId)}`, {
      token: viewer,
    });
    assert(surveyAsViewer.status === 403, "قراءة ردود الاستبيان بدور viewer تُرفض", `status=${surveyAsViewer.status}`);
  }

  // 4) ⚠️ حقن صيغة CSV: سؤال يبدأ بـ "=" كان يبقى كما هو، فتُنفَّذ خلية
  //    Excel/Sheets عند فتح الملف على جهاز المشرف.
  const formula = `=1+1 formula ${unique("CSV")}`;
  const qRes = await api("POST", "/api/qa/question", {
    body: { attendeeId, name: MARK.attendee, text: formula },
  });
  const formulaId = qRes.json?.question?.id;
  assert(!!formulaId, "سؤال begins بصيغة أُنشئ", `status=${qRes.status}`);

  if (formulaId) {
    await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "approve", sessionId, questionId: formulaId },
    });
    const csv = await apiText("GET", `/api/qa/admin/export?sessionId=${encodeURIComponent(sessionId)}`, { token });
    const formulaLine = csv.text.split("\n").find((l) => l.includes("formula")) ?? "";
    assert(formulaLine.length > 0, "سؤال الصيغة ظهر في التصدير", "لم يُوجد سطر");
    assert(
      !/^[=+\-@]/.test(formulaLine.split(",")[2] ?? "="),
      "خلية الصيغة مهرَّبة (لا تبدأ بـ =)",
      `cell=${(formulaLine.split(",")[2] ?? "").slice(0, 30)}`
    );
    questionIds.formula = formulaId;
  }
}

/* ---------- المرحلة 13: showOnLive/showOnSpeaker ---------- */

async function testVisibilityFlags() {
  section("12) التحكم بالظهور: showOnLive/showOnSpeaker يصلان للواجهة");

  const ids = [questionIds.hiddenLive, questionIds.hiddenSpeaker].filter(Boolean);
  if (!ids.length) {
    assert(false, "أسئلة الظهور متاحة", "لا يوجد");
    return;
  }

  const visibleOf = async (questionId, view) => {
    const snap = await api("GET", `/api/qa/session/current?view=${view}`);
    return (snap.json?.questions ?? []).find((x) => x.id === questionId)?.visible;
  };

  const check = async (questionId, field) => {
    const view = field === "showOnLive" ? "live" : "speaker";
    // ⚠️ اللقطة العامة تضمّ المعتمد فقط، فالسؤال يجب اعتماده أولاً — وإلا
    // اختفاؤه عن المصفوفة سيُقرأ خطأً ك نجاح لعلم الظهور.
    const approved = await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "approve", sessionId, questionId },
    });
    assert(approved.status === 200, `اعتماد سؤال ${field}`, `status=${approved.status}`);

    const on = await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "setVisibility", sessionId, questionId, [field]: true },
    });
    assert(on.status === 200, `setVisibility ${field}=true`, `status=${on.status}`);
    assert((await visibleOf(questionId, view)) === true, `السؤال ظاهر في ${view} بعد الضبط`, "visible غير true");

    const off = await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "setVisibility", sessionId, questionId, [field]: false },
    });
    assert(off.status === 200, `setVisibility ${field}=false`, `status=${off.status}`);
    assert((await visibleOf(questionId, view)) === false, `visible=false يصل للقطة ${view}`, "visible ليس false");
  };

  if (questionIds.hiddenLive) await check(questionIds.hiddenLive, "showOnLive");
  if (questionIds.hiddenSpeaker) await check(questionIds.hiddenSpeaker, "showOnSpeaker");
}

/* ---------- المرحلة 12: idempotency of "answer" ---------- */

async function testAnswerIdempotency() {
  section("10) الإجابة على سؤال: عملية idempotent");

  const questionId = questionIds.approved;
  if (!questionId) {
    assert(false, "السؤال متاح لاختبار الإجابة", "لا يوجد سؤال");
    return;
  }

  const noValue = await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "answer", sessionId, questionId },
  });
  assert(noValue.status === 400, "answer بلا قيمة answered يُرفض", `status=${noValue.status}`);

  const yes = await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "answer", sessionId, questionId, answered: true },
  });
  assert(yes.status === 200 && yes.json?.result?.answered === true, "answered=true يعلّم السؤال", `status=${yes.status}`);

  // تكرار نفس الطلب ⇒ نفس النتيجة (لا انعكاس)
  const yesAgain = await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "answer", sessionId, questionId, answered: true },
  });
  assert(yesAgain.json?.result?.answered === true, "تكرار answered=true يبقى true", `answered=${yesAgain.json?.result?.answered}`);

  const no = await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "answer", sessionId, questionId, answered: false },
  });
  assert(no.json?.result?.answered === false, "answered=false يعيد السؤال unanswered", `answered=${no.json?.result?.answered}`);

  const persisted = await adminQuestion(questionId);
  assert(persisted?.answered === false, "الحالة النهائية محفوظة في الخادم", `answered=${persisted?.answered}`);

  // نُعيد التعليق إلى true كي لا تتأثر المراحل التالية
  await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "answer", sessionId, questionId, answered: false },
  });
}

/* ---------- المرحلة 13: حذف استفتاء يعيد حساب meta ---------- */

async function testPollDeleteRecomputesMeta() {
  section("11) حذف استفتاء يعيد حساب meta");

  const poll = await api("POST", "/api/qa/admin/poll", {
    token,
    body: {
      action: "create",
      sessionId,
      prompt: `استفتاء ${run}`,
      options: ["أ", "ب", "ج"],
      // ⚠️ عدد أقل من options — كان يمرّ ويُنتج خياراً فارغاً على الشاشة
      optionsAr: ["نعم", "لا"],
    },
  });
  assert(poll.status === 400, "optionsAr بطول مختلف يُرفض", `status=${poll.status} ${JSON.stringify(poll.json).slice(0, 120)}`);

  const poll2 = await api("POST", "/api/qa/admin/poll", {
    token,
    body: {
      action: "create",
      sessionId,
      prompt: `استفتاء ${run}`,
      options: ["أ", "ب", "ج"],
      optionsAr: ["نعم", "لا", "ربما"],
    },
  });
  const pollId = poll2.json?.result?.id ?? poll2.json?.result?.poll?.id;
  assert(!!pollId, "استفتاء بطول optionsAr الصحيح يُقبل", `status=${poll2.status}`);

  const emptyOptions = await api("POST", "/api/qa/admin/poll", {
    token,
    body: { action: "create", sessionId, prompt: `x${run}`, options: [] },
  });
  assert(emptyOptions.status === 400, "استفتاء بأقل من خيارين يُرفض", `status=${emptyOptions.status}`);

  if (!pollId) return;

  await api("POST", "/api/qa/admin/poll", { token, body: { action: "start", sessionId, pollId } });
  const before = (await adminMeta())?.totalVotes ?? 0;
  const vote = await api("POST", "/api/qa/poll/vote", { body: { attendeeId, pollId, optionIndex: 1 } });
  assert(vote.status === 200, "التصويت على الاستفتاء يعمل", `status=${vote.status}`);

  const afterVote = (await adminMeta())?.totalVotes ?? -1;
  assert(afterVote === before + 1, "meta.totalVotes ضاعف صوت الاستفتاء", `قبل=${before} بعد=${afterVote}`);

  const del = await api("POST", "/api/qa/admin/poll", { token, body: { action: "delete", sessionId, pollId } });
  assert(del.status === 200, "حذف الاستفتاء يعمل", `status=${del.status}`);

  const afterDelete = (await adminMeta())?.totalVotes ?? -1;
  assert(afterDelete === before, "meta.totalVotes رجع بعد حذف الاستفتاء", `قبل=${before} بعد=${afterDelete}`);

  const delAgain = await api("POST", "/api/qa/admin/poll", { token, body: { action: "delete", sessionId, pollId } });
  assert(delAgain.status === 404, "حذف استفتاء غير موجود يُرفض", `status=${delAgain.status}`);
}

/* ---------- المرحلة 14: الأسئلة المرفوضة قابلة لإعادة الاعتماد ---------- */

async function testReapprovedQuestion() {
  section("12) إعادة اعتماد سؤال مرفوض");

  const questionId = questionIds.rejected;
  if (!questionId) {
    assert(false, "السؤال المرفوض متاح", "لا يوجد سؤال مرفوض");
    return;
  }

  const live = await api("GET", "/api/qa/session/current?view=live");
  assert(
    !(JSON.stringify(live.json ?? {}).includes(MARK.rejected)),
    "السؤال المرفوض مخفي قبل إعادة الاعتماد"
  );

  const approve = await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "approve", sessionId, questionId },
  });
  assert(approve.status === 200 && approve.json?.result?.status === "approved", "إعادة الاعتماد تعمل", `status=${approve.status}`);

  const liveAfter = await api("GET", "/api/qa/session/current?view=live");
  assert(
    JSON.stringify(liveAfter.json ?? {}).includes(MARK.rejected),
    "السؤال يظهر للجمهور بعد إعادة الاعتماد"
  );

  // نعيده مرفوضاً ليبقى الاختبارات الأخرى كما هي
  await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "reject", sessionId, questionId },
  });
}

/* ---------- المرحلة 15: ترقية ملف الأصوات القديم ---------- */

async function testLegacyVoteStoreMigration() {
  section("13) ترقية qa-votes.json القديم (بلا questionVotes)");

  // ⚠️ لا نتخطّى هذا الفحص صامتاً. كان يُتخطّى حين لا يكون QA_DATA_DIR
  // مضبوطاً في البيئة (مثل `npm run test:qa:api`)، فينقص العدد بـ assertionين
  // دون أي indication — فحص ملفات هو بالضبط ما لا يغطّيه أي فحص آخر.
  const dataDir = resolveDataDir();
  if (!existsSync(dataDir)) {
    assert(false, "مجلد بيانات الاختبار موجود", "المسار غير موجود: " + dataDir);
    return;
  }

  const { join } = await import("node:path");
  const { promises: fsp } = await import("node:fs");
  const votesPath = join(dataDir, "qa-votes.json");

  let backup = null;
  try {
    backup = await fsp.readFile(votesPath, "utf-8");
  } catch {
    backup = null;
  }

  // الشكل القديم: { "votes": [...] } فقط — بلا questionVotes إطلاقاً
  await fsp.writeFile(votesPath, JSON.stringify({ votes: [] }, null, 2), "utf-8");

  const joiner = await api("POST", "/api/qa/attendee/join", { body: { name: `${run}-LEGACY` } });
  const legacyAttendee = joiner.json?.attendeeId;
  const questionId = questionIds.approved;

  if (!legacyAttendee || !questionId) {
    assert(false, "تهيئة اختبار الترقية", "لا يوجد حاضر/سؤال");
  } else {
    const vote = await api("POST", "/api/qa/question/vote", {
      body: { attendeeId: legacyAttendee, questionId },
    });
    assert(
      vote.status === 200,
      "التصويت ينجح رغم ملف أصوات قديم بلا questionVotes",
      `status=${vote.status} ${JSON.stringify(vote.json).slice(0, 140)}`
    );

    // والملف ترقّى نفسه على القرص
    const onDisk = JSON.parse(await fsp.readFile(votesPath, "utf-8"));
    assert(Array.isArray(onDisk?.questionVotes), "الملف رُقّي واحتوى questionVotes");
  }

  if (backup === null) {
    await fsp.rm(votesPath, { force: true });
  } else {
    await fsp.writeFile(votesPath, backup, "utf-8");
  }
}

/* ---------- المرحلة 14: التحكم بالشاشة الكبيرة ---------- */

/**
 * تحقّق من طبقة HTTP كاملة: الحارس، الاستبدال، وسقوط المؤشر غير المؤهَّل.
 * (منطق الترتيب نفسه مغطّى وحدوياً في `qa-unit.mjs`.)
 */
async function testScreenControl() {
  section("14) تحكّم الشاشة: يدوي افتراضي، والتالي، وسقوط غير المؤهَّل");

  const screenOf = async () => {
    const snap = await api("GET", "/api/qa/session/current?view=live");
    return snap.json?.screen ?? null;
  };

  const first = await screenOf();
  assert(first && first.mode === "manual", "الوضع الافتراضي يدوي", JSON.stringify(first));
  assert(
    first && first.slide?.kind === "hold",
    "الشريحة الافتراضية hold",
    JSON.stringify(first?.slide)
  );

  // ── سؤال على المسرح: معتمد فوراً + مصدر admin ──────────────────────
  const staged = await api("POST", "/api/qa/admin/screen", {
    token,
    body: {
      action: "createQuestion",
      sessionId,
      text: `سؤال يكتبه المشرف للتجربة ${run}stage`,
      putOnScreen: true,
    },
  });
  assert(staged.status === 200, "createQuestion ينجح", `status=${staged.status} ${JSON.stringify(staged.json).slice(0, 140)}`);
  const stagedId = staged.json?.result?.question?.id;
  assert(!!stagedId, "أعاد معرّف السؤال");
  const stagedRow = await adminQuestion(stagedId);
  assert(stagedRow?.status === "approved", "سؤال الإدارة معتمد فوراً (لا مراجعة لنفسه)", stagedRow?.status);
  assert(stagedRow?.source === "admin", "مصدره admin", stagedRow?.source);
  assert(
    stagedRow?.showOnLive === true && stagedRow?.showOnSpeaker === true,
    "سؤال الإدارة يظهر افتراضياً على الشاشتين"
  );
  let cur = await screenOf();
  assert(cur?.slide?.kind === "question" && cur?.slide?.questionId === stagedId, "putOnScreen يثبّت السؤال", JSON.stringify(cur?.slide));
  assert(cur?.mode === "manual", "-putOnScreen يخرج للوضع اليدوي", cur?.mode);

  // idempotent: نفس السؤال مرتين = نفس الحالة (لا تبديل).
  const again = await api("POST", "/api/qa/admin/screen", {
    token,
    body: { action: "setSlide", sessionId, slide: { kind: "question", questionId: stagedId } },
  });
  assert(again.status === 200, "setSlide المتكرر ينجح", `status=${again.status}`);
  cur = await screenOf();
  assert(cur?.slide?.questionId === stagedId, "setSlide مرتين = نفس النتيجة (idempotent)");

  // ── setMode: الحرفية الصريحة ────────────────────────────────────────
  const auto = await api("POST", "/api/qa/admin/screen", {
    token,
    body: { action: "setMode", sessionId, mode: "auto" },
  });
  assert(auto.status === 200 && (await screenOf())?.mode === "auto", "setMode auto", `status=${auto.status}`);
  const manual = await api("POST", "/api/qa/admin/screen", {
    token,
    body: { action: "setMode", sessionId, mode: "manual" },
  });
  assert(manual.status === 200 && (await screenOf())?.mode === "manual", "setMode manual", `status=${manual.status}`);

  // ── wordCloud ثم clear ──────────────────────────────────────────────
  const wc = await api("POST", "/api/qa/admin/screen", {
    token,
    body: { action: "setSlide", sessionId, slide: { kind: "wordCloud" } },
  });
  assert(wc.status === 200 && (await screenOf())?.slide?.kind === "wordCloud", "شريحة سحابة الكلمات");
  const clr = await api("POST", "/api/qa/admin/screen", { token, body: { action: "clear", sessionId } });
  assert(clr.status === 200 && (await screenOf())?.slide?.kind === "hold", "clear يرجع إلى hold");

  // ── next: يختار من الخادم، قابل للتوقّع ─────────────────────────────
  const n1 = await api("POST", "/api/qa/admin/screen", { token, body: { action: "next", sessionId } });
  assert(n1.status === 200, "next ينجح", `status=${n1.status}`);
  const picked = (await screenOf())?.slide;
  assert(picked?.kind === "question" && !!picked?.questionId, "next يختار سؤالاً مؤهَّلاً", JSON.stringify(picked));
  const n2 = await api("POST", "/api/qa/admin/screen", { token, body: { action: "next", sessionId } });
  const picked2 = (await screenOf())?.slide;
  assert(
    n2.status === 200 && picked2?.questionId !== picked?.questionId,
    "next يتقدّم (لا يبقى على نفس السؤال)",
    JSON.stringify(picked2)
  );

  // ── سقوط المؤشر: سؤال معلّق / مخفي / مرفوض ─────────────────────────
  // الجواب هنا 409 صريح: الصمت كان سيجعل المشرف يظن أن الضغط نجح.
  for (const [label, targetId] of [
    ["معلّق", questionIds.pending],
    ["مرفوض", questionIds.rejected],
    ["مخفي", questionIds.hiddenLive],
  ]) {
    if (!targetId) continue;
    const bad = await api("POST", "/api/qa/admin/screen", {
      token,
      body: { action: "setSlide", sessionId, slide: { kind: "question", questionId: targetId } },
    });
    assert(bad.status === 409, `رفض تثبيت سؤال ${label} بـ409`, `status=${bad.status}`);
    cur = await screenOf();
    assert(cur?.slide?.kind === "hold", `الشريحة رجعت hold بعد رفض ${label}`, JSON.stringify(cur?.slide));
    const serialized = JSON.stringify(cur);
    assert(!serialized.includes(targetId), `لا معرّف ${label} في اللقطة العامة بعد الرفض`);
  }

  // ── الحرس: بلا توكن، وبصلاحية غير إدارية ───────────────────────────
  const anon = await api("POST", "/api/qa/admin/screen", {
    body: { action: "clear", sessionId },
  });
  assert(anon.status === 401, "بلا توكن = 401", `status=${anon.status}`);

  const viewer = await ensureViewerToken();
  if (viewer) {
    const denied = await api("POST", "/api/qa/admin/screen", {
      token: viewer,
      body: { action: "clear", sessionId },
    });
    assert(denied.status === 403, "دور viewer = 403 على تحكّم الشاشة", `status=${denied.status}`);
  }

  // ── payload ناقص: setMode بلا mode ────────────────────────────────
  const invalid = await api("POST", "/api/qa/admin/screen", {
    token,
    body: { action: "setMode", sessionId },
  });
  assert(invalid.status === 400, "setMode بلا mode = 400", `status=${invalid.status}`);

  // ── تسوية المؤشر عند فقدان الأهلية: إخفاء السؤال المثبَّت يُسقطه ──
  // (بلا هذا كانت اللوحة تكتب «المعروض الآن: السؤال X» بعد إخفائه)
  await api("POST", "/api/qa/admin/screen", {
    token,
    body: { action: "setSlide", sessionId, slide: { kind: "question", questionId: stagedId } },
  });
  assert((await screenOf())?.slide?.questionId === stagedId, "ثبّتنا السؤال من جديد");
  await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "setVisibility", sessionId, questionId: stagedId, showOnLive: false },
  });
  cur = await screenOf();
  assert(cur?.slide?.kind === "hold", "إخفاء السؤال المثبَّت يُسقط الشريحة إلى hold", JSON.stringify(cur?.slide));

  // نُعيد الجلسة إلى حالة محايدة للاختبارات التالية.
  await api("POST", "/api/qa/admin/screen", { token, body: { action: "clear", sessionId } });
}

/* ---------- المرحلة 15: الإجابات المفتوحة ---------- */

async function testOpenAnswers() {
  section("15) الإجابات المفتوحة: معلّقة حتى المراجعة، ولا تتسرّب للجهة العامة");

  if (!attendeeId || !questionIds.approved) {
    assert(false, "الأسئلة والحضور متاحون لاختبار الإجابات", "التهيئة ناقصة");
    return;
  }
  const target = questionIds.approved;
  const snapLive = async () => (await api("GET", "/api/qa/session/current?view=live")).json;
  const answersOf = async (id) => {
    const snap = await snapLive();
    return (snap?.questions ?? []).find((q) => q.id === id)?.answers ?? [];
  };

  // ── إضافة: من واجهة الحاضر نفسها ─────────────────────────────
  const text = `جواب مفتوح من الحاضر للتجربة ${run}answer`;
  const created = await api("POST", "/api/qa/question/answer", {
    body: { questionId: target, attendeeId, text },
  });
  assert(created.status === 200, "إضافة جواب تنجح", `status=${created.status} ${JSON.stringify(created.json).slice(0, 160)}`);
  assert(created.json?.answer?.status === "pending", "يبدأ معلّقاً", created.json?.answer?.status);
  const answerId = created.json?.answer?.id;
  assert(!!answerId, "أعاد معرّف الجواب");

  // ⚠️ الأهم: المعلّق لا يظهر في اللقطة العامة ولا في شاشة المتحدث.
  assert((await answersOf(target)).length === 0, "الجواب المعلّق لا يظهر للجمهور", JSON.stringify(await answersOf(target)));
  const speakerSnap = (await api("GET", "/api/qa/session/current?view=speaker")).json;
  const speakerAnswers = (speakerSnap?.questions ?? []).find((q) => q.id === target)?.answers ?? [];
  assert(speakerAnswers.length === 0, "ولا للمتحدث قبل الاعتماد", JSON.stringify(speakerAnswers));
  assert(!JSON.stringify(speakerSnap).includes(text), "نصّ الجواب المعلّق لا يخرج من الخادم");
  assert(!JSON.stringify(speakerSnap).includes(attendeeId), "معرّف الحاضر لا يخرج مع الإجابات");

  // ── الاعتماد: يظهر للمتحدث فقط ────────────────────────────────
  const approve = await api("POST", "/api/qa/admin/answer", {
    token,
    body: { action: "approve", sessionId, questionId: target, answerId },
  });
  assert(approve.status === 200, "اعتماد الجواب ينجح", `status=${approve.status} ${JSON.stringify(approve.json).slice(0, 140)}`);
  const approvedSpeaker = (await api("GET", "/api/qa/session/current?view=speaker")).json;
  const approvedAnswers = (approvedSpeaker?.questions ?? []).find((q) => q.id === target)?.answers ?? [];
  assert(approvedAnswers.length === 1 && approvedAnswers[0].id === answerId, "يظهر للمتحدث بعد الاعتماد", JSON.stringify(approvedAnswers));
  assert(approvedAnswers[0].text === text, "نصّه سليماً");
  assert(!("attendeeId" in approvedAnswers[0]), "بلا attendeeId في اللقطة العامة");

  // idempotent: إعادة الاعتماد لا تغيّر شيئاً.
  const approve2 = await api("POST", "/api/qa/admin/answer", {
    token,
    body: { action: "approve", sessionId, questionId: target, answerId },
  });
  assert(approve2.status === 200, "إعادة الاعتماد تنجح (idempotent)", `status=${approve2.status}`);

  // ── الاستبدال يعيد الحالة إلى pending (نصّ جديد لم يُراجَع) ─────
  const revised = `جواب مصحَّح بعد الاعتماد ${run}answer2`;  const replaced = await api("POST", "/api/qa/question/answer", {
    body: { questionId: target, attendeeId, text: revised },
  });
  assert(replaced.status === 200 && replaced.json?.replaced === true, "إعادة الكتابة تستبدل", `status=${replaced.status} ${JSON.stringify(replaced.json).slice(0, 140)}`);
  assert(replaced.json?.answer?.status === "pending", "النسخة المعدّلة ترجع معلّقة", replaced.json?.answer?.status);
  const afterRevise = (await api("GET", "/api/qa/session/current?view=speaker")).json;
  const afterReviseAnswers = (afterRevise?.questions ?? []).find((q) => q.id === target)?.answers ?? [];
  assert(afterReviseAnswers.length === 0, "النصّ المعدّل يختفي عن المتحدث حتى يُعتمد", JSON.stringify(afterReviseAnswers));

  const row = await adminQuestion(target);
  const mine = (row?.answers ?? []).filter((a) => a.id === answerId);
  assert(mine.length === 1, "جواب واحد لكل (حاضر × سؤال) — لا جدار إجابات", String((row?.answers ?? []).length));
  assert(mine[0]?.text === revised, "النصّ المستبدل محفوظ", mine[0]?.text);
  assert(mine[0]?.status === "pending", "وله حالة pending", mine[0]?.status);
  assert(mine[0]?.approvedAt === undefined, "ووقت الاعتماد مُسح", String(mine[0]?.approvedAt));

  // ── الرفض ─────────────────────────────────────────────────────
  const reject = await api("POST", "/api/qa/admin/answer", {
    token,
    body: { action: "reject", sessionId, questionId: target, answerId },
  });
  assert(reject.status === 200, "رفض الجواب ينجح", `status=${reject.status}`);
  const rejectedSpeaker = (await api("GET", "/api/qa/session/current?view=speaker")).json;
  const rejectedAnswers = (rejectedSpeaker?.questions ?? []).find((q) => q.id === target)?.answers ?? [];
  assert(rejectedAnswers.length === 0, "المرفوض لا يظهر للمتحدث", JSON.stringify(rejectedAnswers));

  // ── الحالات المرفوضة من الإجابة نفسها ────────────────────────
  const notMine = await api("POST", "/api/qa/question/answer", {
    body: { questionId: target, attendeeId: `${run}-NOT-AN-ATTENDEE`, text: "انتحال حضور" },
  });
  assert(notMine.status === 403, "معرّف حضور غير مسجَّل = 403", `status=${notMine.status}`);

  for (const [label, id] of [["معلّق", questionIds.pending], ["مرفوض", questionIds.rejected]]) {
    if (!id) continue;
    const onClosed = await api("POST", "/api/qa/question/answer", {
      body: { questionId: id, attendeeId, text: `جواب على سؤال ${label} ${run}` },
    });
    assert(onClosed.status === 404, `لا جواب على سؤال ${label} (=404 بلا كشف تفاصيل)`, `status=${onClosed.status}`);
  }

  const missing = await api("POST", "/api/qa/question/answer", {
    body: { questionId: "q_does_not_exist", attendeeId, text: "سؤال غير موجود" },
  });
  assert(missing.status === 404, "سؤال غير موجود = 404", `status=${missing.status}`);

  const shortText = await api("POST", "/api/qa/question/answer", {
    body: { questionId: target, attendeeId, text: "ا" },
  });
  assert(shortText.status === 400, "نصّ قصير = 400", `status=${shortText.status}`);

  const longText = await api("POST", "/api/qa/question/answer", {
    body: { questionId: target, attendeeId, text: "ط".repeat(501) },
  });
  assert(longText.status === 400, "نصّ أطول من 500 = 400", `status=${longText.status}`);

  // ── حرس الإشراف ───────────────────────────────────────────────
  const anon = await api("POST", "/api/qa/admin/answer", {
    body: { action: "approve", sessionId, questionId: target, answerId },
  });
  assert(anon.status === 401, "اعتماد بلا توكن = 401", `status=${anon.status}`);
  const viewer = await ensureViewerToken();
  if (viewer) {
    const denied = await api("POST", "/api/qa/admin/answer", {
      token: viewer,
      body: { action: "approve", sessionId, questionId: target, answerId },
    });
    assert(denied.status === 403, "دور viewer = 403 على إشراف الإجابات", `status=${denied.status}`);
  }
  const badId = await api("POST", "/api/qa/admin/answer", {
    token,
    body: { action: "approve", sessionId, questionId: target, answerId: "a_nope" },
  });
  assert(badId.status === 404, "معرّف جواب غير موجود = 404", `status=${badId.status}`);
}

/* ---------- التنظيف ---------- */

async function cleanup() {
  if (!token || !sessionId) return;
  await api("POST", "/api/qa/admin/session", { token, body: { action: "delete", sessionId } });
}

/* ---------- التشغيل ---------- */

async function main() {
  console.log(`مجموعة اختبارات Q&A — ${BASE}`);
  console.log("═".repeat(64));

  let setupError = null;
  try {
    await setup();
  } catch (err) {
    setupError = err;
  }

  if (!setupError) {
    try {
      await testPublicSnapshotParity();
      await testNoLeak();
      await testViewValidation();
      await testNoDuplicateFrames();
      await testAttendeeIdentity();
      await testAttendeeReclaimSecret();
      await testRawTextStorage();
      await testQuestionVoting();
      await testConcurrentVotes();
      await testSurveySecurity();
      await testExportSecurity();
      await testVisibilityFlags();
      await testScreenControl();
      await testOpenAnswers();
      await testAnswerIdempotency();
      await testPollDeleteRecomputesMeta();
      await testReapprovedQuestion();
      await testLegacyVoteStoreMigration();
    } catch (err) {
      failed += 1;
      failures.push(`استثناء غير متوقع: ${err?.stack || err}`);
      console.log(`  FAIL  استثناء غير متوقع: ${err?.message || err}`);
    }
  } else {
    failed += 1;
    failures.push(`فشل التهيئة: ${setupError?.message || setupError}`);
    console.log(`  FAIL  فشل التهيئة: ${setupError?.message || setupError}`);
  }

  await cleanup();

  console.log(`\n${"═".repeat(64)}`);
  console.log(`نجح: ${passed}   فشل: ${failed}`);
  if (failures.length) {
    console.log("\nالإخفاقات:");
    for (const f of failures) console.log(`  • ${f}`);
  }
  process.exit(failed === 0 ? 0 : 1);
}

main();
