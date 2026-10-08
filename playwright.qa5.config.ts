import { defineConfig, devices } from "@playwright/test";

/**
 * الطبقة 5: سلوك المشروعور — الدوران التلقائي، التثبيت، وسحابة الكلمات.
 *
 * نفس قواعد `playwright.qa3/qa4.config.ts`:
 *   - **Desynchronized**: كل اختبار يبني جلسته بنفسه فلا يعتمد على
 *     ترتيب، و`mode: "serial"` يمنع تصادم جلستين نشطتين.
 *   - منفذ 3222 مع `channel: "msedge"` و`--dev` (fail-closed Turnstile)
 *     و`workers: 1`.
 *
 * ⚠️ أطول من الطبقات السابقة عمداً: التدوير ٧ ثوانٍ، واختبار «لا يتقدّم
 * وحده» ينتظر ١٦ ثانية. مهلة ١٢٠ ثانية لكل اختبار لا ٩٠.
 */
const PORT = Number(process.env.QA_TEST_PORT ?? 3222);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /qa-projector\.spec\.ts/,
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
    command: "node scripts/qa-test-server.mjs --dev",
    url: `${BASE}/api/qa/session/current?view=audience`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "qa-projector",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
});
