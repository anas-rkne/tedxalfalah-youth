import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import creds from "../scripts/qa-test-credentials.json";

/**
 * الطبقة 8: **البوابات التي كان وضع الاختبار يُطفئها**.
 *
 * 🎯 لماذا لا تكفي الطبقات 1–7: كل طبقة سابقة تعمل مع `QA_TEST_MODE=1`،
 * وهذا الوضع — بحكم تصميمه — يؤسّع CORS ويقبل رمز Turnstile الوهمي. أي أن
 * 403 و429 لم يكونا **مختبَرين** بل **معطّبين**: اختبار نجاح تحت وضع
 * الاختبار يمرّ حتى لو حُذف `validateOrigin` أو تعطيل `verifyTurnstile`
 * كلّهما. وهذه الطبقة وحدها تكشف ذلك.
 *
 * ⛔ خادم منفصل على منفذ 3223 (`--secure`): وضع الاختبار **مطفأ** فيه،
 * و`TURNSTILE_SECRET_KEY` مضبوط (وهمي) ⇒ فحص البوت حقيقي، و`UPSTASH_*`
 * تُشير إلى خادم Redis في الذاكرة ⇒ حدّ المعدّل الحقيقي فوق نفس مكتبة
 * `@upstash/ratelimit` المستعملة في الإنتاج.
 *
 * 🎯 لماذا عنوان IP مختلف لكل اختبار: المحدّد `${formKey}:${ip}`، والطلب
 * بلا عنوان يعطي "unknown" فيشارك الجميع دلواً واحداً — فبدون العناوين
 * يفسد اختبارٌ حدّ اختبارٍ بعده، ويُقرأ الفشل كخلل في البوابة.
 *
 * ⛔ `request` fixture لا `page`: كل ما هنا استدعاءات API، فبلا متصفّح
 *    لا `--no-startup-window` ولا تنزيل متصفح، ولا فشل إطلاق Edge.
 */

/** أصل مصرّح به في `ALLOWED_API_ORIGINS` لخادم 3223. */
const OK_ORIGIN = "http://localhost:3223";
/** أصل خادم وضع الاختبار (3222): مسموح هناك بتوسيع الوضع، ومرفوض هنا. */
const TEST_MODE_ORIGIN = "http://localhost:3222";
const EVIL_ORIGIN = "https://evil.example";

const ADMIN_PW = creds.adminPassword;
const VIEWER_PW = creds.viewerPassword;

const READ_URL = "/api/qa/session/current?view=audience";
const QUESTIONS_URL = "/api/qa/admin/questions";
const LOGIN_URL = "/api/admin/login";

let ipCounter = 0;
/** عنوان IP مميّز لكل سيناريو (الحدّ per-IP، و"unknown" يشارك الجميع). */
function ip(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function get(
  request: APIRequestContext,
  url: string,
  headers: Record<string, string>
): Promise<APIResponse> {
  return request.get(url, { headers, timeout: 30_000 });
}

function postJson(
  request: APIRequestContext,
  url: string,
  data: unknown,
  headers: Record<string, string>
): Promise<APIResponse> {
  return request.post(url, {
    headers: { "content-type": "application/json", ...headers },
    data,
    timeout: 30_000,
  });
}

test.describe.configure({ mode: "serial" });

test("⛔ S1: فحص Origin حقيقي — أصل غريب 403، وأصل 3222 مرفوض بعد إطفاء وضع الاختبار", async ({
  request,
}) => {
  // أ) أصل غريب ⇒ 403. هذا ما كان **مُعطّلاً** في كل طبقة سابقة.
  const evil = await get(request, READ_URL, { origin: EVIL_ORIGIN, "x-forwarded-for": ip() });
  expect(evil.status(), "أصل غريب يجب أن يُرفض بـ403").toBe(403);

  // ب) أصل 3222 كان يُقبل **بتوسيع** وضع الاختبار؛ هنا يجب أن يُرفض —
  //    دليل مباشر على أن التوسيع انطفأ فعلاً، لا أنه «ليس مُفعّلاً أصلاً».
  const testMode = await get(request, READ_URL, {
    origin: TEST_MODE_ORIGIN,
    "x-forwarded-for": ip(),
  });
  expect(testMode.status(), "أصل 3222 يُسمح به في وضع الاختبار فقط").toBe(403);

  // ج) الأصل المصرّح به يمرّ — وإلا فالرفض أعمى وليس حارساً.
  const ok = await get(request, READ_URL, { origin: OK_ORIGIN, "x-forwarded-for": ip() });
  expect(ok.status(), "أصل مصرّح به يجب أن يمرّ").toBe(200);

  // د) بلا `Origin` (curl أو نفس الأصل) يُسمح به: سلوك مقصود وموثّق في
  //    cors.ts. يُثبَّت هنا كي لا «يُصلح» أحدٌ يوماً فيحطّم أدواتنا.
  const noOrigin = await get(request, READ_URL, { "x-forwarded-for": ip() });
  expect(noOrigin.status(), "غياب Origin مسموح عمداً").toBe(200);
});

test("⛔ S2: Turnstile مغلق — بلا رمز 403، ومع رمز باطل 403، ولا تجاوز برمز الاختبار", async ({
  request,
}) => {
  const forged = "0x0000000000000000000000000000000a0000000000000000000000000000b";
  const body = (text: string, token?: string) => ({
    attendeeId: "a-security",
    name: "Security",
    text,
    turnstileToken: token,
  });

  // ⛔ الرمز **الغائب** هو الحالة الحرجة: قبل `--secure` كان
  //    `TURNSTILE_SECRET_KEY` فارغاً فيُقبل كل طلب بلا رمز.
  const missing = await postJson(request, "/api/qa/question", body(`سؤال بلا رمز ${ip()}`), {
    origin: OK_ORIGIN,
    "x-forwarded-for": ip(),
  });
  expect(missing.status(), "بلا رمز ⇒ 403 لا 400").toBe(403);

  const wrong = await postJson(request, "/api/qa/question", body(`سؤال برمز باطل ${ip()}`, forged), {
    origin: OK_ORIGIN,
    "x-forwarded-for": ip(),
  });
  expect(wrong.status(), "رمز غير صحيح ⇒ 403").toBe(403);

  // ⛔ لا تجاوز برمز الاختبار الوهمي: `qa-test-bypass` مرفوض هنا، وإلا
  //    لأمكن لصفحة فورم حقيقية أن تتجاوز الفحص بإرسال قيمة ثابتة واحدة.
  const bypass = await postJson(
    request,
    "/api/qa/question",
    body(`سؤال برمز الاختبار ${ip()}`, "qa-test-bypass"),
    { origin: OK_ORIGIN, "x-forwarded-for": ip() }
  );
  expect(bypass.status(), "رمز تجاوز الاختبار لا يعمل خارج وضع الاختبار").toBe(403);
});

test("⛔ S3: حدّ المعدّل الحقيقي 429 — والمحفظة المرفوضة تستهلك الرصيد أيضاً", async ({ request }) => {
  const target = ip();
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const res = await postJson(
      request,
      "/api/qa/question",
      { attendeeId: "a-429", name: "Security", text: `سؤال ${i}` },
      { origin: OK_ORIGIN, "x-forwarded-for": target }
    );
    statuses.push(res.status());
  }

  // 🎯 الترتيب مقصود: `checkRateLimit` **قبل** `verifyTurnstile`، فالمحاولات
  //    الخمس المرفوضة بـ403 تستهلك الرصيد والسادس يُمنع بـ429. هذا ضد
  //    الإغراق: بوت يجرّب ألف رمز باطل لا يبقى بلا نهاية. لو انقلب
  //    الترتيب لبقي منفذ مفتوح — وهذا هو السلوك الذي يُثبَّت هنا.
  expect(statuses, `ترتيب الحالات: ${statuses.join(",")}`).toEqual([
    403, 403, 403, 403, 403, 429,
  ]);
});

test("⛔ S4: تسجيل الدخول — 403 لأصل غريب، و401 لكلمة خاطئة، و400 لجسم غير صالح", async ({
  request,
}) => {
  // ⛔ كان `/api/admin/login` **المسار الوحيد** بلا `validateOrigin`.
  //    الأثر ليس سرقة الجلسة (الرد غير قابل للقراءة عبر النطاقات) بل
  //    **استهلاك رصيد المحاولات**: طلب بسيط `text/plain` من أصل غريب
  //    يُنفَّذ فعلاً، فيُحسب من عنوان المشرف ⇒ خمس محاولات ⇒ قفل عشر دقائق.
  const evil = await postJson(request, LOGIN_URL, { username: "admin", password: ADMIN_PW }, {
    origin: EVIL_ORIGIN,
    "x-forwarded-for": ip(),
  });
  expect(evil.status(), "تسجيل الدخول من أصل غريب يجب أن يُرفض").toBe(403);

  const wrongPw = await postJson(
    request,
    LOGIN_URL,
    { username: "admin", password: "wrong-password" },
    { origin: OK_ORIGIN, "x-forwarded-for": ip() }
  );
  expect(wrongPw.status(), "كلمة مرور خاطئة ⇒ 401").toBe(401);
  expect((await wrongPw.json()).token, "لا توكن على 401").toBeUndefined();

  const badJson = await request.post(LOGIN_URL, {
    headers: { "content-type": "text/plain", origin: OK_ORIGIN, "x-forwarded-for": ip() },
    data: "not-json",
    timeout: 30_000,
  });
  expect(badJson.status(), "جسم غير صالح ⇒ 400").toBe(400);

  const noUser = await postJson(request, LOGIN_URL, { password: ADMIN_PW }, {
    origin: OK_ORIGIN,
    "x-forwarded-for": ip(),
  });
  expect(noUser.status(), "اسم مستخدم ناقص ⇒ 400 لا 500").toBe(400);
});

test("⛔ S5: المصادقة — بلا توكن 401، ومشاهد 403، ومشرف 200", async ({ request }) => {
  const anon = await get(request, QUESTIONS_URL, { origin: OK_ORIGIN, "x-forwarded-for": ip() });
  expect(anon.status(), "بلا توكن ⇒ 401").toBe(401);

  const viewerLogin = await postJson(
    request,
    LOGIN_URL,
    { username: "viewer", password: VIEWER_PW },
    { origin: OK_ORIGIN, "x-forwarded-for": ip() }
  );
  expect(viewerLogin.status(), "دخول المشاهد ينجح").toBe(200);
  const viewerToken = (await viewerLogin.json()).token as string;
  expect(viewerToken, "المشاهد يستلم توكناً بدوره").toBeTruthy();

  // ⛔ الدور يُفحص في **المسار** لا في الواجهة: التوكن صحيح لكنه
  //    `viewer` ⇒ 403. لو اعتمدنا على إخفاء الأزرار لاختفى الفحص كله.
  const viewerRead = await get(request, QUESTIONS_URL, {
    origin: OK_ORIGIN,
    "x-forwarded-for": ip(),
    authorization: `Bearer ${viewerToken}`,
  });
  expect(viewerRead.status(), "مشاهد على مسار المشرف ⇒ 403").toBe(403);

  const adminLogin = await postJson(
    request,
    LOGIN_URL,
    { username: "admin", password: ADMIN_PW },
    { origin: OK_ORIGIN, "x-forwarded-for": ip() }
  );
  expect(adminLogin.status(), "دخول المشرف ينجح").toBe(200);
  const adminToken = (await adminLogin.json()).token as string;

  const adminRead = await get(request, QUESTIONS_URL, {
    origin: OK_ORIGIN,
    "x-forwarded-for": ip(),
    authorization: `Bearer ${adminToken}`,
  });
  expect(adminRead.status(), "مشرف ⇒ 200").toBe(200);
});

test("⛔ S6: انقطاع الهوية ⇒ 503 لا 401 — ولا قفل للمدير بسبب عطلٍ لم يختبره", async ({ request }) => {
  const adminLogin = await postJson(
    request,
    LOGIN_URL,
    { username: "admin", password: ADMIN_PW },
    { origin: OK_ORIGIN, "x-forwarded-for": ip() }
  );
  expect(adminLogin.status()).toBe(200);
  const token = (await adminLogin.json()).token as string;

  // ⛔ عطل مصدر الهوية: التمييز بين «خطأ عميل» و«الخدمة معطّلة» هو ما
  //    يمنع المشرف من تفسير عطلٍ بينيتي بأنه أخطأ في كلمة مروره.
  const down = await get(request, QUESTIONS_URL, {
    origin: OK_ORIGIN,
    "x-forwarded-for": ip(),
    authorization: `Bearer ${token}`,
    "x-qa-identity-failure": "1",
  });
  expect(down.status(), "عطل الهوية ⇒ 503 لا 401 ولا 500").toBe(503);
  expect(down.headers()["retry-after"], "503 يحمل مهلة إعادة محاولة").toBeTruthy();

  // 🎯 الأهم: **الاسترجاع**. سبع محاولات دخول، كلٌّ منها 503 لأن الهوية
  //    معطّلة، ولا واحدة تُستهلك من رصيد `admin-login`. لولا
  //    `refundRateLimit` لقفل المشرف عشر دقائق بسبب عطلٍ في Sheets لم
  //    يخطئ فيه ولا مرّة — وهي الحالة التي يشرح وجود الدالة أصلاً.
  const target = ip();
  const statuses: number[] = [];
  for (let i = 0; i < 7; i++) {
    const res = await postJson(
      request,
      LOGIN_URL,
      { username: "admin", password: ADMIN_PW },
      {
        origin: OK_ORIGIN,
        "x-forwarded-for": target,
        "x-qa-identity-failure": "1",
      }
    );
    statuses.push(res.status());
  }
  expect(statuses, `ترتيب الحالات: ${statuses.join(",")}`).not.toContain(429);
  expect(
    statuses.every((s) => s === 503),
    `كل المحاولات يجب أن تكون 503: ${statuses.join(",")}`
  ).toBe(true);

  // ثم يُثبَّت أن نفس العنوان ينجح فور تحسّن الخدمة: الرصيد لم يُستهلَك.
  const recovered = await postJson(request, LOGIN_URL, { username: "admin", password: ADMIN_PW }, {
    origin: OK_ORIGIN,
    "x-forwarded-for": target,
  });
  expect(recovered.status(), "الرصيد لم يُستهلك أثناء العطل").toBe(200);
});

test("⛔ S7: التحقّق من المدخلات قبل أي بوابة بشرية", async ({ request }) => {
  const bad = await postJson(request, "/api/qa/question", { attendeeId: "a" }, {
    origin: OK_ORIGIN,
    "x-forwarded-for": ip(),
  });
  expect(bad.status(), "جسم ناقص ⇒ 400").toBe(400);

  const long = await postJson(
    request,
    "/api/qa/question",
    { attendeeId: "a-long", name: "x", text: "ط".repeat(4000) },
    { origin: OK_ORIGIN, "x-forwarded-for": ip() }
  );
  expect(long.status(), "نص أطول من 300 ⇒ 400 بلا انهيار").toBe(400);
});
