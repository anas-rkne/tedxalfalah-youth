import { defineConfig } from "@playwright/test";

/**
 * الطبقة 8: اختبارات البوابات الأمنية — وضع آمن حقيقي، لا وضع اختبار.
 *
 * ⛔ كل طبقات 1–7 تعمل مع `QA_TEST_MODE=1`، وهو وضع **يُطفئ** بالذات
 * ما تحميه البوابات: CORS موسَّع، رمز Turnstile الوهمي مقبول. فلا يمكن
 * لاختبار نجاح تحت وضع الاختبار أن يكشف حذف `validateOrigin` أو تعطيل
 * `verifyTurnstile` — وهذه الطبقة هي التي تكشفه.
 *
 * 🎯 المنفذ 3223 منفصل عن 3222 عمداً: حدّ `admin-login` (5 محاولات) حدّ
 * per-IP، وطلبات بلا عنوان تحمل "unknown" فتشترك في دلوٍ واحد — فلو
 * اشترك الخادمان لأغلق أحدهما تسجيل دخول الآخر واختُمي الخطأ كخلل.
 *
 * `--secure` يشغّل: وضع اختبار **مطفأ**، وسرّ Turnstile وهمي (فتُختبر
 * حالة الرفض)، وخادم Redis في الذاكرة (فتُختبر 429 و`refundRateLimit`
 * فوق `@upstash/ratelimit` الحقيقية).
 *
 * ⛔ لا متصفّح حقيقي هنا: كل الاختبارات على مستوى الـAPI
 * (`page.request`)، فمتصفح كامل بلا داعٍ يُبطئ الطبقات الأخرى.
 */
const PORT = Number(process.env.QA_SECURE_PORT ?? 3223);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /qa-security\.spec\.ts/,
  // تهريب مصدر الهوية متعمّد ⇒ أقل تشخيصٍ إلزامي، وإلا أُعيدت ٥ مرات.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [["list"]],
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: "node scripts/qa-test-server.mjs --dev --secure",
    url: `${BASE}/api/qa/session/current?view=audience`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
  },
    // ⛔ بلا متصفّح إطلاقاً: كل اختبارات هذه الطبقة على `request` fixture
  //    (استدعاءات API)، فلا `devices` ولا `channel` ولا تنزيل متصفح. أسرع،
  //    ولا يفشل على جهاز بلا Chrome، ولا يترك عملية متصفّح معلّقة.
  projects: [{ name: "qa-security" }],
});
