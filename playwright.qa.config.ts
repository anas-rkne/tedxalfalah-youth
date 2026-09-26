import { defineConfig, devices } from "@playwright/test";

/**
 * إعدادات Playwright الخاصة بتدفّق Q&A الحي.
 *
 * منفصلة عن `playwright.config.ts` عمداً: تلك تشغّل نسخة الإنتاج المستقلة
 * (standalone) على المنفذ 3001، بينما Q&A الحي يحتاج **خادم التطوير المعزول**
 * لأن `verifyTurnstile` يرفض الطلبات في الإنتاج بلا رمز حقيقي، ولا يستطيع
 * المتصفح الآلي توليد رمز صالح. كما أن Upstash مُفرَّغ في ذلك الخادم كي لا
 * يهمّ حدّ 5 طلبات/10 دقائق الاختباراتَ المتكرّرة.
 *
 * البيانات في `%TEMP%\opencode\qa-live-suite\data` — لا تمسّ `store/`.
 */
const PORT = Number(process.env.QA_PORT ?? 3110);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /qa-live\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    actionTimeout: 20_000,
    /**
     * ⚠️ مهلة أوسع لطلبات `request.*` لا لتفاعل الصفحة.
     *
     * خادم التطوير يترجم المسار عند أول طلب بعد أي تعديل في المصدر، وهذا
     * الترجمة على-demand تتجاوز 20 ثانية تحت حِمل. الفشل كان يظهر كـ
     * `Timeout 20000ms exceeded` على `/api/admin/login` لا كخلل في المنتج،
     * فالاختبار كان يقيس كلفة الترجمة لا السلوك.
     */
    navigationTimeout: 60_000,
  },
  webServer: {
    command: `powershell -ExecutionPolicy Bypass -File scripts/qa-test-server.ps1 -Port ${PORT}`,
    url: `${BASE}/en/live`,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "qa-desktop",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
});
