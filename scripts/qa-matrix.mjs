/**
 * فاحص المصفوفة (Layer 2b) — الحالات الحديّة والسلبية لكل مسار.
 *
 * 🎯 لماذا ملف منفصل عن `qa-contract.mjs`: ذلك يغطّي **المسار السعيد**
 * ودلالات الرؤية. وهذا يغطّي ما لا يظهر إلا فيokan RFC by inspection:
 * الحدود الدنيا/العليا لكل حقل، وكل قيمة `action`، وكل رمز خطأ، وغلاق
 * دورة حياة الاستفتاء، وحقن الصيغ في CSV، وتجميع الاستبيان.
 *
 * ⚠️ قاعدة هذا الملف: **لا يُكتب توقّع قبل قراءة المصدر**. كل حالة هنا
 * مقتبسة من رقم سطر أو من zod schema، ولمدة كل اختبار سبب:
 *
 *   - مصفوفة انحدار (الحدود) تفشل عند تغيير قيد في الإنتاج، فتُنبِّه.
 *   - اختبار يمرّ لسبب غير الذي يفحصه = اختبار عديم القيمة. كل اختبار هنا
 *     يحمل `assert` على القيمة نفسها لا على "لم يَنهار".
 */
import assert from "node:assert/strict";

const BASE = process.env.QA_TEST_BASE_URL || "http://localhost:3222";
const ADMIN_PW = process.env.QA_ADMIN_PASSWORD || "qa-test-admin-pw";
const VIEWER_PW = process.env.QA_VIEWER_PASSWORD || "qa-test-viewer-pw";

let passed = 0;
const failures = [];
let currentSection = "";

function section(title) {
  currentSection = title;
  console.log(`\n${title}`);
}

async function t(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failures.push({ section: currentSection, name, err });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message.split("\n")[0]}`);
  }
}

/* ── أدوات ── */

const H = (extra = {}) => ({ "Content-Type": "application/json", ...extra });

async function login(username, password) {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ username, password }),
  });
  return res.ok ? (await res.json()).token || null : null;
}

const adminToken = await login("admin", ADMIN_PW);
const viewerToken = await login("viewer", VIEWER_PW);
if (!adminToken) {
  console.error("\n⛔ admin login failed — الخادم ليس في وضع العزل المحلي.");
  process.exit(1);
}
const AUTH = { authorization: `Bearer ${adminToken}` };
const VIEWAUTH = { authorization: `Bearer ${viewerToken}` };

async function post(path, body, headers = AUTH) {
  return fetch(`${BASE}${path}`, { method: "POST", headers: H(headers), body: JSON.stringify(body) });
}
/** جسم JSON تالف — لا `JSON.stringify` هنا وإلا لم يكن تالفاً. */
async function postRaw(path, raw, headers = AUTH) {
  return fetch(`${BASE}${path}`, { method: "POST", headers: H(headers), body: raw });
}
async function get(path, headers = AUTH) {
  return fetch(`${BASE}${path}`, { headers });
}
async function del(path, headers = AUTH) {
  return fetch(`${BASE}${path}`, { method: "DELETE", headers });
}
const j = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text.slice(0, 200) };
  }
};

let sessionId = null;

async function adminState() {
  const data = await j(await get("/api/qa/admin/questions"));
  return data;
}
const findSession = (state) => state.sessions.find((s) => s.id === sessionId);
const findQuestion = (state, id) => findSession(state).questions.find((q) => q.id === id);
const findPoll = (state, id) => findSession(state).polls.find((p) => p.id === id);

async function join(name) {
  const res = await post("/api/qa/attendee/join", { name }, {});
  return { status: res.status, body: await j(res) };
}

async function ask(attendeeId, text, extra = {}) {
  const res = await post("/api/qa/question", { attendeeId, text, ...extra }, {});
  return { status: res.status, body: await j(res) };
}

async function moderate(payload) {
  const res = await post("/api/qa/admin/moderate", payload, AUTH);
  return { status: res.status, body: await j(res) };
}

async function approve(qid) {
  return moderate({ action: "approve", sessionId, questionId: qid });
}

async function setSlide(slide) {
  return post("/api/qa/admin/screen", { action: "setSlide", sessionId, slide }, AUTH);
}

const slide = async () => (await j(await get("/api/qa/session/current?view=live"))).screen?.slide ?? null;
const snap = async (view) => j(await get(`/api/qa/session/current?view=${view}`));

/** نصوص فريدة لكل سؤال حتى لا يبتلعها كاشف المكرر (similarity ≥ 0.75). */
let seq = 0;
const uniq = (seed) => `${seed} q${++seq} zx${Math.random().toString(36).slice(2, 9)}`;

/* ── تهيئة ── */
const created = await j(
  await post("/api/qa/admin/session", { action: "create", title: "matrix", titleAr: "مصفوفة" }, AUTH)
);
sessionId = created.result?.id ?? created.session?.id;
if (!sessionId) {
  console.error("⛔ فشل إنشاء الجلسة:", JSON.stringify(created));
  process.exit(1);
}
await post("/api/qa/admin/session", { action: "activate", sessionId }, AUTH);
const me = await join("matrix-bot");
const attendeeId = me.body.attendeeId;

/* ══ 1. الحدود الدنيا والعليا لكل حقل ══ */
section("1) حدود الحقول (min/max/trim)");

await t("1.1 name فارغ ⇒ 400", async () => {
  const r = await post("/api/qa/attendee/join", { name: "" }, {});
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("1.2 name مسافات فقط ⇒ 400 (trim يفرغه)", async () => {
  const r = await post("/api/qa/attendee/join", { name: "   " }, {});
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("1.3 name بلا حقل ⇒ 400 مع تفاصيل zod", async () => {
  const r = await post("/api/qa/attendee/join", {}, {});
  assert.equal(r.status, 400);
  assert.ok((await j(r)).details, "details مفقودة");
});
await t("1.4 name بطول 60 مقبول", async () => {
  const r = await join("ا".repeat(60));
  assert.equal(r.status, 200, `status=${r.status}`);
});
await t("1.5 name بطول 61 مرفوض", async () => {
  const r = await join("ا".repeat(61));
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("1.6 name يُخزَّن مقصوصاً (trim)", async () => {
  const r = await join("  Bob  ");
  assert.equal(r.status, 200);
  assert.equal(r.body.name, "Bob", `name=${JSON.stringify(r.body.name)}`);
});
await t("1.7 text بطول 301 مرفوض", async () => {
  const r = await ask(attendeeId, uniq("x") + "ا".repeat(300));
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("1.8 name (>60) في حمولة السؤال مرفوض", async () => {
  const r = await ask(attendeeId, uniq("n"), { name: "ا".repeat(61) });
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("1.9 tag (>40) مرفوض", async () => {
  const r = await ask(attendeeId, uniq("tg"), { tag: "ا".repeat(41) });
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("1.10 reclaimSecret (>128) مرفوض", async () => {
  const r = await post("/api/qa/attendee/join", { name: "sec", reclaimSecret: "a".repeat(129) }, {});
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("1.11 عنوان الجلسة (>200) مرفوض", async () => {
  const r = await post("/api/qa/admin/session", { action: "create", title: "ا".repeat(201) }, AUTH);
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("1.12 عنوان الجلسة مسافات فقط ⇒ 400", async () => {
  const r = await post("/api/qa/admin/session", { action: "create", title: "   " }, AUTH);
  assert.equal(r.status, 400, `status=${r.status}`);
});

/* ══ 2. JSON تالف ══ */
section("2) جسم JSON تالف");

/**
 * ⚠️ كل مسار هنا **يعيد 400 بنص `Invalid JSON body`** — وهو نص يظهر في
 * `try { await request.json() } catch` في كل معالج POST. المسارات التي
 * لا تلتقطه ترمي 500، فوجود الفحص نفسه هو ما نحرّسه.
 */
const MALFORMED = [
  ["question", "/api/qa/question"],
  ["join", "/api/qa/attendee/join"],
  ["vote/question", "/api/qa/question/vote"],
  ["vote/poll", "/api/qa/poll/vote"],
  ["answer", "/api/qa/question/answer"],
  ["survey", "/api/qa/survey"],
  ["admin/session", "/api/qa/admin/session"],
  ["admin/moderate", "/api/qa/admin/moderate"],
  ["admin/screen", "/api/qa/admin/screen"],
  ["admin/poll", "/api/qa/admin/poll"],
  ["admin/answer", "/api/qa/admin/answer"],
];
for (const [index, [label, path]] of MALFORMED.entries()) {
  await t(`2.${index + 1} ${label}: JSON تالف ⇒ 400`, async () => {
    const auth = path.startsWith("/api/qa/admin") ? AUTH : {};
    const res = await postRaw(path, '{"broken":', auth);
    assert.equal(res.status, 400, `${path} status=${res.status}`);
    assert.equal((await j(res)).error, "Invalid JSON body", path);
  });
}

/* ══ 3. view الحديّة ══ */
section("3) معامل view: فارغ، غائب، أحرف كبيرة");

await t("3.1 ?view= (فارغ) ⇒ 400 — لا يعود للقيمة الافتراضية", async () => {
  const res = await get("/api/qa/session/current?view=");
  assert.equal(res.status, 400, `status=${res.status}`);
});
await t("3.2 view غائب ⇒ 200 (افتراضي live)ويس (افتراضي)", async () => {
  const res = await get("/api/qa/session/current");
  assert.equal(res.status, 200, `status=${res.status}`);
  assert.equal((await j(res)).ok ?? true, true);
});
await t("3.3 view=LIVE (أحرف كبيرة) ⇒ 400 — الفحص حسّاس لحالة الأحرف", async () => {
  const res = await get("/api/qa/session/current?view=LIVE");
  assert.equal(res.status, 400, `status=${res.status}`);
});
await t("3.4 view بنقطة مرور ⇒ 400", async () => {
  const res = await get("/api/qa/session/current?view=../../etc/passwd");
  assert.equal(res.status, 400, `status=${res.status}`);
});
await t("3.5 المعامل المكرّر: الأول يفوز", async () => {
  const res = await get("/api/qa/session/current?view=live&view=audience");
  assert.equal(res.status, 200);
});
await t("3.6 الاستجابة تحمل Cache-Control: no-store", async () => {
  const res = await get("/api/qa/session/current?view=live");
  assert.equal(res.headers.get("cache-control"), "no-store");
});
await t("3.7 استجابة الخطأ 400 أيضاً no-store", async () => {
  const res = await get("/api/qa/session/current?view=zzz");
  assert.equal(res.status, 400);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

/* ══ 4. دورة حياة الاستفتاء ══ */
section("4) دورة حياة الاستفتاء (create/start/stop/showResults/delete)");

const pollCreate = async (options = ["A", "B"], extra = {}) => {
  const res = await post("/api/qa/admin/poll", { action: "create", sessionId, prompt: "P", options, ...extra }, AUTH);
  return { status: res.status, body: await j(res) };
};

await t("4.1 استفتاء جديد: active=false, showResults=false, tallies صفرية", async () => {
  const r = await pollCreate();
  assert.equal(r.status, 200, `status=${r.status}`);
  const p = findPoll(await adminState(), r.body.result.id);
  assert.equal(p.active, false);
  assert.equal(p.showResults, false);
  assert.deepEqual(p.tallies, [0, 0]);
});
await t("4.2 التصويت قبل start ⇒ 409 poll-closed", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  const v = await post("/api/qa/poll/vote", { attendeeId, pollId: pid, optionIndex: 0 }, {});
  assert.equal(v.status, 409, `status=${v.status}`);
  assert.equal((await j(v)).error, "Poll is closed");
});
await t("4.3 start ثم التصويت ⇒ 200 مع total", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  const v = await post("/api/qa/poll/vote", { attendeeId, pollId: pid, optionIndex: 1 }, {});
  const body = await j(v);
  assert.equal(v.status, 200, `status=${v.status}`);
  assert.equal(body.total, 1, `total=${body.total}`);
});
await t("4.4 التصويت المكرر لا يغيّر tallies", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  await post("/api/qa/poll/vote", { attendeeId, pollId: pid, optionIndex: 0 }, {});
  const before = JSON.stringify(findPoll(await adminState(), pid).tallies);
  const v = await post("/api/qa/poll/vote", { attendeeId, pollId: pid, optionIndex: 1 }, {});
  assert.equal(v.status, 409, `status=${v.status}`);
  assert.equal((await j(v)).error, "You have already voted on this poll");
  const after = JSON.stringify(findPoll(await adminState(), pid).tallies);
  assert.equal(after, before, `tallies تغيّرت: ${before} ⇒ ${after}`);
});
await t("4.5 optionIndex خارج المدى ⇒ 400 invalid-option", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  const v = await post("/api/qa/poll/vote", { attendeeId, pollId: pid, optionIndex: 5 }, {});
  assert.equal(v.status, 400, `status=${v.status}`);
  assert.equal((await j(v)).error, "Invalid option");
});
await t("4.6 optionIndex سالب/كسري/نصّي ⇒ 400 من zod", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  for (const bad of [-1, 1.5, "2"]) {
    const v = await post("/api/qa/poll/vote", { attendeeId, pollId: pid, optionIndex: bad }, {});
    assert.equal(v.status, 400, `optionIndex=${JSON.stringify(bad)} ⇒ ${v.status}`);
  }
});
await t("4.7 pollId مجهول ⇒ 404 poll-not-found", async () => {
  const v = await post("/api/qa/poll/vote", { attendeeId, pollId: "no-such-poll", optionIndex: 0 }, {});
  assert.equal(v.status, 404, `status=${v.status}`);
  assert.equal((await j(v)).error, "Poll not found");
});
await t("4.8 stop ⇒ active=false و showResults=true، ثم التصويت 409", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  await post("/api/qa/admin/poll", { action: "stop", sessionId, pollId: pid }, AUTH);
  const p = findPoll(await adminState(), pid);
  assert.equal(p.active, false, "active بعد stop");
  assert.equal(p.showResults, true, "showResults بعد stop");
  const v = await post("/api/qa/poll/vote", { attendeeId, pollId: pid, optionIndex: 0 }, {});
  assert.equal(v.status, 409, `التصويت بعد stop ⇒ ${v.status}`);
});
await t("4.9 showResults بلا show ⇒ 400", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  const res = await post("/api/qa/admin/poll", { action: "showResults", sessionId, pollId: pid }, AUTH);
  assert.equal(res.status, 400, `status=${res.status}`);
});
await t("4.10 showResults:true يفرض active=false", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  await post("/api/qa/admin/poll", { action: "showResults", sessionId, pollId: pid, show: true }, AUTH);
  const p = findPoll(await adminState(), pid);
  assert.equal(p.showResults, true);
  assert.equal(p.active, false, "active بقي true رغم showResults");
});
await t("4.11 showResults:false يُبقي voting متاحاً", async () => {
  const r = await pollCreate();
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  await post("/api/qa/admin/poll", { action: "showResults", sessionId, pollId: pid, show: false }, AUTH);
  const p = findPoll(await adminState(), pid);
  assert.equal(p.showResults, false);
  assert.equal(p.active, true, "active صار false رغم show=false");
});
await t("4.12 pollId مجهول في start/stop ⇒ 404", async () => {
  for (const action of ["start", "stop", "showResults"]) {
    const res = await post("/api/qa/admin/poll", { action, sessionId, pollId: "nope", show: true }, AUTH);
    assert.equal(res.status, 404, `${action} ⇒ ${res.status}`);
  }
});
await t("4.13 خيار واحد ⇒ 400 (superRefine: at least 2 options)", async () => {
  const r = await pollCreate(["only"]);
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("4.14 سبعة خيارات ⇒ 400 (max 6)", async () => {
  const r = await pollCreate(["a", "b", "c", "d", "e", "f", "g"]);
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("4.15 ستّة خيارات ⇒ مقبول", async () => {
  const r = await pollCreate(["a", "b", "c", "d", "e", "f"]);
  assert.equal(r.status, 200, `status=${r.status}`);
});
await t("4.16 خيار فارغ/مسافات ⇒ 400", async () => {
  for (const opts of [["a", ""], ["a", "  "]]) {
    const r = await pollCreate(opts);
    assert.equal(r.status, 400, `options=${JSON.stringify(opts)} ⇒ ${r.status}`);
  }
});
await t("4.17 خيار (>120) ⇒ 400", async () => {
  const r = await pollCreate(["a", "ا".repeat(121)]);
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("4.18 optionsAr أقصر ⇒ 400؛ أطول ⇒ 400؛ متساوية ⇒ 200", async () => {
  assert.equal((await pollCreate(["a", "b"], { optionsAr: ["أ"] })).status, 400, "أقصر");
  assert.equal((await pollCreate(["a", "b"], { optionsAr: ["أ", "ب", "ج"] })).status, 400, "أطول");
  assert.equal((await pollCreate(["a", "b"], { optionsAr: ["أ", "ب"] })).status, 200, "متساوية");
});
await t("4.19 poll بدور viewer ⇒ 403", async () => {
  const res = await post("/api/qa/admin/poll", { action: "delete", sessionId, pollId: "x" }, VIEWAUTH);
  assert.equal(res.status, 403, `status=${res.status}`);
});

/* ══ 5. moderate: feature و setSpeaker (بلا تغطية HTTP إطلاقاً) ══ */
section("5) moderate: feature / setSpeaker / حدود");

await t("5.1 feature بلا featured ⇒ 400", async () => {
  const r = await moderate({ action: "feature", sessionId });
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("5.2 feature:true يضبط featured ويقدّمه في الترتيب", async () => {
  const a = (await ask(attendeeId, uniq("feat-a"))).body.question.id;
  const b = (await ask(attendeeId, uniq("feat-b"))).body.question.id;
  await approve(a);
  await approve(b);
  await moderate({ action: "feature", sessionId, questionId: b, featured: true });
  const live = await snap("live");
  const iA = live.questions.findIndex((q) => q.id === a);
  const iB = live.questions.findIndex((q) => q.id === b);
  assert.ok(iB >= 0 && iA >= 0, "السؤالان معتمدان في live");
  assert.ok(iB < iA, `المميَّز يجب أن يسبق: b@${iB} a@${iA}`);
  assert.equal(findQuestion(await adminState(), b).featured, true);
});
await t("5.3 feature:false يرفع التمييز", async () => {
  const id = (await ask(attendeeId, uniq("unfeat"))).body.question.id;
  await approve(id);
  await moderate({ action: "feature", sessionId, questionId: id, featured: true });
  await moderate({ action: "feature", sessionId, questionId: id, featured: false });
  assert.equal(findQuestion(await adminState(), id).featured, false);
});
await t("5.4 setSpeaker بلا enabled ⇒ 400", async () => {
  const r = await moderate({ action: "setSpeaker", sessionId });
  assert.equal(r.status, 400, `status=${r.status}`);
});
/**
 * ⚠️ `speakerEnabled` **راية على مستوى الجلسة لا مرشِّح على مستوى السؤال**:
 * `setSpeaker` يكتب `session.speakerEnabled` فقط، و`isSpeakerVisible` لا
 * تنظر إليه — الإخفاء يحدث في `SpeakerView.tsx:210` حيث تُعرض شاشة
 * «المتحدث معطّل» بدل القائمة. أول نسخة من هذا الاختبارUMOّنت الأسئلة
 * تختفي من الـAPI وأُبلغ عن ذلك كعيب؛ والواجهة هي المكان الصحيح.
 */
await t("5.5 setSpeaker:false يضبط راية الجلسة دون لمس بيانات الأسئلة", async () => {
  const id = (await ask(attendeeId, uniq("spk"))).body.question.id;
  await approve(id);
  const r = await moderate({ action: "setSpeaker", sessionId, enabled: false });
  assert.equal(r.status, 200, `status=${r.status}`);
  assert.equal(r.body.result?.speakerEnabled ?? r.body.speakerEnabled, false, "الراية لم تُضبط");
  assert.equal((await snap("speaker")).session.speakerEnabled, false, "الراية في اللقطة العامة");
  assert.equal(findSession(await adminState()).speakerEnabled, false, "الراية محفوظة");
});
await t("5.6 setSpeaker:true يعيده للمتحدث", async () => {
  await moderate({ action: "setSpeaker", sessionId, enabled: true });
  assert.equal(findSession(await adminState()).speakerEnabled, true);
});
await t("5.7 setVisibility بلا أي حقل ⇒ 400", async () => {
  const r = await moderate({ action: "setVisibility", sessionId, questionId: "q" });
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("5.8 questionId من جلسة أخرى ⇒ 404 question-not-found", async () => {
  const other = await j(
    await post("/api/qa/admin/session", { action: "create", title: "other-sess" }, AUTH)
  );
  const oid = other.result?.id ?? other.session?.id;
  const r = await moderate({ action: "approve", sessionId, questionId: oid });
  assert.equal(r.status, 404, `status=${r.status}`);
  assert.equal(r.body.error, "Question not found");
  await post("/api/qa/admin/session", { action: "delete", sessionId: oid }, AUTH);
});
await t("5.9 sessionId مجهول ⇒ 404", async () => {
  const r = await moderate({ action: "approve", sessionId: "no-such-session", questionId: "q" });
  assert.equal(r.status, 404, `status=${r.status}`);
  assert.equal(r.body.error, "Session not found");
});
await t("5.10 action غير معروف ⇒ 400", async () => {
  const r = await moderate({ action: "archive", sessionId, questionId: "q" });
  assert.equal(r.status, 400, `status=${r.status}`);
});
await t("5.11 moderate بدور viewer ⇒ 403", async () => {
  const r = await post("/api/qa/admin/moderate", { action: "approve", sessionId }, VIEWAUTH);
  assert.equal(r.status, 403, `status=${r.status}`);
});

/* ══ 6. screen: شريحة poll + حدود ══ */
section("6) admin/screen: poll slide وحدود");

await t("6.1 setSlide بنوع poll صحيح ⇒ الشريحة poll", async () => {
  const r = await pollCreate(["X", "Y"]);
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  const res = await setSlide({ kind: "poll", pollId: pid });
  assert.equal(res.status, 200, `status=${res.status}`);
  const s = await slide();
  assert.equal(s.kind, "poll", `kind=${s.kind}`);
  assert.equal(s.pollId, pid, `pollId=${s.pollId}`);
});
await t("6.2 pollId مجهول ⇒ 409 والشريحة ترجع hold", async () => {
  await setSlide({ kind: "question", questionId: (await ask(attendeeId, uniq("hold"))).body.question.id });
  const res = await setSlide({ kind: "poll", pollId: "ghost-poll" });
  assert.equal(res.status, 409, `status=${res.status}`);
  const s = await slide();
  assert.equal(s.kind, "hold", `kind=${s.kind} — يجب ألا تبقى شريحة غير صالحة`);
});
await t("6.3 createQuestion بلا putOnScreen لا يمس الشاشة", async () => {
  await setSlide({ kind: "wordCloud" });
  const before = JSON.stringify(await slide());
  const res = await post(
    "/api/qa/admin/screen",
    { action: "createQuestion", sessionId, text: uniq("off-screen") },
    AUTH
  );
  assert.equal(res.status, 200, `status=${res.status}`);
  assert.equal(JSON.stringify(await slide()), before, "الشريحة تغيّرت رغم غياب putOnScreen");
});
await t("6.4 createQuestion يفترض المؤلف «فريق التنظيم»", async () => {
  const res = await j(
    await post(
      "/api/qa/admin/screen",
      { action: "createQuestion", sessionId, text: uniq("auth") },
      AUTH
    )
  );
  const id = res.result?.question?.id;
  assert.ok(id, `لا معرّف في الرد: ${JSON.stringify(res)}`);
  const q = findQuestion(await adminState(), id);
  assert.equal(q.author, "فريق التنظيم", `author=${q.author}`);
  assert.equal(q.source, "admin", `source=${q.source}`);
});
await t("6.5 createQuestion بمؤلف صريح يُحترم", async () => {
  const res = await j(
    await post(
      "/api/qa/admin/screen",
      { action: "createQuestion", sessionId, text: uniq("auth2"), author: "منظّمة TEDx" },
      AUTH
    )
  );
  const id = res.result?.question?.id;
  assert.equal(findQuestion(await adminState(), id).author, "منظّمة TEDx");
});
await t("6.6 setSlide بلا slide ⇒ 400؛ createQuestion بلا text ⇒ 400", async () => {
  assert.equal((await post("/api/qa/admin/screen", { action: "setSlide", sessionId }, AUTH)).status, 400);
  assert.equal(
    (await post("/api/qa/admin/screen", { action: "createQuestion", sessionId }, AUTH)).status,
    400
  );
});
await t("6.7 mode غير معروف ⇒ 400؛ slide.kind غير معروف ⇒ 400؛ question بلا id ⇒ 400", async () => {
  assert.equal((await post("/api/qa/admin/screen", { action: "setMode", sessionId, mode: "AUTO" }, AUTH)).status, 400);
  assert.equal((await setSlide({ kind: "evil" })).status, 400);
  assert.equal((await setSlide({ kind: "question" })).status, 400);
});
await t("6.8 sessionId مجهول ⇒ 404", async () => {
  const res = await post("/api/qa/admin/screen", { action: "clear", sessionId: "ghost" }, AUTH);
  assert.equal(res.status, 404, `status=${res.status}`);
});

/* ══ 7. toggle: انفراد الجلسة النشطة + إغلاق الاستقبال ══ */
section("7) session toggle: الانفراد وإغلاق الاستقبال");

/**
 * ⚠️ هذا الاختبار ينشئ جلسات وحذفها، فلا يجوز أن يمسّ `sessionId` الأصلي.
 * حذفها كان يُبتلع 60 إخفاقاً تالٍ بخطأ واحد: كل `ask()` بعده يرتدّ بـ409
 * فيُقرأ كعطل منتج. **العزل في الاختبار شرط، لا تفصيل.**
 */
await t("7.1 toggle بلا acceptingQuestions يُنشّط غير النشط ويُطفئ البقية", async () => {
  const mk = async (title) => {
    const r = await j(await post("/api/qa/admin/session", { action: "create", title }, AUTH));
    return r.result?.id ?? r.session?.id;
  };
  const a = await mk("tog-a");
  const b = await mk("tog-b");
  await post("/api/qa/admin/session", { action: "activate", sessionId }, AUTH);
  const res = await post("/api/qa/admin/session", { action: "toggle", sessionId: a }, AUTH);
  assert.equal(res.status, 200, `status=${res.status}`);
  const state = await adminState();
  assert.equal(state.sessions.find((s) => s.id === a).active, true, "a لم يُنشَّط");
  const others = state.sessions.filter((s) => s.active);
  assert.deepEqual(others.map((s) => s.id), [a], `جلسات نشطة متعددة: ${others.map((s) => s.id)}`);
  await post("/api/qa/admin/session", { action: "delete", sessionId: a }, AUTH);
  await post("/api/qa/admin/session", { action: "delete", sessionId: b }, AUTH);
  await post("/api/qa/admin/session", { action: "activate", sessionId }, AUTH);
});
await t("7.2 toggle على النشط ينهيه (active=false, accepting=false)", async () => {
  const r = await j(await post("/api/qa/admin/session", { action: "create", title: "tog-end" }, AUTH));
  const id = r.result?.id ?? r.session?.id;
  await post("/api/qa/admin/session", { action: "activate", sessionId: id }, AUTH);
  await post("/api/qa/admin/session", { action: "toggle", sessionId: id }, AUTH);
  const s = (await adminState()).sessions.find((x) => x.id === id);
  assert.equal(s.active, false, "active");
  assert.equal(s.acceptingQuestions, false, "acceptingQuestions");
  await post("/api/qa/admin/session", { action: "delete", sessionId: id }, AUTH);
});
await t("7.3 toggle.acceptingQuestions=false ⇒ /question 409 not-accepting", async () => {
  await post("/api/qa/admin/session", { action: "activate", sessionId }, AUTH);
  const res = await post(
    "/api/qa/admin/session",
    { action: "toggle", sessionId, acceptingQuestions: false },
    AUTH
  );
  assert.equal(res.status, 200, `status=${res.status}`);
  const q = await ask(attendeeId, uniq("closed"));
  assert.equal(q.status, 409, `status=${q.status}`);
  assert.equal(q.body.error, "This session is not accepting questions");
});
await t("7.4 إعادة الفتح تُرجع الاستقبال", async () => {
  await post("/api/qa/admin/session", { action: "toggle", sessionId, acceptingQuestions: true }, AUTH);
  const q = await ask(attendeeId, uniq("reopen"));
  assert.equal(q.status, 201, `status=${q.status}`);
});
await t("7.5 sessionId مجهول في toggle/delete ⇒ 404؛ بلا sessionId ⇒ 400", async () => {
  assert.equal((await post("/api/qa/admin/session", { action: "toggle", sessionId: "ghost" }, AUTH)).status, 404);
  assert.equal((await post("/api/qa/admin/session", { action: "delete", sessionId: "ghost" }, AUTH)).status, 404);
  assert.equal((await post("/api/qa/admin/session", { action: "toggle" }, AUTH)).status, 400);
  assert.equal((await post("/api/qa/admin/session", { action: "delete" }, AUTH)).status, 400);
});
await t("7.6 session بدور viewer ⇒ 403", async () => {
  const res = await post("/api/qa/admin/session", { action: "toggle", sessionId }, VIEWAUTH);
  assert.equal(res.status, 403, `status=${res.status}`);
});

/* ══ 8. بوابة إجابة سؤال مخفي عن الجمهور (أخطر فجوة) ══ */
section("8) بوابة الإجابة: الرؤية للجهة العامة");

await t("8.1 معتمد لكن مخفي عن الجمهور ⇒ 404 question-not-answerable", async () => {
  const id = (await ask(attendeeId, uniq("ans-hidden"))).body.question.id;
  await approve(id);
  await moderate({
    action: "setVisibility",
    sessionId,
    questionId: id,
    showToAudience: false,
  });
  const res = await post(
    "/api/qa/question/answer",
    { attendeeId, questionId: id, text: "محاولة إجابة على سؤال مخفي" },
    {}
  );
  assert.equal(res.status, 404, `status=${res.status}`);
  assert.equal((await j(res)).error, "Question not found");
});
await t("8.2 إظهاره للجمهور يُعيد قابلية الإجابة", async () => {
  const id = (await ask(attendeeId, uniq("ans-shown"))).body.question.id;
  await approve(id);
  await moderate({ action: "setVisibility", sessionId, questionId: id, showToAudience: false });
  await moderate({ action: "setVisibility", sessionId, questionId: id, showToAudience: true });
  const res = await post(
    "/api/qa/question/answer",
    { attendeeId, questionId: id, text: "الآن صار مرئياً" },
    {}
  );
  assert.equal(res.status, 200, `status=${res.status}`);
});
await t("8.3 إخفاء من الجمهور فقط لا يمس المتحدّث ولا المشروعور", async () => {
  const id = (await ask(attendeeId, uniq("three-face"))).body.question.id;
  await approve(id);
  await moderate({ action: "setVisibility", sessionId, questionId: id, showToAudience: false });
  assert.ok((await snap("speaker")).questions.some((q) => q.id === id), "اختفى من speaker");
  assert.ok((await snap("live")).questions.some((q) => q.id === id), "اختفى من live");
  const q = findQuestion(await adminState(), id);
  assert.equal(q.showToAudience, false);
  assert.equal(q.showOnSpeaker, true);
  assert.equal(q.showOnProjector, true);
});
await t("8.4 text بلا حقل ⇒ 400؛ 501 حرف ⇒ 400؛ 500 ⇒ 201", async () => {
  const id = (await ask(attendeeId, uniq("ans-len"))).body.question.id;
  await approve(id);
  const base = { attendeeId, questionId: id };
  assert.equal((await post("/api/qa/question/answer", { ...base }, {})).status, 400, "بلا text");
  assert.equal(
    (await post("/api/qa/question/answer", { ...base, text: "ا".repeat(501) }, {})).status,
    400,
    "501"
  );
  assert.equal(
    (await post("/api/qa/question/answer", { ...base, text: "ا".repeat(500) }, {})).status,
    200,
    "500"
  );
});
await t("8.5 attendeeId غير مسجّل ⇒ 403 على الإجابة", async () => {
  const id = (await ask(attendeeId, uniq("ans-forge"))).body.question.id;
  await approve(id);
  const res = await post(
    "/api/qa/question/answer",
    { attendeeId: "ghost-attendee", questionId: id, text: "انتحال" },
    {}
  );
  assert.equal(res.status, 403, `status=${res.status}`);
});

/* ══ 9. تصويت الأسئلة: سلبيات DELETE وحالات ══ */
section("9) question/vote: DELETE وحالات حدّية");

await t("9.1 DELETE بلا معاملين ⇒ 400", async () => {
  const res = await del("/api/qa/question/vote");
  assert.equal(res.status, 400, `status=${res.status}`);
});
await t("9.2 DELETE بمعامل واحد فقط ⇒ 400", async () => {
  assert.equal((await del(`/api/qa/question/vote?attendeeId=${attendeeId}`)).status, 400, "attendeeId فقط");
  assert.equal((await del("/api/qa/question/vote?questionId=q1")).status, 400, "questionId فقط");
});
await t("9.3 DELETE بلا تصويت ⇒ 409 not-voted", async () => {
  const id = (await ask(attendeeId, uniq("novote"))).body.question.id;
  await approve(id);
  const res = await del(`/api/qa/question/vote?attendeeId=${attendeeId}&questionId=${id}`);
  assert.equal(res.status, 409, `status=${res.status}`);
  assert.equal((await j(res)).error, "No vote recorded for this question");
});
await t("9.4 DELETE بمعرّف منتحل ⇒ 403", async () => {
  const id = (await ask(attendeeId, uniq("delforge"))).body.question.id;
  await approve(id);
  const res = await del("/api/qa/question/vote?attendeeId=ghost&questionId=" + id);
  assert.equal(res.status, 403, `status=${res.status}`);
});
await t("9.5 التصويت على سؤال مرفوض ⇒ 404 (لا يكشف حالة السؤال)", async () => {
  const id = (await ask(attendeeId, uniq("rej-vote"))).body.question.id;
  await moderate({ action: "reject", sessionId, questionId: id });
  const res = await post("/api/qa/question/vote", { attendeeId, questionId: id }, {});
  assert.equal(res.status, 404, `status=${res.status}`);
  assert.equal((await j(res)).error, "Question not found");
});
await t("9.6 التصويت على سؤال غير موجود ⇒ 404", async () => {
  const res = await post("/api/qa/question/vote", { attendeeId, questionId: "ghost-q" }, {});
  assert.equal(res.status, 404, `status=${res.status}`);
});
await t("9.7 تصويت مكرّر للمجموع لا يزيد العدّاد", async () => {
  const id = (await ask(attendeeId, uniq("dup-vote"))).body.question.id;
  await approve(id);
  assert.equal((await post("/api/qa/question/vote", { attendeeId, questionId: id }, {})).status, 200);
  const before = findQuestion(await adminState(), id).votes;
  const second = await post("/api/qa/question/vote", { attendeeId, questionId: id }, {});
  assert.equal(second.status, 409, `status=${second.status}`);
  assert.equal(findQuestion(await adminState(), id).votes, before, "العدّاد تحرّك رغم الرفض");
});

/* ══ 10. كشف المكرر والوسوم والمجهول ══ */
section("10) كشف المكرر / tag / anonymous");

await t("10.1 نص مطابق ⇒ 200 duplicate:true مع duplicateOf", async () => {
  const text = uniq("dup");
  const first = await ask(attendeeId, text);
  assert.equal(first.status, 201, `الأول status=${first.status}`);
  const second = await ask(attendeeId, text);
  assert.equal(second.status, 200, `الثاني status=${second.status}`);
  assert.equal(second.body.duplicate, true, "لا وسم duplicate");
  assert.equal(second.body.duplicateOf, first.body.question.id, "duplicateOf خاطئ");
});
await t("10.2 المكرر لا يُنشئ سؤالاً جديداً", async () => {
  const text = uniq("dup2");
  const a = await ask(attendeeId, text);
  const before = findSession(await adminState()).questions.length;
  await ask(attendeeId, text);
  assert.equal(findSession(await adminState()).questions.length, before, "عدد الأسئلة زاد");
  void a;
});
await t("10.3 anonymous:true ⇒ المؤلف «Anonymous»", async () => {
  const r = await ask(attendeeId, uniq("anon"), { anonymous: true });
  assert.equal(r.status, 201);
  assert.equal(findQuestion(await adminState(), r.body.question.id).author, "Anonymous");
});
await t("10.4 tag يُحفظ ويظهر في tags بالتحليلات", async () => {
  const r = await ask(attendeeId, uniq("tagged"), { tag: "تقنية" });
  await approve(r.body.question.id);
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  assert.ok(
    an.tags.some((x) => x.tag === "تقنية" && x.count >= 1),
    `tags=${JSON.stringify(an.tags)}`
  );
});
await t("10.5 سؤال بلا tag يدخل سلة untagged", async () => {
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  assert.ok(an.tags.some((x) => x.tag === "untagged"), "لا سلة untagged");
});
await t("10.6 name في الحمولة لا يغيّر المؤلف (الهوية من الخادم)", async () => {
  const r = await ask(attendeeId, uniq("spoof"), { name: "الملك" });
  assert.equal(findQuestion(await adminState(), r.body.question.id).author, "matrix-bot");
});

/* ══ 11. seat: استرجاع الهوية بالسرّ ══ */
section("11) استرجاع الهوية بالاسم والسرّ");

await t("11.1 أول انضمام يُعيد attendeeId + reclaimSecret", async () => {
  const r = await join("seat-x");
  assert.equal(r.status, 200);
  assert.ok(r.body.attendeeId, "لا attendeeId");
  assert.equal(typeof r.body.reclaimSecret, "string", "لا reclaimSecret");
});
await t("11.2 نفس الاسم بلا سرّ ⇒ هوية جديدة (لا تزييف)", async () => {
  const first = await join("seat-y");
  const again = await join("seat-y");
  assert.notEqual(again.body.attendeeId, first.body.attendeeId, "نفس المعرّف بدون سرّ ⇒ انتحال");
});
await t("11.3 سرّ خاطئ ⇒ هوية جديدة لا خطأ", async () => {
  const first = await join("seat-z");
  const wrong = await post(
    "/api/qa/attendee/join",
    { name: "seat-z", reclaimSecret: "00000000000000000000000000000000" },
    {}
  );
  assert.equal(wrong.status, 200, `status=${wrong.status}`);
  assert.notEqual((await j(wrong)).attendeeId, first.body.attendeeId, "سرّ خاطئ أعاد الهوية");
});
await t("11.4 سرّ صحيح ⇒ نفس الهوية", async () => {
  const first = await join("seat-w");
  const back = await post(
    "/api/qa/attendee/join",
    { name: "seat-w", reclaimSecret: first.body.reclaimSecret },
    {}
  );
  assert.equal(back.status, 200);
  assert.equal((await j(back)).attendeeId, first.body.attendeeId, "السرّ الصحيح لم يُرجع الهوية");
});
await t("11.5 attendeeNames لا يتكرّر لنفس الشخص", async () => {
  const first = await join("seat-dup");
  await post("/api/qa/attendee/join", { name: "seat-dup", reclaimSecret: first.body.reclaimSecret }, {});
  const names = findSession(await adminState()).attendeeNames;
  assert.equal(names.filter((n) => n === "seat-dup").length, 1, `تكرار: ${JSON.stringify(names)}`);
});

/* ══ 12. التحليلات (بلا تغطية إطلاقاً) ══ */
section("12) admin/analytics");

await t("12.1 200 بالشكل الكامل", async () => {
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  assert.equal(an.ok, true);
  for (const k of ["session", "stats", "sentiment", "tags", "topQuestions", "timeline", "polls"]) {
    assert.ok(k in an, `مفتاح ناقص: ${k}`);
  }
  assert.equal(an.session.id, sessionId);
});
/**
 * ⚠️ `anonymous`/`sentiment`/`tag` **غير موجودة في إسقاط `/admin/questions`**،
 * بينما `analytics` تحصيّها. فالمقارنة الحرفية مستحيلة؛ نُقارن ما هو
 * متاح، ونترك الفارق موثّقاً في تقرير الفجوات بدل تمرير اختبار زائف.
 */
await t("12.2 الإحصاءات المتاحة تطابق /admin/questions", async () => {
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  const qs = findSession(await adminState()).questions;
  assert.equal(an.stats.totalQuestions, qs.length, "totalQuestions");
  assert.equal(an.stats.approved, qs.filter((q) => q.status === "approved").length, "approved");
  assert.equal(an.stats.pending, qs.filter((q) => q.status === "pending").length, "pending");
  assert.equal(an.stats.rejected, qs.filter((q) => q.status === "rejected").length, "rejected");
  assert.equal(an.stats.answered, qs.filter((q) => q.answered).length, "answered");
  assert.equal(an.stats.featured, qs.filter((q) => q.featured).length, "featured");
  assert.equal(an.stats.attendeeCount, findSession(await adminState()).attendeeNames.length, "attendeeCount");
  assert.ok(an.stats.anonymous >= 1, "لا يوجد سؤال مجهول رغم اختبار 10.3");
});
await t("12.3 totalVotes يجمع المعتمد فقط", async () => {
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  const approved = findSession(await adminState()).questions.filter((q) => q.status === "approved");
  assert.equal(an.stats.totalVotes, approved.reduce((s, q) => s + q.votes, 0), "totalVotes");
});
await t("12.4 sentiment ناقص: التكلفة = كل سؤال له مزاج", async () => {
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  const sum = an.sentiment.positive + an.sentiment.negative + an.sentiment.neutral;
  assert.ok(sum <= an.stats.totalQuestions, `المشاعر ${sum} > الأسئلة ${an.stats.totalQuestions}`);
});
await t("12.5 tags مرتّبة تنازلياً بالعدد", async () => {
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  for (let i = 1; i < an.tags.length; i++) {
    assert.ok(an.tags[i - 1].count >= an.tags[i].count, `ترتيب خاطئ عند ${i}`);
  }
});
await t("12.6 topQuestions معتمد فقط، مرتّب، وحدّه 10", async () => {
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  assert.ok(an.topQuestions.length <= 10, `عدد ${an.topQuestions.length}`);
  for (let i = 1; i < an.topQuestions.length; i++) {
    assert.ok(an.topQuestions[i - 1].votes >= an.topQuestions[i].votes, `ترتيب تنازلي خاطئ عند ${i}`);
  }
  const rejected = new Set(
    findSession(await adminState()).questions.filter((q) => q.status !== "approved").map((q) => q.id)
  );
  for (const q of an.topQuestions) {
    assert.ok(!rejected.has(q.id), `سؤال غير معتمد في top: ${q.id}`);
  }
});
await t("12.7 polls.totalVotes = مجموع tallies", async () => {
  const r = await pollCreate(["m", "n"]);
  const pid = r.body.result.id;
  await post("/api/qa/admin/poll", { action: "start", sessionId, pollId: pid }, AUTH);
  await post("/api/qa/poll/vote", { attendeeId, pollId: pid, optionIndex: 1 }, {});
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  const p = findPoll(await adminState(), pid);
  const entry = an.polls.find((x) => x.id === pid);
  assert.equal(entry.totalVotes, p.tallies.reduce((a, b) => a + b, 0), "مجموع الأصوات");
});
await t("12.8 timeline مرتّبة تصاعدياً بالساعة", async () => {
  const an = await j(await get(`/api/qa/admin/analytics?sessionId=${sessionId}`));
  for (let i = 1; i < an.timeline.length; i++) {
    assert.ok(an.timeline[i - 1].hour <= an.timeline[i].hour, `ترتيب خاطئ عند ${i}`);
  }
  assert.equal(
    an.timeline.reduce((s, t) => s + t.count, 0),
    an.stats.totalQuestions,
    "مجموع الخط الزمني ≠ عدد الأسئلة"
  );
});
await t("12.9 sessionId مجهول ⇒ 404 No session found", async () => {
  const res = await get("/api/qa/admin/analytics?sessionId=ghost-session");
  assert.equal(res.status, 404, `status=${res.status}`);
  assert.equal((await j(res)).error, "No session found");
});
await t("12.10 بلا sessionId ⇒ آخر جلسة بترتيب الملف", async () => {
  const an = await j(await get("/api/qa/admin/analytics"));
  const state = await adminState();
  const last = state.sessions[state.sessions.length - 1];
  assert.equal(an.session.id, last.id, `expected=${last.id} got=${an.session.id}`);
});
await t("12.11 analytics بدور viewer ⇒ 403؛ بلا توكن ⇒ 401", async () => {
  assert.equal((await get("/api/qa/admin/analytics", VIEWAUTH)).status, 403, "viewer");
  const res = await fetch(`${BASE}/api/qa/admin/analytics`);
  assert.equal(res.status, 401, `anon status=${res.status}`);
});

/* ══ 13. تصدير CSV: الاقتباس وحقن الصيغ ══ */
section("13) admin/export CSV: الاقتباس وحقن الصيغ");

const csv = async () => {
  const res = await get(`/api/qa/admin/export?sessionId=${sessionId}`);
  assert.equal(res.status, 200, `status=${res.status}`);
  return { text: await res.text(), res };
};
/**
 * ⚠️ لا يُقاس CSV بعدد الأسطر الفيزيائية.
 *
 * خلية مقتبسة تحوي سطراً جديداً **يجب** أن تُنتج أكثر من سطر فيزيائي —
 * هذا هو السلوك الصحيح لا الخلل. الاختبار الأول هنا عدّ `split("\n")`
 * وأخفق على تصدير سليم، أي تقرير عيب وهمي. العدّ الصحيح هو **السجلات**
 * بعد التحليل، وهو ما يفعله Excel فعلاً.
 *
 * فاحص RFC4180 مصغّر: يقبل `""` داخل الاقتباس ويحترم CRLF وLF معاً.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** يسترجع قيمة خلية `text` للسجل الذي يحرّف `marker`. */
const textCellOf = (csvText, marker) => {
  const rows = parseCsv(csvText);
  const head = rows[0];
  const col = head.indexOf("text");
  assert.ok(col !== -1, "لا عمود text");
  for (const r of rows.slice(1)) {
    const cell = r[col];
    if (cell !== undefined && cell.includes(marker)) return { cell, row: r, rows };
  }
  return null;
};

await t("13.1 ترويسة الأعمدة بالترتيب", async () => {
  const { text } = await csv();
  assert.equal(text.split("\n")[0], "id,author,text,status,votes,featured,answered,createdAt,approvedAt");
});
await t("13.2 content-type و disposition و no-store", async () => {
  const { res } = await csv();
  assert.equal(res.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.equal(
    res.headers.get("content-disposition"),
    `attachment; filename="qa-${sessionId}.csv"`,
    res.headers.get("content-disposition")
  );
  assert.equal(res.headers.get("cache-control"), "no-store");
});
await t("13.3 اقتباس مزدوج للعلامة كفاصلة", async () => {
  const marker = `zq${++seq}`;
  await ask(attendeeId, `${uniq("dq")} "${marker}" tail`);
  const { text } = await csv();
  assert.ok(text.includes(`""${marker}""`), "العلامة غير مقتبسة بمزدوج");
});
await t("13.4 فاصلة داخل النص تُحصر وتُسترجع حرفياً", async () => {
  const marker = `zc${++seq}`;
  const value = `${uniq("comma")}, ${marker} end`;
  await ask(attendeeId, value);
  const { text } = await csv();
  const hit = textCellOf(text, marker);
  assert.ok(hit, `لا سجل يحوي ${marker}`);
  assert.equal(hit.cell, value, `القيمة المسترجعة: ${JSON.stringify(hit.cell)}`);
});
await t("13.5 سطر جديد داخل النص: سجل واحد لا صفّان", async () => {
  const marker = `zn${++seq}`;
  const value = `${uniq("nl")}\n${marker} tail`;
  const before = parseCsv((await csv()).text).length;
  await ask(attendeeId, value);
  const { text } = await csv();
  const after = parseCsv(text);
  assert.equal(after.length, before + 1, `السجلات ${after.length - before} بدل 1 (حقن صفوف)`);
  assert.equal(textCellOf(text, marker).cell, value, "القيمة لم تُسترجع حرفياً");
});
await t("13.6 CRLF داخل النص: سجل واحد (أخطر حقن صفوف)", async () => {
  const marker = `zr${++seq}`;
  const value = `${uniq("crlf")}\r\n${marker} tail`;
  const before = parseCsv((await csv()).text).length;
  await ask(attendeeId, value);
  const { text } = await csv();
  const after = parseCsv(text);
  assert.equal(after.length, before + 1, `السجلات ${after.length - before} بدل 1 (CRLF كسر الصفوف)`);
  assert.equal(textCellOf(text, marker).cell, value, "القيمة لم تُسترجع حرفياً");
});
await t("13.7 بادئات الصيغ = + - @ ⇒ الخلية تبدأ بفاصلة عليا", async () => {
  for (const p of ["=", "+", "-", "@"]) {
    const marker = `zf${p}${++seq}`;
    await ask(attendeeId, `${p}${marker}`);
    const { text } = await csv();
    const hit = textCellOf(text, marker);
    assert.ok(hit, `لا سجل للعلامة ${marker}`);
    assert.ok(hit.cell.startsWith("'"), `${p} لم يُهرَّب: ${JSON.stringify(hit.cell)}`);
  }
});
await t("13.8 بادئة بعد مسافات ⇒ تُهرَّب أيضاً", async () => {
  const marker = `zw${++seq}`;
  await ask(attendeeId, `  =${marker}`);
  const { text } = await csv();
  const hit = textCellOf(text, marker);
  assert.ok(hit, "لا سجل");
  assert.ok(hit.cell.trimStart().startsWith("'"), `لم تُهرَّب: ${JSON.stringify(hit.cell)}`);
});
await t("13.9 صيغة + فاصلة ⇒ الهروب داخل الاقتباس ولا يكسر السجل", async () => {
  const marker = `zk${++seq}`;
  const value = `=cmd,${marker}`;
  await ask(attendeeId, value);
  const { text } = await csv();
  assert.ok(text.includes(`"'=cmd,${marker}"`), `الهروب خارج الاقتباس: ${text.slice(-400)}`);
  assert.equal(textCellOf(text, marker).cell, `'${value}`, "القيمة المسترجعة غير متوقّعة");
});
await t("13.10 النص العربي يمرّ بترميز UTF-8 سليماً", async () => {
  const marker = `عربي${++seq}`;
  await ask(attendeeId, uniq(`سؤال ${marker}`));
  const { text } = await csv();
  assert.ok(text.includes(marker), "النص العربي تلف");
});
await t("13.11 approvedAt فارغ للسؤال المعلّق؛ answered=false افتراضياً", async () => {
  const pending = (await ask(attendeeId, uniq("pending-export"))).body.question.id;
  const { text } = await csv();
  const row = text.split("\n").find((r) => r.includes(pending));
  assert.ok(row, "لا صف");
  assert.ok(row.endsWith(","), `approvedAt يجب أن يكون خالياً: ${row}`);
  assert.ok(row.includes(",false,"), `answered افتراضي: ${row}`);
});
/**
 * عقدٌ مقصود لا نقص: التصدير **أسئلة فقط**. استفتاءات وإجابات مفقودة.
 * الاختبار يثبّت العقد عمداً: لو أُضيف عمودٌ لاحقاً bitched نطاق الملف
 * يتغيّر بلا تنبيه، فهنا يظهر الفرق فوراً.
 */
await t("13.12 export أسئلة فقط: لا استفاءات ولا إجابات", async () => {
  await pollCreate(["p1", "p2"]);
  const head = parseCsv((await csv()).text)[0];
  assert.deepEqual(head, [
    "id",
    "author",
    "text",
    "status",
    "votes",
    "featured",
    "answered",
    "createdAt",
    "approvedAt",
  ]);
  for (const banned of ["prompt", "options", "answer", "answers", "tallies", "nps", "rating"]) {
    assert.ok(!head.includes(banned), `عمود غير مقصود في التصدير: ${banned}`);
  }
});
await t("13.13 sessionId مجهول ⇒ 404؛ viewer ⇒ 403؛ بلا توكن ⇒ 401", async () => {
  assert.equal((await get("/api/qa/admin/export?sessionId=ghost")).status, 404, "404");
  assert.equal((await get("/api/qa/admin/export", VIEWAUTH)).status, 403, "viewer");
  assert.equal((await fetch(`${BASE}/api/qa/admin/export`)).status, 401, "anon");
});
await t("13.14 توكن صالح عبر ?token= لا يعمل (لا تسريب في URL)", async () => {
  const res = await fetch(`${BASE}/api/qa/admin/export?token=${encodeURIComponent(adminToken)}`);
  assert.equal(res.status, 401, `status=${res.status}`);
});

/* ══ 14. admin/answer: سلبيات ══ */
section("14) admin/answer: سلبيات");

await t("14.1 sessionId مجهول ⇒ 404 session-not-found", async () => {
  const res = await post(
    "/api/qa/admin/answer",
    { action: "approve", sessionId: "ghost", questionId: "q", answerId: "a" },
    AUTH
  );
  assert.equal(res.status, 404, `status=${res.status}`);
  assert.equal((await j(res)).error, "Session not found");
});
await t("14.2 questionId مجهول ⇒ 404 question-not-found", async () => {
  const res = await post(
    "/api/qa/admin/answer",
    { action: "approve", sessionId, questionId: "ghost-q", answerId: "a" },
    AUTH
  );
  assert.equal(res.status, 404, `status=${res.status}`);
  assert.equal((await j(res)).error, "Question not found");
});
await t("14.3 حقول ناقصة ⇒ 400؛ action مجهول ⇒ 400", async () => {
  for (const bad of [
    { action: "approve", sessionId },
    { action: "approve", sessionId, questionId: "q" },
    { action: "archive", sessionId, questionId: "q", answerId: "a" },
  ]) {
    const res = await post("/api/qa/admin/answer", bad, AUTH);
    assert.equal(res.status, 400, `${JSON.stringify(bad)} ⇒ ${res.status}`);
  }
});
await t("14.4 viewer ⇒ 403؛ بلا توكن ⇒ 401", async () => {
  assert.equal(
    (await post("/api/qa/admin/answer", { action: "approve", sessionId, questionId: "q", answerId: "a" }, VIEWAUTH)).status,
    403
  );
  const res = await post(
    "/api/qa/admin/answer",
    { action: "approve", sessionId, questionId: "q", answerId: "a" },
    { "Content-Type": "application/json" }
  );
  assert.equal(res.status, 401, `status=${res.status}`);
});

/* ══ 15. الاستبيان: التجميع وحدود ══ */
section("15) survey: التجميع وحدود القيم");

await t("15.1 لا استجابة ⇒ avgNps=0 و npsScore=0", async () => {
  const r = await j(await post("/api/qa/admin/session", { action: "create", title: "survey-empty" }, AUTH));
  const sid = r.result?.id ?? r.session?.id;
  const g = await j(await get(`/api/qa/survey?sessionId=${sid}`));
  assert.equal(g.total, 0);
  assert.equal(g.avgNps, 0);
  assert.equal(g.avgRating, 0);
  assert.equal(g.npsScore, 0);
  assert.deepEqual(g.npsBreakdown, { promoters: 0, passives: 0, detractors: 0 });
  await post("/api/qa/admin/session", { action: "delete", sessionId: sid }, AUTH);
});
await t("15.2 حدود nps/rating: 0 و10 و5 مقبولة؛ 11 و0 و7.5 و\"9\" مرفوضة", async () => {
  const jn = await join("survey-bounds");
  const aid = jn.body.attendeeId;
  const mk = (nps, rating) => post("/api/qa/survey", { sessionId, attendeeId: aid, nps, rating }, {});
  for (const bad of [
    [11, 3],
    [-1, 3],
    [5, 0],
    [5, 6],
    [7.5, 3],
    ["9", 3],
  ]) {
    const r = await mk(bad[0], bad[1]);
    assert.equal(r.status, 400, `nps=${bad[0]} rating=${bad[1]} ⇒ ${r.status}`);
  }
  assert.equal((await mk(0, 1)).status, 201, "nps=0 rating=1");
});
await t("15.3 npsBreakdown و npsScore محسوبان بدقة", async () => {
  const r = await j(await post("/api/qa/admin/session", { action: "create", title: "survey-agg" }, AUTH));
  const sid = r.result?.id ?? r.session?.id;
  // ⚠️ `join` يسجّل في الجلسة **النشطة** لا في `sessionId` المطلوب. كان
  // الاختبار يجمع معرّفات من الجلسة الأم ثم يقدّمها لجلسة أخرى ⇒ 403،
  // وهو رفض صحيح لا عطل. فالتنشيط شرط Previously.
  await post("/api/qa/admin/session", { action: "activate", sessionId: sid }, AUTH);
  const npsList = [10, 9, 8, 7, 6, 0];
  for (const [i, nps] of npsList.entries()) {
    const a = (await join(`agg-${i}`)).body.attendeeId;
    assert.ok(a, `انضمام agg-${i} فشل`);
    const res = await post("/api/qa/survey", { sessionId: sid, attendeeId: a, nps, rating: 3 }, {});
    assert.equal(res.status, 201, `nps=${nps} ⇒ ${res.status}`);
  }
  const g = await j(await get(`/api/qa/survey?sessionId=${sid}`));
  assert.equal(g.total, 6, "total");
  assert.deepEqual(
    g.npsBreakdown,
    { promoters: 2, passives: 2, detractors: 2 },
    `npsBreakdown=${JSON.stringify(g.npsBreakdown)}`
  );
  assert.equal(g.npsScore, Math.round(((2 - 2) / 6) * 100), "npsScore");
  const expectedAvg = Math.round((npsList.reduce((s, n) => s + n, 0) / 6) * 10) / 10;
  assert.equal(g.avgNps, expectedAvg, `avgNps=${g.avgNps} expected=${expectedAvg}`);
  assert.equal(g.avgRating, 3, `avgRating=${g.avgRating}`);
  await post("/api/qa/admin/session", { action: "delete", sessionId: sid }, AUTH);
  await post("/api/qa/admin/session", { action: "activate", sessionId }, AUTH);
});
await t("15.4 comment بطول 501 ⇒ 400", async () => {
  const a = (await join("survey-long")).body.attendeeId;
  const res = await post(
    "/api/qa/survey",
    { sessionId, attendeeId: a, nps: 5, rating: 3, comment: "ا".repeat(501) },
    {}
  );
  assert.equal(res.status, 400, `status=${res.status}`);
});
await t("15.5 التكرار المتزامن لل mismo يبقى واحداً", async () => {
  const a = (await join("survey-race")).body.attendeeId;
  const payload = { sessionId, attendeeId: a, nps: 5, rating: 3 };
  const results = await Promise.all([post("/api/qa/survey", payload, {}), post("/api/qa/survey", payload, {})]);
  const ok = results.filter((r) => r.status === 201).length;
  assert.equal(ok, 1, `نجح ${ok} من 2 — القفل غير ذرّي`);
  await Promise.all(results.map((r) => r.text().catch(() => {})));
});
await t("15.6 GET بلا sessionId ⇒ 400؛ viewer ⇒ 403", async () => {
  assert.equal((await get("/api/qa/survey")).status, 400);
  assert.equal((await get(`/api/qa/survey?sessionId=${sessionId}`, VIEWAUTH)).status, 403);
});

/* ══ 16. بث SSE ══ */
section("16) بث SSE");

await t("16.1 view غائب ⇒ 200 افتراضي live", async () => {
  const res = await fetch(`${BASE}/api/qa/stream`);
  assert.equal(res.status, 200, `status=${res.status}`);
  assert.equal(res.headers.get("content-type"), "text/event-stream");
  const reader = res.body.getReader();
  const chunk = new TextDecoder().decode((await reader.read()).value);
  assert.ok(chunk.startsWith("data: "), `الإطار الأول: ${JSON.stringify(chunk.slice(0, 40))}`);
  await reader.cancel();
});
await t("16.2 ?view= فارغ ⇒ 400 بجسم no-store", async () => {
  const res = await fetch(`${BASE}/api/qa/stream?view=`);
  assert.equal(res.status, 400, `status=${res.status}`);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal((await j(res)).error, "Invalid view");
});
/**
 * ⛔ نصفا الاختبار كلاهما كان بلا تغطية:
 * - `qa-suite` يثبت **عدم** تكرار الإطار عند غياب التغيير فقط.
 * - لا أحد يثبت أن البث **يُصدر** إطاراً عند تغيّر حقيقي — وهو ما تعتمد
 *   عليه كل شاشات القاعة. بث لا يلتقط التغيير يبدو للعين سليماً تماماً.
 *
 * لذا نقرأ إطارين ونوقظ البث بتغيير حقيقي، لا بتوقّع نص.
 */
await t("16.3 تغيّر حقيقي ⇒ إطار ثانٍ خلال ~5ثوانٍ", async () => {
  const ac = new AbortController();
  const res = await fetch(`${BASE}/api/qa/stream?view=live`, { signal: ac.signal });
  assert.equal(res.status, 200, `status=${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let frames = 0;
  let done = false;

  const pump = (async () => {
    // أي خطأ في القراءة (إغلاق، إلغاء، مهلة) لا يُفشل الاختبار: الفشل
    // المعني هو «لم يصل إطار ثانٍ»، لا «انقطع البث».
    try {
      while (frames < 2) {
        const { value, done: ended } = await reader.read();
        if (ended) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n\n")) !== -1) {
          frames++;
          buf = buf.slice(i + 2);
          if (frames >= 2) return;
        }
      }
    } catch {
      /* إغلاق مقصود أو انقطاع — يُحسم بعد الحلقة */
    }
  })();

  await new Promise((r) => setTimeout(r, 700));
  /**
   * ⚠️ السؤال المعلّق **لا يظهر في اللقطة العامة**، فبصمة اللقطة لا تتغيّر
   * ولا يُصدر البث إطاراً ثانياً. النسخة الأولىسأل سؤالاً معلّقاً
   * وطالبت بإطار — والبث كان سليماً. لا تغيير في البث بلا تغيير في
   * ما يُبثّ فعلاً: نعتمد.
   */
  const poke = await ask(attendeeId, uniq("sse-poke"));
  assert.equal(poke.status, 201, `لم يُقبل سؤال التهييج: ${poke.status}`);
  await approve(poke.body.question.id);

  const timeout = new Promise((r) => setTimeout(r, 9000));
  await Promise.race([pump, timeout]);
  done = true;
  ac.abort();
  void done;
  assert.equal(frames, 2, `وصل ${frames} إطار فقط — البث لا يلتقط التغيير`);
});

/* ══ 17. ثوابت النقرات والصياغة ══ */
section("17) ثوابت");

await t("17.1 كل ردود الخطأ تحمل no-store", async () => {
  for (const res of [
    await post("/api/qa/question", { attendeeId }, {}),
    await post("/api/qa/admin/moderate", { action: "feature", sessionId }, AUTH),
  ]) {
    assert.equal(res.headers.get("cache-control"), "no-store");
    await res.text().catch(() => {});
  }
});
await t("17.2 تفاصيل zod فيها مصفوفة fieldErrors", async () => {
  const res = await post("/api/qa/attendee/join", {}, {});
  const body = await j(res);
  assert.ok(Array.isArray(body.details?.fieldErrors?.name), `details=${JSON.stringify(body.details)}`);
});
await t("17.3 مسار مجهول ⇒ 404 من Next لا 500", async () => {
  const res = await fetch(`${BASE}/api/qa/admin/no-such-route`, { headers: AUTH });
  assert.equal(res.status, 404, `status=${res.status}`);
});

/* ══ تنظيف ══ */
await post("/api/qa/admin/session", { action: "delete", sessionId }, AUTH).catch(() => {});

/* ══ التقرير ══ */
console.log(`\n${"─".repeat(60)}`);
if (failures.length) {
  console.log(`\n⛔ ${failures.length} إخفاق:\n`);
  for (const f of failures) {
    console.log(`  [${f.section}] ${f.name}`);
    console.log(`    ${f.err.message.split("\n").slice(0, 6).join("\n    ")}\n`);
  }
}
console.log(`نجح: ${passed}   فشل: ${failures.length}`);
process.exit(failures.length ? 1 : 0);
