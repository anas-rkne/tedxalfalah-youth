import { defineConfig, devices } from "@playwright/test";

/**
 * الطبقة 3: متصفح حقيقي بثلاثة سياقات **متزامنة** على جلسة واحدة.
 *
 * ⚠️ لماذا ملف إعداد منفصل عن `playwright.qa.config.ts`:
 * ذلك يعمل على منفذ 3110 ويقرأ `ADMIN_PASSWORD` من `.env.local` الحقيقي،
 * أي بياناتك وخدماتك. هذا يعمل على الخادم المعزول `qa-test-server.mjs`
 * (منفذ 3222: مستخدمون في الذاكرة، بيانات مؤقتة، بلا Sheets ولا Upstash
 * ولا Turnstile حقيقي). فالسابق يختبر الواجهة على خادمك، وهذا يختبرها على
 * خادم لا يستطيع حتى لو أخطأ أن يمسّ شيئاً عندك.
 *
 * ⛔ `channel: "msedge"` يعني متصفح النظام بلا تنزيل: مجلد `ms-playwright`
 * شبه فارغ في هذه البيئة. ولو استبدلناه بـ`devices["Desktop Chrome"]` بلا
 * `channel` لأخفق التشغيل كله بـ"Executable doesn't exist" — عطل بيئة لا
 * عطل منتج. تحقق من وجود المتصفح قبل التشغيل.
 */
const PORT = Number(process.env.QA_TEST_PORT ?? 3222);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /qa-three-surface\.spec\.ts/,
  /**
   * ⛔ لا نرفع المهلة لتفادي فشل زمني. كل اختبار هنا يقيم **ثلاثة
   * متصفحات** على نفس الجلسة، وكل تأكيد ينتظر حدث بثّ (SSE). 90 ثانية
   * سقفٌ كافٍ، وما زاد عليها فهو عيبٌ يستحق التوقف لا مُهلة تُدّهن.
   */
  timeout: 90_000,
  expect: { timeout: 20_000 },
  /**
   * ⛔ `serial` لا `fullyParallel`.
   *
   * الاختبارات تشترك في **جلسة واحدة نشطة** (قاعدة «جلسة واحدة» التي
   * تحرسها C3)، فتشغيل اثنين تزاملياً يجعل كلٍّ منهما يفعّل جلسته
   * ويُطفئ جلسة الآخر. عندها يُسقط الفشلُ اختباراً سليماً، فيُصلَّح
   * «خطأ» لم يكن موجوداً — وهو أسوأ من الفشل الصريح لأنه يُنشئ عملاً
   * وهمياً. الطبقات 1 و2 متوازية بلا خادم؛ الطبقة 3 لا.
   */
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
    /**
     * ⛔ `--dev` إجباري، لا خيار.
     *
     * في `next start` يكون `NODE_ENV=production` و`TURNSTILE_SECRET_KEY`
     * فارغاً (عزل عن Cloudflare)، فـ`verifyTurnstile` يرفض **كل** طلب
     * محمي (fail-closed). ومع ذلك المتصفح لا يُنشئ رمزاً بلا مفتاح عام
     * حقيقي. النتيجة: كل اختبار متصفح على مسار الحاضر يسقط بـ403، ولا
     * يبقى إلا مفتاح Cloudflare حقيقي — وهو ما يمسّ خدمتك الحقيقية
     * ويُدخل الاختبار في نطاق لا نصدّره.
     *
     * وأُضيف استثناء في `verifyTurnstile` يقبل الرمز الغائب في وضع
     * الاختبار لتفادي ذلك ثم **حُذف**: يعني أن `""` يتجاوز فحص البوت على
     * أي خادم مُفعَّل الاختبار بلا مفتاح — وهو ما تمنعه الحالة 5 عمداً،
     * وحارسُها في `qa-unit.mjs` رفضه فعلاً. فلم نُضعّف حارساً حقيقياً
     * مقابل راحة اختبارية.
     *
     * الثمن الذي ندفعه ونعلنه: في التطوير بلا سرّ، `verifyTurnstile` يمرّر
     * أي رمز، فـE2E **لا** يكشف انحداراً في التحقق من البوت. تغطية ذلك
     * في اختبارات الوحدة حتمياً، لا هنا.
     */
    command: "node scripts/qa-test-server.mjs --dev",
    url: `${BASE}/api/qa/session/current?view=audience`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "qa-three-surface",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
});
