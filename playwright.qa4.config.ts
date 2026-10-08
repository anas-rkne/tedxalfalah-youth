import { defineConfig, devices } from "@playwright/test";

/**
 * الطبقة 4: أسطح الجلسة التي يلمسها الضيف والمشرف — الإنشاء والتفعيل،
 * الاستبيان، الاستطلاع، الأسئلة المفتوحة، والتحليلات.
 *
 * نفس قواعد `playwright.qa3.config.ts`:
 *   - **Desynchronized**: كل اختبار يبني جلسته بنفسه فيبدأ من الصفر،
 *     فلا يعتمد على ترتيب ولا ينتقل أثر اختبار فاشل إلى ما بعده.
 *     الاستثناء الوحيد: الطبقات ١–٣ تشترك في جلسة واحدة عمداً (قاعدة C3)،
 *     وهذه الطبقة **لا تشترك** — كل اختبار يبني جلسته.
 *   - منفذ 3222 مع `channel: "msedge"` و`--dev` (fail-closed Turnstile)
 *     و`workers: 1`.
 *
 * ⚠️ ٩٠ ثانية لكل اختبار: كل اختبار يُنشئ جلسة ويوقظها، ودورة بثّ كاملة
 * (٣ ثوانٍ) لكل تأكيد.
 */
const PORT = Number(process.env.QA_TEST_PORT ?? 3222);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /qa-surfaces\.spec\.ts/,
  timeout: 90_000,
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
    /** وضع `--dev` هو fail-closed في Turnstile: بلا مفتاح حقيقي يرفض الإرسال. */
    command: "node scripts/qa-test-server.mjs --dev",
    url: `${BASE}/api/qa/session/current?view=audience`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "qa-surfaces",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
});
