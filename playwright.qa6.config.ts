import { defineConfig, devices } from "@playwright/test";

/**
 * الطبقة 6: الضوابط الإدارية (حذف، تحديث، خروج، تمييز، شاشة المتحدث،
 * دورة الاستطلاع) + طبقة 7: تدفّق الحضور وحالات التدهور (اتصال، إجابة،
 * تحليلات، استبيان).
 *
 * نفس قواعد `playwright.qa5.config.ts`: منفذ 3222، `channel: "msedge"`،
 * `--dev`، `workers: 1`. مهلة ١٥٠ ثانية: سيناريوهات التدهور **تنتظر**
 * دورات بثّ كاملة (٣–٥ ثوانٍ) بعد قطع الشبكة عمداً.
 */
const PORT = Number(process.env.QA_TEST_PORT ?? 3222);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /qa-(controls|attendee-flows)\.spec\.ts/,
  timeout: 150_000,
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
      name: "qa-controls",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
});
