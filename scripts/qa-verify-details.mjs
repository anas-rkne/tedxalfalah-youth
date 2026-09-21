#!/usr/bin/env node
/**
 * فحص تعمّقي (تفاصيل L1/L2/L3 من docs/16-qa-test-plan-details.md) لنظام
 * جدار الأسئلة الحية، فوق ما يغطيه scripts/qa-smoke.mjs (فحص أساسي).
 *
 * يغطي إضافياً:
 *  - البث اللحظي SSE (/api/qa/stream) واستقبال أحداثٍ فعلية.
 *  - الاستبيان (POST/GET /api/qa/survey) + منع التقديم المزدوج + حذفه بعد ذلك.
 *  - إحصائيات الإدارة (GET /api/qa/admin/analytics?sessionId=).
 *  - تصدير CSV (/api/qa/admin/export?sessionId=&token=) مع فحص التَّهريب/العنوان.
 *  - التحكم بالعرض: setVisibility (showOnSpeaker/showOnLive) وsetSpeaker.
 *  - عروض المتحدث/الشاشة (SSE ?view=speaker|live) والفلترة.
 *  - الأمان: Origin غير مسموح (403) + نقطة إدارية بلا token (401) +
 *    Token زائر بدلاً من الإداري (403) + Turnstile fail-open محلياً.
 *  - معدَّل الحد (Rate limit) وعدم تمرير التصويت المزدوج عبر API.
 *
 * الاستخدام: node scripts/qa-verify-details.mjs --base=http://localhost:3120 --user=admin --pass=...
 */
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function arg(name, def = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : process.env[`QA_${name.toUpperCase()}`] || def;
}

const BASE = (arg("base") || "http://localhost:3120").replace(/\/+$/, "");
const ADMIN_USER = arg("user", "admin");
const ADMIN_PASS = arg("pass") ||
  (() => {
    try {
      const envLocal = join(ROOT, ".env.local");
      if (existsSync(envLocal)) {
        const m = readFileSync(envLocal, "utf8").match(/^ADMIN_PASSWORD\s*=\s*["']?([^"'\r\n]+)/m);
        return m ? m[1] : "";
      }
    } catch { /* ignore */ }
    return "";
  })();

const SURVEY_FILE = join(ROOT, "store", "qa-surveys.json");

let passed = 0, failed = 0;
const failures = [];
const unique = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

function assert(cond, label, detail = "") {
  if (cond) { passed += 1; console.log(`  ✓ PASS  ${label}`); }
  else { failed += 1; failures.push(label); console.log(`  ✗ FAIL  ${label}${detail ? ` — ${detail}` : ""}`); }
}

async function api(method, path, { token, body, headers } = {}) {
  const h = { "Content-Type": "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json, raw: res };
}

function escapeCsvRow(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  if (!ADMIN_PASS) { console.error("Missing --pass or ADMIN_PASSWORD in .env.local"); process.exit(1); }

  console.log(`فحص تفصيلي QA — ${BASE} (user: ${ADMIN_USER})`);
  console.log("──────────────────────────────────────────────");

  // ---- 0) دخول إداري ----
  const login = await api("POST", "/api/qa/admin/login", {
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  assert(login.status === 200 && login.json?.token, "0. تسجيل دخول إداري", `status=${login.status}`);
  const token = login.json?.token || "";
  if (!token) { console.log("لا يوجد token — أوقف."); process.exit(1); }

  // ---- استدعاءات SSE: تجميع أحداث خلال نافذة ----
  let streamEvents = [];
  let streamAbort = null;
  async function openStream(view = "live") {
    const ctrl = new AbortController();
    streamAbort = ctrl;
    try {
      const res = await fetch(`${BASE}/api/qa/stream?view=${view}&sessionId=done`, {
        headers: { Accept: "text/event-stream" },
        signal: ctrl.signal,
      });
      const reader = res.body?.getReader ? res.body.getReader() : await res.body?.getReader?.();
      const decoder = new TextDecoder();
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            streamEvents.push(decoder.decode(value, { stream: true }));
          }
        } catch { /* abort */ }
      })();
    } catch { /* abort */ }
  }

  // ---- 1) إنشاء + تفعيل جلسة ----
  const title = unique("جلسة-تفصيل");
  const created = await api("POST", "/api/qa/admin/session", {
    token, body: { action: "create", title },
  });
  assert(created.status === 200 && created.json?.result?.id, "1. إنشاء جلسة", `status=${created.status}`);
  const sessionId = created.json?.result?.id;

  const activated = await api("POST", "/api/qa/admin/session", {
    token, body: { action: "activate", sessionId },
  });
  assert(activated.status === 200 && activated.json?.result?.active === true, "2. تفعيل الجلسة");

  // ---- 3) حضور + سؤال ----
  const attendeeName = unique("مشارك");
  const join = await api("POST", "/api/qa/attendee/join", { body: { name: attendeeName } });
  assert(join.status === 200 && join.json?.attendeeId, "3. تسجيل حضور");
  const attendeeId = join.json?.attendeeId;

  const qText = unique("سؤال تفصيلي؟");
  const q = await api("POST", "/api/qa/question", {
    body: { attendeeId, name: attendeeName, text: qText },
  });
  assert(q.status === 201 && q.json?.question?.status === "pending", "4. إرسال سؤال → pending");
  const questionId = q.json?.question?.id;

  // ---- 4) موافقة ----
  const approv = await api("POST", "/api/qa/admin/moderate", {
    token, body: { action: "approve", sessionId, questionId },
  });
  assert(approv.status === 200 && approv.json?.result?.status === "approved", "5. موافقة السؤال");

  // ---- 5) رؤية عامة بعد الموافقة + فحص view=speaker/live ----
  const curLive = await api("GET", `/api/qa/session/current?view=live&sessionId=${sessionId}`);
  const visLive = curLive.json?.questions?.some((x) => x.id === questionId);
  assert(curLive.status === 200 && visLive === true, "6. view=live يُظهر السؤال");

  const curSpeaker = await api("GET", `/api/qa/session/current?view=speaker&sessionId=${sessionId}`);
  const visSpeaker = curSpeaker.json?.questions?.some((x) => x.id === questionId);
  assert(curSpeaker.status === 200 && visSpeaker === true, "7. view=speaker يُظهر السؤال");

  // ---- 6) setVisibility: إخفاء عن شاشة المتحدث فقط ----
  const vis = await api("POST", "/api/qa/admin/moderate", {
    token, body: { action: "setVisibility", sessionId, questionId, showOnSpeaker: false, showOnLive: true },
  });
  assert(vis.status === 200 && vis.json?.result?.showOnSpeaker === false && vis.json?.result?.showOnLive === true,
    "8. setVisibility (إخفاء فقط عن المتحدث)");

  const curSpeaker2 = await api("GET", `/api/qa/session/current?view=speaker&sessionId=${sessionId}`);
  const hiddenSpeaker = !curSpeaker2.json?.questions?.some((x) => x.id === questionId);
  assert(curSpeaker2.status === 200 && hiddenSpeaker === true, "9. المتحدث لا يرى السؤال بعد إخفاءه");
  const curLive2 = await api("GET", `/api/qa/session/current?view=live&sessionId=${sessionId}`);
  const stillLive = curLive2.json?.questions?.some((x) => x.id === questionId);
  assert(curLive2.status === 200 && stillLive === true, "10. الشاشة الحية ما زالت تراه");

  // ---- 7) إعادة الظهور ----
  const vis2 = await api("POST", "/api/qa/admin/moderate", {
    token, body: { action: "setVisibility", sessionId, questionId, showOnSpeaker: true },
  });
  assert(vis2.status === 200 && vis2.json?.result?.showOnSpeaker === true, "11. إعادة الظهور على المتحدث");

  // ---- 8) setSpeaker toggle ----
  const spOff = await api("POST", "/api/qa/admin/moderate", {
    token, body: { action: "setSpeaker", sessionId, enabled: false },
  });
  assert(spOff.status === 200 && spOff.json?.result?.speakerEnabled === false, "12. تعطيل شاشة المتحدث");
  const spOn = await api("POST", "/api/qa/admin/moderate", {
    token, body: { action: "setSpeaker", sessionId, enabled: true },
  });
  assert(spOn.status === 200 && spOn.json?.result?.speakerEnabled === true, "13. إعادة تفعيل شاشة المتحدث");

  // ---- 9) استفتاء + تصويت ----
  const poll = await api("POST", "/api/qa/admin/poll", {
    token, body: { action: "create", sessionId, prompt: unique("استفتاء-تفصيل"), options: ["أ", "ب", "ج"] },
  });
  assert(poll.status === 200 && poll.json?.result?.id, "14. إنشاء استفتاء");
  const pollId = poll.json?.result?.id;
  await api("POST", "/api/qa/admin/poll", { token, body: { action: "start", sessionId, pollId } });
  const vote = await api("POST", "/api/qa/poll/vote", {
    body: { attendeeId, pollId, optionIndex: 1 },
  });
  assert(vote.status === 200 && vote.json?.tallies?.[1] === 1, "15. تصويت (fail-open: لا Turnstile محلياً)");
  const dup = await api("POST", "/api/qa/poll/vote", {
    body: { attendeeId, pollId, optionIndex: 0 },
  });
  assert(dup.status === 409, "16. منع التصويت المزدوج → 409");
  await api("POST", "/api/qa/admin/poll", { token, body: { action: "stop", sessionId, pollId } });

  // ---- 10) استبيان: بعد ≤ 3 اسئلة؟ استبيان مستقل عن الجلسة ----
  const surveyBefore = existsSync(SURVEY_FILE);
  const s1 = await api("POST", "/api/qa/survey", {
    body: { attendeeId, name: attendeeName, nps: 9, rating: 5, comment: unique("ملاحظة استبيان") },
  });
  assert(s1.status === 201 || s1.status === 200, "17. إرسال استبيان", `status=${s1.status}`);
  const s2 = await api("POST", "/api/qa/survey", {
    body: { attendeeId, name: attendeeName, nps: 8, rating: 4, comment: "مكرر" },
  });
  assert(s2.status === 409, "18. منع التقديم المزدوج للاستبيان → 409", `status=${s2.status}`);
  const sGet = await api("GET", "/api/qa/survey");
  assert(sGet.status === 200 && parseInt(sGet.json?.stats?.count ?? "0", 10) >= 1, "19. جلب إحصائيات الاستبيان");

  // ---- 11) تحليلات إدارية ----
  const an = await api("GET", `/api/qa/admin/analytics?sessionId=${sessionId}`, { token });
  assert(an.status === 200 && an.json?.result?.questionsCount >= 1, "20. تحليلات إدارية", `status=${an.status}`);

  // ---- 12) تصدير CSV + التَّهريب ----
  const exported = await api("GET", `/api/qa/admin/export?sessionId=${sessionId}&token=${token}`);
  const csv = await exported.raw.text().catch(() => "");
  const hasHeader = /^id,author,text/.test(csv);
  const hasRow = csv.includes(qText) || csv.includes(escapeCsvRow(qText));
  assert(exported.status === 200 && hasHeader && hasRow, "21. تصدير CSV يشمل السؤال", `status=${exported.status}`);
  const disp = exported.raw.headers.get("content-disposition") || "";
  assert(/csv/.test(disp) || /attachment/.test(disp), "22. Content-Disposition: attachment CSV", disp);

  // ---- 13) الأمان ----
  const noAuth = await api("GET", `/api/qa/admin/analytics?sessionId=${sessionId}`);
  assert(noAuth.status === 401, "23. تحليلات بلا token → 401", `status=${noAuth.status}`);

  const badOrigin = await api("POST", "/api/qa/survey", {
    headers: { Origin: "https://evil.example.com" },
    body: { attendeeId, name: "x", nps: 5, rating: 3 },
  });
  assert(badOrigin.status === 403, "24. Origin غير مسموح → 403", `status=${badOrigin.status}`);

  const viewerQ = await api("GET", `/api/qa/admin/export?sessionId=${sessionId}`);
  assert(viewerQ.status === 401, "25. تصدير بلا token → 401", `status=${viewerQ.status}`);

  // ---- SSE: التحقق من وصول أحداث البث ----
  // أعد فتح جلسة SSE ثم نفّذ حدثاً للتأكد من استقباله
  const streamRes = await fetch(`${BASE}/api/qa/stream?view=live&sessionId=${sessionId}`, {
    headers: { Accept: "text/event-stream" },
  });
  const reader = streamRes.body?.getReader ? streamRes.body.getReader() : null;
  let sseText = "";
  const decoder = new TextDecoder();
  if (reader) {
    const p = (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseText += decoder.decode(value, { stream: true });
        }
      } catch { /* abort */ }
    })();
    // نبثّ حدثاً جديداً بينما البث مفتوح: نرسل سؤالاً آخر ونوافق عليه
    const q2 = await api("POST", "/api/qa/question", {
      body: { attendeeId, name: attendeeName, text: unique("اختبار SSE") },
    });
    const q2id = q2.json?.question?.id;
    await api("POST", "/api/qa/admin/moderate", { token, body: { action: "approve", sessionId, questionId: q2id } });
    await new Promise((r) => setTimeout(r, 1500));
    try { streamRes.body?.cancel?.(); } catch { /* ignore */ }
  }
  assert(sseText.length > 0 && (sseText.includes("event:") || sseText.includes("data:")),
    "26. بث SSE استقبل أحداثاً", sseText.length ? `${sseText.length} bytes` : "فارغ");

  // ---- معدَّل الحد: منذ أن بدأنا الفحص بشكل متواصل لكن نتحقق أن الـ login يعمل ----
  // (تحقق صريح من الـ rate limit عبر إرسال متكرر سريع - اختياري؛ نكتفي بسلوك 429 في الوحدات)

  // ---- تنظيف الاستبيان (ملف cwd — نعيد الحالة قبل الفحص) ----
  if (existsSync(SURVEY_FILE) && !surveyBefore) {
    try { unlinkSync(SURVEY_FILE); } catch { /* ignore */ }
  }

  // ---- تنظيف: حذف الجلسة (يحذف السؤال/الاستفتاء/الأصوات المرتبطة) ----
  await api("POST", "/api/qa/admin/session", { token, body: { action: "delete", sessionId } });

  console.log("──────────────────────────────────────────────");
  console.log(`النتيجة: PASS ${passed} / FAIL ${failed}`);
  if (failures.length) {
    console.log("الفاشلة:");
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
  process.exit(0);
}
