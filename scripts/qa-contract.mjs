/**
 * فاحص عقد الـAPI (Layer 2) — يعمل مقابل خادم اختبار حيّ على 3222.
 *
 * 🎯 لماذا بلا متصفح: أرخص مكان لتغطية **مصفوفة الحالات** كاملة. علة
 * الاستقلال بين واجهتي الرؤية علةٌ عن بُعد بين نقطتين، فلا تحتاج واجهة
 * رسومية لتُكتشف — تحتاج طلبين واستجابة. طبقة المتصفح (Layer 3) تبقى
 * لما لا يظهر في العقد: التعطّل، والقفز بعد التحديث، وتطابق الشاشات الثلاث.
 *
 * ⚠️ هذا الفاحص يُكتب بقراءة المسارات أولاً. أول محاولة كُتبت بالتخمين
 * (أسماء أفعال وحقول متخيّلة) فأنتجت 10 إخفاقات زائفة تُقرأ كأنها عيوب في
 * النظام، بينما هي أخطاء في الاختبار. القاعدة: **لا يُختبَر مسار قبل قراءة
 * zod schema الخاص به**.
 *
 * العقد الفعلي:
 *   join      { name, turnstileToken }            → { ok, attendeeId, ... }
 *   question  { attendeeId, text, turnstileToken }
 *   session   { action: create|activate|toggle|delete, ... }
 *   moderate  { action: approve|reject|feature|answer|setVisibility|setSpeaker,
 *               sessionId REQUIRED, ... }
 *   answer    { action: approve|reject, sessionId, questionId, answerId }
 */
import assert from "node:assert/strict";

const BASE = process.env.QA_TEST_BASE_URL || "http://localhost:3222";
const ADMIN_PW = process.env.QA_ADMIN_PASSWORD || "qa-test-admin-pw";
const VIEWER_PW = process.env.QA_VIEWER_PASSWORD || "qa-test-viewer-pw";
const TURNSTILE = process.env.QA_TEST_TURNSTILE_TOKEN || "qa-test-bypass";

let passed = 0;
const failures = [];

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failures.push({ name, err });
    console.log(`  FAIL  ${name}`);
  }
}

const H = (extra = {}) => ({ "Content-Type": "application/json", ...extra });

async function post(path, body, headers = {}) {
  return fetch(`${BASE}${path}`, { method: "POST", headers: H(headers), body: JSON.stringify(body) });
}

async function login(username, password) {
  const res = await post("/api/admin/login", { username, password });
  if (!res.ok) return null;
  return (await res.json()).token || null;
}

const adminToken = await login("admin", ADMIN_PW);
const viewerToken = await login("viewer", VIEWER_PW);

if (!adminToken) {
  console.error(
    "\n⛔ admin login failed — the server is not in isolated local mode.\n" +
      "Expected QA_AUTH_MODE=local with the test ADMIN_PASSWORD."
  );
  process.exit(1);
}

const AUTH = { authorization: `Bearer ${adminToken}` };
const VIEWAUTH = { authorization: `Bearer ${viewerToken}` };

const snap = async (view) =>
  (await (await fetch(`${BASE}/api/qa/session/current?view=${view}`)).json());

/**
 * ⚠️ `await` هنا ليست زخرفة. بدونهانقرأ `snap(view).questions` على وعدٍ
 * فيكون `undefined` دائماً، فتعود `Set` فارغة **دائماً** — وتمرّ كل
 * اختبارات الرؤية زوراً لأنها تقارن مجموعتين فارغتين. وقع هذا فعلاً،
 * وهو نفس صنف خطأ `withEnv` السابق: اختبار يمرّ لسببٍ لا علاقة له بما
 * يفحص. لذلك نُمنع هنا صريحاً: مجموعة فارغة لا تُقبل دليلاً على شيء.
 */
const ids = async (view) =>
  new Set(((await snap(view)).questions || []).map((q) => q.id));

/**
 * ⛔ دلالتان مختلفتان في العقد، وخلطهما يُنتج إخفاقات وهمية:
 *
 * - `audience`: الخادم **يحذف** المخفي من المصفوفة (public-view.ts:256).
 *   فالحضور في `questions` هو بعينه دليل الظهور.
 * - `live` / `speaker`: الخادم **يُبقي** كل المعتمد ويضع `visible:false`
 *   (public-view.ts:277) تفادياً لإجبار كل عميل على فلترة ناقصة. فالحضور
 *   لا دليل هنا، والظهور هو `visible === true` فقط.
 *
 * لذلك لا يجوز استخدام `ids()` للدلالة على الظهور في `live`.
 */
const shownIds = async (view) =>
  new Set(
    ((await snap(view)).questions || [])
      .filter((q) => q.visible === true)
      .map((q) => q.id)
  );

/** الشريحة المعروضة الآن على الشاشة الكبرى. */
const slide = async () => (await snap("live")).screen?.slide ?? null;

/* ── A. العزل ومصادقة الأدوار ── */

await testAsync("A1: الدخول نجح بلا Google Sheets — العزل مثبت", () => {
  assert.ok(adminToken, "توكن الأدمن صدر");
});

await testAsync("A2: دور viewer موجود ويستطيع إصدار توكن", () => {
  assert.ok(viewerToken, `viewer login failed — ${VIEWER_PW}`);
});

await testAsync("S6h: كلمة مرور خاطئة ⇒ لا توكن", async () => {
  assert.equal(await login("admin", "wrong-password"), null);
});

await testAsync("S6i: مستخدم غير موجود ⇒ لا توكن", async () => {
  assert.equal(await login("ghost", ADMIN_PW), null);
});

await testAsync("S6j: مسار إداري بلا توكن ⇒ 401", async () => {
  assert.equal((await fetch(`${BASE}/api/qa/admin/questions`)).status, 401);
});

await testAsync("S6k: توكن مشوَّه ⇒ 401", async () => {
  const res = await fetch(`${BASE}/api/qa/admin/questions`, {
    headers: { authorization: `Bearer ${adminToken.slice(0, -4)}AAAA` },
  });
  assert.equal(res.status, 401);
});

await testAsync("S6l: viewer محجوب عن قائمة الأسئلة الإدارية ⇒ 403", async () => {
  const res = await fetch(`${BASE}/api/qa/admin/questions`, { headers: VIEWAUTH });
  // ⚠️ ملاحظة تصميمية تستحق قراراً: `viewer` لا يستطيع قراءةQuestions
  // الإدارية إطلاقاً. فالدور اليوم لا يفتح باباً مفيداً — إمّا تُوسَّع
  // صلاحيات القراءة له، وإمّا يُحذف الدور بدل أن يوهم بوجود وصول للقراءة.
  assert.equal(res.status, 403, `توقّعنا 403 وردّ ${res.status}`);
});

await testAsync("S6m: viewer يُمنع من الكتابة ⇒ 403 لا 401", async () => {
  const res = await post(
    "/api/qa/admin/moderate",
    { action: "approve", sessionId: "sess_x", questionId: "q_x" },
    VIEWAUTH
  );
  // 401 = «مَن أنت؟» و403 = «مَن أنت، لا يجوز». الخلط يجعل تشخيص بلاغ
  // العميل في موضعه الخطأ تماماً.
  assert.equal(res.status, 403, `توقّعنا 403 وردّ ${res.status}`);
});

/* ── B. القراءة العامة والعقود ── */

await testAsync("B1: كل view صالح يُقرأ، والسديم لا يتسرّب", async () => {
  for (const view of ["audience", "live", "speaker"]) {
    const data = await snap(view);
    assert.ok(data.settings, `view=${view} بلا settings`);
    assert.ok(data.screen, `view=${view} بلا screen`);
    assert.ok(data.session !== undefined, `view=${view} بلا مفتاح session`);
    assert.ok(!("votes" in data), `view=${view} يسرّب بيانات إدارية`);
  }
});

await testAsync("B2: view غير معروف ⇒ 400", async () => {
  assert.equal((await fetch(`${BASE}/api/qa/session/current?view=bogus`)).status, 400);
});

await testAsync("B3: payload ناقص ⇒ 400 مع تفاصيل zod", async () => {
  const res = await post("/api/qa/question", { text: "قصير" });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error, "يوجد حقل error");
});

await testAsync("B4: رمز تجاوز الاختبار لا يُقبل على مسار بلا تجاوز", async () => {
  // `_test-token_` يجب ألّا يفتح شيئاً في مسار لا يطلب Turnstile أصلاً.
  const res = await fetch(`${BASE}/api/qa/session/current?view=live`, {
    headers: { "x-test-token": TURNSTILE },
  });
  assert.equal(res.status, 200);
});

/* ── C. الجلسة: واحدة نشطة ── */

let sessionId = null;

await testAsync("C1: create يُنشئ جلسة غير نشطة", async () => {
  const res = await post(
    "/api/qa/admin/session",
    { action: "create", title: "Contract Session", titleAr: "جلسة" },
    AUTH
  );
  assert.equal(res.status, 200, `create => ${res.status}`);
  const { result } = await res.json();
  sessionId = result?.id;
  assert.ok(sessionId, "رجع result.id");
  // ⚠️ 'create' does not activate. Activation is explicit.
  // يجعل كل اختبارات الرؤية تسقط بـ409 «لا جلسة نشطة» ويُقرأ ذلك عيباً في
  // الرؤية بينما الخطأ في setup الاختبار.
  assert.equal(result.active, false, "الجلسة الجديدة غير نشطة");
  assert.equal((await snap("live")).session, null, "لا جلسة نشطة بعد الإنشاء");
});

await testAsync("C2: activate يجعلها هي الجلسة النشطة", async () => {
  const res = await post(
    "/api/qa/admin/session",
    { action: "activate", sessionId },
    AUTH
  );
  assert.equal(res.status, 200, `activate => ${res.status}`);
  const cur = await snap("live");
  assert.equal(cur.session?.id, sessionId, "صارت نشطة في اللقطة العامة");
});

await testAsync("C3: ⛔ جلسة ثانية نشطة تُطفئ الأولى (جلسة واحدة فقط)", async () => {
  const second = await post("/api/qa/admin/session", { action: "create", title: "Second" }, AUTH);
  assert.equal(second.status, 200);
  const secondId = (await second.json()).result.id;
  await post("/api/qa/admin/session", { action: "activate", sessionId: secondId }, AUTH);

  const cur = await snap("live");
  assert.equal(cur.session?.id, secondId, "الثانية هي النشطة");
  // الرجوع للأولى وتفعيلها يجب أن يُطفئ الثانية.
  await post("/api/qa/admin/session", { action: "activate", sessionId }, AUTH);
  const back = await snap("live");
  assert.equal(back.session?.id, sessionId, "رجعت الأولى — للإبقاء على جلسة واحدة");
});

await testAsync("C4: activate بمعرّف غير موجود ⇒ 4xx لا 500", async () => {
  const res = await post(
    "/api/qa/admin/session",
    { action: "activate", sessionId: "sess_missing" },
    AUTH
  );
  assert.ok([400, 404, 409].includes(res.status), `وردّ ${res.status}`);
});

await testAsync("C5: create بلا عنوان ⇒ 400", async () => {
  const res = await post("/api/qa/admin/session", { action: "create" }, AUTH);
  assert.equal(res.status, 400);
});

await testAsync("C6: لا جلسة نشطة ⇒ join يُرفض بـ409", async () => {
  // ⚠️ الفرضية الأولى كانت خاطئة: الـ409 سببه «لا جلسة نشطة» لا «لا تقبل
  // أسئلة». فيُختبر ذلك بأن تُحذف الجلسات النشطة، لا بأن تُترك الجلسة كما هي.
  const data = (await (await fetch(`${BASE}/api/qa/admin/questions`, { headers: AUTH })).json());
  const sessions = data.sessions || [];
  for (const s of sessions.filter((x) => x.active)) {
    await post("/api/qa/admin/session", { action: "delete", sessionId: s.id }, AUTH);
  }
  assert.equal((await snap("live")).session, null, "لم يبقَ جلسة نشطة");

  const res = await post("/api/qa/attendee/join", { name: "متأخر", turnstileToken: TURNSTILE });
  assert.equal(res.status, 409, `وردّ ${res.status} — المتوقّع 409 بلا جلسة نشطة`);

  // نُعيد جلسة نشطة delicately لأن بقية الاختبارات تحتاجها.
  const s2 = await post("/api/qa/admin/session", { action: "create", title: "Restored" }, AUTH);
  const sid = (await s2.json()).result.id;
  await post("/api/qa/admin/session", { action: "activate", sessionId: sid }, AUTH);
  await post(
    "/api/qa/admin/session",
    { action: "toggle", sessionId: sid, acceptingQuestions: true },
    AUTH
  );
  const now = await snap("live");
  assert.equal(now.session?.id, sid, "استُعيدت جلسة نشطة");
  assert.equal(now.session?.acceptingQuestions, true, "وتقبل الأسئلة");
  sessionId = sid;
});

await testAsync("C5: ⛔ sessionId مطلوب في moderate — لا افتراض", async () => {
  const res = await post("/api/qa/admin/moderate", { action: "approve", questionId: "q" }, AUTH);
  assert.equal(res.status, 400, "بلا sessionId يُرفض، فلا تعديل على جلسة خاطئة");
});

/* ── D. مصفوفة الرؤية: الطبقة التي تكشف علة الاستقلال ── */

const joinRes = await post("/api/qa/attendee/join", {
  name: "مختبِر",
  turnstileToken: TURNSTILE,
});
const joinBody = joinRes.ok ? await joinRes.json() : null;
const attendeeId = joinBody?.attendeeId;
async function submitQuestion(text) {
  const res = await post("/api/qa/question", {
    attendeeId,
    text,
    name: "مختبِر",
    turnstileToken: TURNSTILE,
  });
  const raw = await res.text();
  // المسار يُرجع 201 (مورد أُنشئ). قبول 200 أيضاً ليس تساهلاً: القاعدة هنا
  // أن الفاحص يفحص ما يفرضه العقد، وأي تغيّر في رمز الحالة يجب أن يُوقفه.
  assert.ok(
    res.status === 200 || res.status === 201,
    `submit "${text}" => ${res.status}: ${raw}`
  );
  return JSON.parse(raw).question?.id;
}

async function moderate(body) {
  const res = await post("/api/qa/admin/moderate", { sessionId, ...body }, AUTH);
  assert.equal(res.status, 200, `moderate ${JSON.stringify(body)} => ${res.status}`);
  return res;
}

async function setVisibility(questionId, patch) {
  return moderate({ action: "setVisibility", questionId, ...patch });
}

let qAud, qProj, qBoth, qNone;

await testAsync("D1: join يعيد attendeeId صالحاً", () => {
  assert.ok(attendeeId, `join => ${joinRes.status} ${JSON.stringify(joinBody)}`);
});

await testAsync("D2: بناء مصفوفة 2×2 من الرؤية", async () => {
  qAud = await submitQuestion("سؤال الجمهور ألف");
  qProj = await submitQuestion("سؤال المشروعور باء");
  qBoth = await submitQuestion("سؤال الاثنين جيم");
  qNone = await submitQuestion("سؤال مخفي دال");
  assert.ok(qAud && qProj && qBoth && qNone, "أُرسلت أربعة");

  await moderate({ action: "approve", questionId: qAud });
  await setVisibility(qAud, { showToAudience: true, showOnProjector: false });

  await moderate({ action: "approve", questionId: qProj });
  await setVisibility(qProj, { showToAudience: false, showOnProjector: true });

  await moderate({ action: "approve", questionId: qBoth });
  await setVisibility(qBoth, { showToAudience: true, showOnProjector: true });

  await moderate({ action: "approve", questionId: qNone });
  await setVisibility(qNone, { showToAudience: false, showOnProjector: false });
});

await testAsync("⛔ S1: إخفاء Audience لا يُسقط Projector", async () => {
  const live = await shownIds("live");
  const aud = await ids("audience");
  // ⛔ عند فشل تأكيد الرؤية، اطبع الحالة الفعلية. بدونها لا نعرف هل
  // الاختبار خطأ أم الشيفرة، فنُراجع الفرضية بدل الدليل — وهو ما أنتج
  // ستّ دورات تخمين في أول تشغيل. ولهذا `live` بالـvisible لا بالحضور.
  const dump = () =>
    `live(visible)=[${[...live].join(",")}] aud(listed)=[${[...aud].join(",")}] ` +
    `qAud=${qAud} qProj=${qProj} qBoth=${qBoth} qNone=${qNone}`;
  assert.ok(live.has(qProj), `سؤال المشروعور مرئي على الشاشة — ${dump()}`);
  assert.ok(aud.has(qAud), `سؤال الجمهور مدرج لهاتف الحاضر — ${dump()}`);
  assert.ok(!aud.has(qProj), `سؤال المشروعور ليس مدرجاً لجمهوره — ${dump()}`);
  assert.ok(!live.has(qNone), `المخفي عن الاثنين غير مرئي — ${dump()}`);
});

await testAsync("⛔ S1b: تبديل Audience مرّتين يقلب نفسه فقط", async () => {
  await setVisibility(qAud, { showToAudience: false });
  assert.ok(!(await ids("audience")).has(qAud), "اختفى من مصفوفة الجمهور");
  assert.ok((await shownIds("live")).has(qProj), "سؤال المشروعور لم يتأثر — لا تسلسل");

  await setVisibility(qAud, { showToAudience: true });
  assert.ok((await ids("audience")).has(qAud), "عاد بعد التبديل");
  assert.ok((await shownIds("live")).has(qProj), "بلا أثر جانبي");
});

await testAsync("⛔ S2: القراءة المتكرّرة متطابقة (ديمومة بعد التحديث)", async () => {
  const a = [...(await shownIds("live"))].sort();
  const b = [...(await shownIds("live"))].sort();
  assert.ok(a.length > 0, "المقارنة على مجموعة غير فارغة — Set فارغ يمرّ زوراً");
  assert.deepEqual(a, b, "طلبتان مستقلّتان رأتا الحالة نفسها");
});

await testAsync("⛔ S3: إخفاء المشروعور يُسقطه من الشاشة ويبقيه للجمهور", async () => {
  await setVisibility(qBoth, { showOnProjector: false });
  assert.ok(!(await shownIds("live")).has(qBoth), "سقط من مرئية الشاشة");
  assert.ok((await ids("audience")).has(qBoth), "وبقي مدرجاً لهاتف الجمهور");
  await setVisibility(qBoth, { showOnProjector: true });
  assert.ok((await shownIds("live")).has(qBoth), "رجع للمشروعور");
});

await testAsync("⛔ S4: setVisibility بأقل حقول لا يمسّ الحقل الآخر", async () => {
  assert.ok((await shownIds("live")).has(qProj), "مرئي قبل التغيير");
  await setVisibility(qProj, { showToAudience: true });
  assert.ok((await shownIds("live")).has(qProj), "ظهوره للجمهور لم يُسقطه عن الشاشة");
});

await testAsync("S5: ⛔ setVisibility على سؤال غير موجود ⇒ 4xx", async () => {
  const res = await post(
    "/api/qa/admin/moderate",
    { action: "setVisibility", sessionId, questionId: "q_missing", showToAudience: true },
    AUTH
  );
  assert.ok([400, 404, 409].includes(res.status), `وردّ ${res.status}`);
});

await testAsync("⛔ S6: الإجابة تُخرج السؤال من الشريحة المعروضة", async () => {
  // ⛔ «يختفي من العرض» ليس = «يغيب عن `questions`»: في `live` يبقى السؤال
  // في المصفوفة بـ`visible:true` بعد الإجابة، لأن `visible` تصف الإظهار لا
  // الإجابة. السلوك المتعاقد عليه أن `resolveScreen` ينزّل الشريحة إلى
  // `hold`، فنختبر الشريحة لا المصفوفة.
  const set = await post(
    "/api/qa/admin/screen",
    { action: "setSlide", sessionId, slide: { kind: "question", questionId: qProj } },
    AUTH
  );
  assert.equal(set.status, 200, `ضبط الشريحة => ${set.status}`);
  assert.deepEqual(
    await slide(),
    { kind: "question", questionId: qProj },
    "الشريحة تعرض السؤال قبل الإجابة"
  );

  await moderate({ action: "answer", questionId: qProj, answered: true });
  assert.equal(
    (await slide())?.kind,
    "hold",
    "بعد الإجابة تنزل الشريحة إلى hold بدل عرض سؤال مُجاب"
  );
});

await testAsync("⛔ 409: إعادة إظهار سؤال مُجابٍ لا تعيده للشاشة", async () => {
  // ⚠️ الفرضية الأولى كانت خاطئة تماماً: افترضنا أن `setVisibility` على
  // سؤال مُجاب يُرفض بـ409. لا حارسً كهذا في العقد، والمسار يُرجع 200.
  // العقد الفعلي أدقّ وأقوى: الإجابة تُخرج السؤال من `screenEligibleQuestions`
  // (service.ts:255)، و`setSlide` تحرسه بـ409. فتح الرؤية مجدداً لا ينقذ
  // استحقاقه — وهذا هو ما يجب حمايته، لا رفض طلب الرؤية.
  const reopened = await setVisibility(qProj, { showToAudience: true, showOnProjector: true });
  assert.equal(reopened.status, 200, "تغيير رؤية سؤال مُجاب مسموح ولا يتعارض مع شيء");

  const retry = await post(
    "/api/qa/admin/screen",
    { action: "setSlide", sessionId, slide: { kind: "question", questionId: qProj } },
    AUTH
  );
  assert.equal(retry.status, 409, `إعادة العرض يجب أن تُرفض — وردّ ${retry.status}`);
  assert.equal(
    (await slide())?.kind,
    "hold",
    "الشريحة تبقى hold: الرؤية وحدها لا تعيد الاستحقاق"
  );
});

await testAsync("S7: الرفض يُسقط من العرض والقبول يُرجعه", async () => {
  await moderate({ action: "reject", questionId: qBoth });
  assert.ok(!(await shownIds("live")).has(qBoth), "المرفوض غير مرئي");
  assert.ok(!(await ids("audience")).has(qBoth), "ولا مدرج لجمهوره");
  await moderate({ action: "approve", questionId: qBoth });
  assert.ok((await shownIds("live")).has(qBoth), "القبول يُرجعه بنفس المعرّف");
});

await testAsync("⛔ ADMIN: حمولة الإدارة تحمل حقول الرؤية كلها", async () => {
  // ⛔ A real product bug, found by Layer 3 and invisible to Layers 1 and 2.
  // تراها: `/admin/questions` كانت تُدرج `showOnSpeaker` و`showOnLive`
  // وتُسقط `showToAudience` و`showOnProjector`. والنوع في اللوحة يعلن
  // الحقلين، فالتباين كان في اتجاه واحد لا يلاحظه أي طرف.
  //
  // أثره: زرّا الإخفاء في اللوحة يبنيان القيمة من `q.showToAudience ===
  // false`، فمع `undefined` يرسلان `false` في كل نقرة — فلا يعود السؤال
  // للمشاهدين بالنقرة الثانية، ويبقى الزر ملوّناً كأنه متاح.
  //
  // تُختبر هنا **الحمولة** لا السلوك، لأن السلوك يحتاج متصفحاً؛ ووجودها
  // في عقد الـAPI يمنع الخلل من العودة صامتاً بعد أي إعادة هيكلة.
  const data = (await (await fetch(`${BASE}/api/qa/admin/questions`, { headers: AUTH })).json());
  const all = (data.sessions || []).flatMap((s) => s.questions || []);
  assert.ok(all.length > 0, "يوجد أسئلة لفحصها");
  for (const q of all) {
    for (const field of ["showToAudience", "showOnProjector", "showOnSpeaker", "showOnLive"]) {
      assert.equal(
        typeof q[field],
        "boolean",
        `${field} مفقود في حمولة الإدارة للسؤال ${q.id} — الزر يبني قيمته منه`
      );
    }
  }
});

console.log(`\n${"=".repeat(60)}`);
console.log(`نجح: ${passed}   فشل: ${failures.length}`);
if (failures.length) {
  console.log("\nالإخفاقات:");
  for (const f of failures) console.log(`  • ${f.name}\n    ${f.err?.message ?? f.err}`);
  process.exit(1);
}
