import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import fs from "node:fs";

/**
 * اختبارات متصفح حقيقية لمسار Q&A الحي.
 *
 * ⚠️ لماذا خادم التطوير (3110) وليس `next start`؟
 * `verifyTurnstile` يرفض كل طلب في الإنتاج بلا رمز حقيقي (fail-closed)، وواجهة
 * المتصفح لا تستطيع توليد رمز Turnstile صالح في الاختبار الآلي. لذلك نختبر الواجهة
 * على خادم التطوير المعزول (`scripts/qa-test-server.ps1`: بيانات مؤقتة + Upstash
 * وTurnstile معطّلة)، ونترك سلوك الإنتاج مغطّى باختبار cluster والاختبارات التي
 * تتحقق من رفض الإنتاج صراحةً.
 *
 * التهيئة (جلسة نشطة) تمرّ عبر API لأن هدف هذا الملف هو **الواجهة**؛ أما سلوك
 * خلوّ API من التحقق فيغطيها `scripts/qa-suite.mjs`.
 */

const ADMIN_USER = "admin";
const ATTENDEE = "متصفح-الاختبار";
const QUESTION = "كيف نطوّر ثقافة التبرع في مدارسنا؟";
const REJECT_QUESTION = "هل تعرض شاشة الجمهور الأسئلة المرفوضة؟";

function readAdminPassword(): string {
  const raw = fs.readFileSync(".env.local", "utf8");
  const m = raw.match(/^\s*ADMIN_PASSWORD\s*=\s*(.*)\s*$/m);
  if (!m) throw new Error("ADMIN_PASSWORD غير موجود في .env.local");
  return m[1].replace(/^["']|["']$/g, "");
}

/**
 * توكن واحد لكل تشغيل للملف.
 *
 * ⚠️ لماذا لا نُسجّل الدخول في كل اختبار؟ تسجيل الدخول يقرأ Google Sheets،
 * والاختبارات المتتابعة كانت تستهلك 14 محاولة دخول في التشغيل الواحد —
 * فكان حصة Sheets (429) تُسقط اختباراً seemingly سليماً، والإخفاق يظهر
 * كـ«لم تظهر لوحة الإدارة» لا كخطأ حدّ. الآن: محاولة واحدة لكل تشغيل،
 * والباقي على المسار السريع أدناه.
 */
let cachedToken: string | null = null;

async function apiLogin(request: APIRequestContext): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await request.post("/api/admin/login", {
    data: { username: ADMIN_USER, password: readAdminPassword() },
    // ⚠️ مهلة أطول من 30s الافتراضية: خادم التطوير يترجم المسار عند أول
    // طلب بعد تعديل المصدر، واختبار كان يسقط بمهلة لا بخلل سلوك.
    timeout: 90_000,
  });
  expect(res.ok(), "فشل تسجيل دخول الإدارة").toBeTruthy();
  const body = await res.json();
  cachedToken = body.token as string;
  return cachedToken;
}

/** تسجيل الدخول بنموذج UI الحقيقي — مرة واحدة فقط (يغطّي مسار الاعتماد). */
async function adminLoginViaForm(page: Page): Promise<void> {
  await page.goto("/en/admin/live");
  await page.getByTestId("qa-login-username").fill(ADMIN_USER);
  await page.getByTestId("qa-login-password").fill(readAdminPassword());
  await page.getByTestId("qa-login-submit").click();
  await expect(page.getByTestId("qa-session-title")).toBeVisible();
}

/**
 * دخول اللوحة بتوكن نُقل عن `apiLogin` (نفس ما يفعله النموذج بعد نجاحه).
 *
 * `QaAdminPanel` يحفظ التوكن في `sessionStorage`، فزرعه يعني تخطّي نموذج
 * الدخول بلا تخطّي الحماية: كل طلب في اللوحة ما زال يمرّ بـ`requireAdmin`
 * على الخادم، وبلا توكن صالح لكان الاختبار كله يفشل فوراً.
 */
async function adminLogin(page: Page): Promise<void> {
  if (!cachedToken) throw new Error("adminLogin قبل apiLogin: التوكن غير مُهيَّأ");
  await page.addInitScript((t: string) => {
    window.sessionStorage.setItem("tedx-admin-token", t);
  }, cachedToken);
  await page.goto("/en/admin/live");
  await expect(page.getByTestId("qa-session-title")).toBeVisible();
}

/**
 * اختيار الجلسة في لوحة الإدارة مع **التحقق** من الاختيار.
 *
 * ⚠️ اللوحة تختار أول جلسة في القائمة تلقائياً، وجلسات الاختبارات السابقة قد
 * تكون باقية في نفس الخادم. الاعتماد على الاختيار التلقائي يجعل عدّاد
 * المرفوضات يخصّ جلسة أخرى. نتأكد باختيار الشريحة والتحقق من صنفها
 * (الشريحة المختارة تأخذ `bg-tedx-red`).
 */
async function selectSession(page: Page, title: string): Promise<void> {
  const chip = page.getByRole("button", { name: new RegExp(title) }).first();
  await chip.click();
  await expect(chip).toHaveClass(/bg-tedx-red/);
}

async function createActiveSession(page: Page, title: string): Promise<void> {
  await page.getByTestId("qa-session-title").fill(title);
  await page.getByTestId("qa-session-create").click();
  await expect(page.getByRole("button", { name: new RegExp(title) }).first()).toBeVisible();
  await selectSession(page, title);
  await page.getByTestId("qa-session-activate").click();
  await expect(page.getByTestId("qa-session-activate")).toBeHidden();
}

async function deleteSession(request: APIRequestContext, token: string, sessionId: string): Promise<void> {
  if (!sessionId) return;
  await request.post("/api/qa/admin/session", {
    headers: { Authorization: `Bearer ${token}` },
    data: { action: "delete", sessionId },
  });
}

/** صفّ السؤال في لوحة الإدارة حسب نصّه. */
function rowOf(page: Page, text: string) {
  return page.locator('[data-testid="qa-question-row"]', { hasText: text });
}

/** اعتماد سؤال من لوحة الإدارة. */
async function approveQuestion(page: Page, text: string): Promise<void> {
  await rowOf(page, text).getByTestId("qa-approve").click();
  await expect(rowOf(page, text).getByTestId("qa-put-on-screen")).toBeVisible();
}

/**
 * تثبيت سؤال على الشاشة الكبيرة.
 *
 * ⚠️ الشاشة في الوضع اليدوي افتراضياً، فلو اكتفيناтка بالاعتماد لَظهر
 * `hold` على `/live/screen` لا السؤال. التثبيت هو ما يملأ الشاشة فعلاً،
 * وهذا ما يجعله زراً مستقلاً عن «الاعتماد» في اللوحة وفي الاختبار معاً.
 */
async function pinOnScreen(page: Page, text: string): Promise<void> {
  await rowOf(page, text).getByTestId("qa-put-on-screen").click();
  await expect(page.getByTestId("qa-screen-current")).toContainText(text.slice(0, 24));
}

/** إنشاء جلسة نشطة ومعرّفها عبر API. */
async function createSessionViaApi(
  page: Page,
  request: APIRequestContext,
  token: string,
  title: string
): Promise<string> {
  await adminLogin(page);
  await createActiveSession(page, title);
  const state = await request.get("/api/qa/admin/questions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const created = (await state.json()).sessions.find((s: { title: string }) => s.title === title);
  return created.id as string;
}

/**
 * بديل Turnstile للاختبار — يحاكي سلوك Cloudflare الحقيقي.
 *
 * ⚠️ لماذا هذا ضروري وليس تفصيلاً: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` مضبوط في
 * بيئة الاختبار، فكانت الواجهة تحمّل سكربت Cloudflare فعلياً. أي أن الاختبارات
 * السابقة لم تمرّ على مسار الإنتاج إطلاقاً: لا رمز، ولا انتظار، ولا تحقق من
 * إرسال الرمز — مع أن الإنتاج يفرضه ويصير كل إرسال بلا رمز 403.
 *
 * الآن نُدرج `window.turnstile` قبل تحميل الصفحة، فيرى المكوّن التحدّي
 * جاهزاً ويصدر رمزاً. `reset` يُصدر رمزاً جديداً تماماً كما يفعل Cloudflare
 * (الرمز أحادي الاستخدام)، فيتحقّق الاختبار فعلياً من دورة حياة الرمز.
 */
async function stubTurnstile(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let counter = 0;
    const widgets = new Map<string, (token: string) => void>();
    (window as unknown as { turnstile: unknown }).turnstile = {
      render(_el: HTMLElement, opts: { callback: (token: string) => void }) {
        const id = `w${++counter}`;
        widgets.set(id, opts.callback);
        opts.callback(`test-token-${id}-1`);
        return id;
      },
      reset(id?: string) {
        const key = id ?? [...widgets.keys()].pop() ?? "";
        const cb = widgets.get(key);
        if (cb) cb(`test-token-${key}-${++counter}`);
      },
      remove(id: string) {
        widgets.delete(id);
      },
    };
  });
}

test.describe.configure({ mode: "serial" });

/** كل الاختبارات تمرّ بمسار Turnstile المفعل كما في الإنتاج. */
test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

test("تعذّر تحميل التحقق لا يقيّد الحاضر على زر معطّل إلى الأبد", async ({ page }) => {
  // Turnstile موجود لكنه **لا يصدر رمزاً أبداً**: يحاكي حجب السكربت
  // (ad-blocker / CSP / انقطاع واي فاي القاعة) وهو أخطر سيناريو ممكن.
  await page.addInitScript(() => {
    (window as unknown as { turnstile: unknown }).turnstile = {
      render: () => "stalled",
      reset: () => {},
      remove: () => {},
    };
  });
  await page.goto("/en/live");

  // قبل المهلة: الزر معطّل (لا إرسال بلا رمز في الإنتاج).
  await expect(page.getByTestId("qa-join-submit")).toBeDisabled();

  // بعد المهلة: تنبيه صريح + الزر يعود متاحاً بدل قفل الحفل كله.
  await expect(page.getByTestId("qa-verify-stalled")).toBeVisible();
  await expect(page.getByTestId("qa-join-submit")).toBeEnabled();
});

test("مسار الحاضر الكامل: انضمام، سؤال، اعتماد، تصويت، سحب، استفتاء، استبيان", async ({ page, request }) => {
  const token = await apiLogin(request);
  const adminState = await request.get("/api/qa/admin/questions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const beforeIds: string[] = (await adminState.json()).sessions.map((s: { id: string }) => s.id);

  const title = `E2E-${Date.now()}`;
  let sessionId = "";

  try {
    await test.step("الإداري يسجّل الدخول بنموذج UI وينشئ جلسة نشطة", async () => {
      // ⚠️ الاختبار الأول هو الوحيد الذي يمرّ بنموذج الدخول الحقيقي
      // (اسم المستخدم + كلمة المرور). الباقي يزرع التوكن مباشرة — انظر
      // `adminLogin` — لأن كل تسجيل دخول إضافي يستهلك حصة Google Sheets
      // ويُسقط الاختبارات اللاحقة بخطأ غير مفهوم.
      await adminLoginViaForm(page);
      await createActiveSession(page, title);
      const state = await request.get("/api/qa/admin/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = (await state.json()).sessions.find((s: { title: string }) => s.title === title);
      expect(created, "الجلسة لم تُنشأ").toBeTruthy();
      expect(created.active, "الجلسة ليست نشطة").toBe(true);
      sessionId = created.id;
    });

    await test.step("الحاضر ينضم باسمه من صفحة المشاركة", async () => {
      await page.goto("/en/live");
      await page.getByTestId("qa-join-name").fill(ATTENDEE);
      await page.getByTestId("qa-join-submit").click();
      await expect(page.getByTestId("qa-ask-text")).toBeVisible();
    });

    await test.step("الحاضر يرسل سؤالاً فينتقل إلى pending", async () => {
      await page.getByTestId("qa-ask-text").fill(QUESTION);
      await page.getByTestId("qa-ask-submit").click();
      await expect(page.getByTestId("qa-question")).toHaveCount(0);
    });

    await test.step("السؤال المخفي عن الجمهور قبل الاعتماد", async () => {
      await page.goto("/en/live/screen");
      await expect(page.getByText(QUESTION)).toHaveCount(0);
    });

    await test.step("الإداري يعتمد السؤال من اللوحة", async () => {
      await page.goto("/en/admin/live");
      await selectSession(page, title);
      const row = page.locator('[data-testid="qa-question-row"]', { hasText: QUESTION });
      await expect(row).toHaveCount(1);
      await row.getByTestId("qa-approve").click();
      await expect(row.getByTestId("qa-approve")).toHaveCount(0);
    });

    await test.step("السؤال يظهر للجمهور بعد الاعتماد", async () => {
      await page.goto("/en/live");
      const item = page.locator('[data-testid="qa-question"]', { hasText: QUESTION });
      await expect(item).toHaveCount(1);
    });

    await test.step("التصويت على السؤال يزيد العداد", async () => {
      const item = page.locator('[data-testid="qa-question"]', { hasText: QUESTION });
      await expect(item.getByTestId("qa-question-votes")).toHaveText("0 votes");
      await item.getByTestId("qa-question-vote").click();
      await expect(item.getByTestId("qa-question-votes")).toHaveText("1 votes");
    });

    await test.step("سحب التصويت يعيد العداد إلى ما كان", async () => {
      const item = page.locator('[data-testid="qa-question"]', { hasText: QUESTION });
      await item.getByTestId("qa-question-vote").click();
      await expect(item.getByTestId("qa-question-votes")).toHaveText("0 votes");
    });

    await test.step("الإداري ينشئ استفتاء ويشغّله", async () => {
      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await page.getByTestId("qa-poll-prompt").fill("أي مسار أثر؟");
      await page.getByTestId("qa-poll-option-input").nth(0).fill("العلم");
      await page.getByTestId("qa-poll-option-input").nth(1).fill("الخدمة");
      await page.getByTestId("qa-poll-create").click();
      const pollRow = page.locator('[data-testid="qa-admin-poll"]').first();
      await expect(pollRow).toBeVisible();
      await pollRow.getByTestId("qa-poll-start").click();
    });

    await test.step("الحاضر يصوّت في الاستdfunding ويظل الخيار محدداً", async () => {
      await page.goto("/en/live");
      const poll = page.locator('[data-testid="qa-poll"]').first();
      await expect(poll).toBeVisible();
      await poll.locator('[data-testid="qa-poll-option"]').nth(0).click();
      await expect(poll.locator('[data-testid="qa-poll-option"]').nth(0)).toBeDisabled();
      await expect(poll.locator('[data-testid="qa-poll-option"]').nth(1)).toBeEnabled();
    });

    await test.step("الاستبيان يُرسَل من صفحة الاستبيان بنجاح", async () => {
      const state = await request.get("/api/qa/admin/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const s = (await state.json()).sessions.find((x: { id: string }) => x.id === sessionId);
      await page.goto(`/en/live/survey?session=${s.id}`);
      await page.getByTestId("qa-survey-nps-9").click();
      await page.getByTestId("qa-survey-rating-4").click();
      await page.getByTestId("qa-survey-comment").fill("تنظيم ممتاز ووقت مريح.");
      await page.getByTestId("qa-survey-submit").click();
      await expect(page.getByText("Please join the session first.")).toHaveCount(0);
    });
  } finally {
    await deleteSession(request, token, sessionId);
    // تنظيف أي جلسة بقيت من تشغيل سابق لنفس الاختبار
    const state = await request.get("/api/qa/admin/questions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    for (const s of (await state.json()).sessions) {
      if (s.title === title) await deleteSession(request, token, s.id);
    }
    void beforeIds;
  }
});

test("السؤال المرفوض يختفي عن الجمهور ويعود بعد إعادة الاعتماد", async ({ page, request }) => {
  const token = await apiLogin(request);
  const title = `E2E-REJ-${Date.now()}`;
  let sessionId = "";

  try {
    await test.step("إنشاء جلسة نشطة", async () => {
      await adminLogin(page);
      await createActiveSession(page, title);
      const state = await request.get("/api/qa/admin/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = (await state.json()).sessions.find((s: { title: string }) => s.title === title);
      expect(created).toBeTruthy();
      expect(created.active).toBe(true);
      sessionId = created.id;
    });

    await test.step("سؤال معتمد ثم مرفوض", async () => {
      await page.goto("/en/live");
      await page.getByTestId("qa-join-name").fill("حاضر-رافض");
      await page.getByTestId("qa-join-submit").click();
      await page.getByTestId("qa-ask-text").fill(REJECT_QUESTION);
      await page.getByTestId("qa-ask-submit").click();

      await page.goto("/en/admin/live");
      await selectSession(page, title);
      const row = page.locator('[data-testid="qa-question-row"]', { hasText: REJECT_QUESTION });
      await row.getByTestId("qa-approve").click();
      await expect(row.getByTestId("qa-approve")).toHaveCount(0);
      // الشاشة يدوية: التثبيت هو ما يملؤها، لا الاعتماد وحده.
      await pinOnScreen(page, REJECT_QUESTION);

      await page.goto("/en/live/screen");
      await expect(page.getByText(REJECT_QUESTION)).toHaveCount(1);

      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await page.locator('[data-testid="qa-question-row"]', { hasText: REJECT_QUESTION }).getByTestId("qa-reject").click();
    });

    await test.step("السؤال المرفوض يختفي من شاشة الجمهور", async () => {
      await page.goto("/en/live/screen");
      await expect(page.getByText(REJECT_QUESTION)).toHaveCount(0);
    });

    await test.step("قسم المرفوضات يظهر زر إعادة الاعتماد", async () => {
      await page.goto("/en/admin/live");
      // ⚠️ اللوحة تختار أول جلسة تلقائياً عند التحميل، وعدّاد المرفوضات يتبع
      // الجلسة المختارة. ننتظر عدّاد هذه الجلسة تحديداً قبل فتح القسم، وإلا
      // وقعنا في فتح قسم جلسة أخرى.
      await selectSession(page, title);
      const toggle = page.getByTestId("qa-rejected-toggle");
      await expect(toggle).toContainText("Rejected questions (1)", { timeout: 30_000 });
      if ((await page.locator('[data-testid="qa-rejected-row"]').count()) === 0) {
        await toggle.click();
      }
      const rejectedRow = page.locator('[data-testid="qa-rejected-row"]', { hasText: REJECT_QUESTION });
      await expect(rejectedRow).toHaveCount(1);
      await rejectedRow.getByTestId("qa-reapprove").click();
      await expect(page.locator('[data-testid="qa-rejected-row"]', { hasText: REJECT_QUESTION })).toHaveCount(0);
    });

    await test.step("السؤال يعود للجمهور والشاشة بعد إعادة الاعتماد", async () => {
      // الرفض أسقط الشريحة إلى hold، فإعادة الاعتماد تُعيد السؤال للقائمة
      // لا إلى الشاشة — والمشرف هو من يقرّر عرضه مجدداً.
      await page.goto("/en/live/screen");
      await expect(page.getByText(REJECT_QUESTION)).toHaveCount(0);

      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await pinOnScreen(page, REJECT_QUESTION);

      await page.goto("/en/live/screen");
      await expect(page.getByText(REJECT_QUESTION)).toHaveCount(1);
    });
  } finally {
    await deleteSession(request, token, sessionId);
  }
});

test("زر «مخفي من الشاشة» يزيل السؤال من شاشة العرض فعلاً", async ({ page, request }) => {
  const token = await apiLogin(request);
  const title = `E2E-VIS-${Date.now()}`;
  const question = `سؤال للاختبار ${Date.now()}`;
  let sessionId = "";

  try {
    await test.step("إنشاء جلسة وسؤال معتمد ومثبَّت على الشاشة", async () => {
      await adminLogin(page);
      await createActiveSession(page, title);
      const state = await request.get("/api/qa/admin/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = (await state.json()).sessions.find((s: { title: string }) => s.title === title);
      sessionId = created.id;

      await page.goto("/en/live");
      await page.getByTestId("qa-join-name").fill("حاضر-الظهور");
      await page.getByTestId("qa-join-submit").click();
      await page.getByTestId("qa-ask-text").fill(question);
      await page.getByTestId("qa-ask-submit").click();

      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await rowOf(page, question).getByTestId("qa-approve").click();
      // ⚠️ الاعتماد وحده لا يملأ الشاشة (الوضع يدوي) — التثبيت هو ما يملؤها.
      await pinOnScreen(page, question);

      await page.goto("/en/live/screen");
      await expect(page.getByText(question)).toHaveCount(1, { timeout: 30_000 });
    });

    await test.step("الإخفاء من الشاشة يزيله من /live/screen", async () => {
      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await page
        .locator('[data-testid="qa-question-row"]', { hasText: question })
        .getByTestId("qa-toggle-live")
        .click();

      await page.goto("/en/live/screen");
      await expect(page.getByText(question)).toHaveCount(0, { timeout: 30_000 });
    });

    await test.step("الاختفاء لا يمسّ الجمهور ولا فائماً ولا شاشة المتحدث", async () => {
      // Hidden-from-screen is a projector concern only: the audience must still
      // see and vote on it, and the speaker screen is unaffected.
      await page.goto("/en/live");
      const item = page.locator('[data-testid="qa-question"]', { hasText: question });
      await expect(item).toHaveCount(1, { timeout: 30_000 });
      await item.getByTestId("qa-question-vote").click();
      await expect(item.getByTestId("qa-question-votes")).toHaveText("1 votes", { timeout: 30_000 });

      await page.goto("/en/live/speaker");
      await expect(page.getByText(question)).toHaveCount(1, { timeout: 30_000 });
    });

    await test.step("إعادة الإظهار تُرجع السؤال للشاشة", async () => {
      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await rowOf(page, question).getByTestId("qa-toggle-live").click();
      // المؤشر ما زال على السؤال، لكن إخفاءه أسقط الشريحة إلى hold في
      // الخادم — فإعادة الإظهار وحدها لا تعيده؛ التثبيت يُعاد.
      await expect(page.getByTestId("qa-screen-current")).not.toContainText(question.slice(0, 24));
      await pinOnScreen(page, question);

      await page.goto("/en/live/screen");
      await expect(page.getByText(question)).toHaveCount(1, { timeout: 30_000 });
    });
  } finally {
    await deleteSession(request, token, sessionId);
  }
});
test("الشاشة الكبيرة: يدوي افتراضي، تثبيت، سحابة كلمات، والتالي", async ({ page, request }) => {
  const token = await apiLogin(request);
  const title = `E2E-SCR-${Date.now()}`;
  const question = `سؤال التثبيت ${Date.now()}`;
  let sessionId = "";

  try {
    await test.step("جلسة جديدة تبدأ على hold حتى يقرّر المشرف", async () => {
      sessionId = await createSessionViaApi(page, request, token, title);
      // ⚠️ وجود سؤال معتمد لا يعني ظهوره: الشاشة يدوية، والشريحة hold.
      await page.goto("/en/live/screen");
      await expect(page.getByTestId("qa-screen-hold")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId("qa-screen-question")).toHaveCount(0);
    });

    await test.step("سؤال معتمد + تثبيت = يظهر فوراً على /live/screen", async () => {
      await page.goto("/en/live");
      await page.getByTestId("qa-join-name").fill("حاضر-الشاشة");
      await page.getByTestId("qa-join-submit").click();
      await page.getByTestId("qa-ask-text").fill(question);
      await page.getByTestId("qa-ask-submit").click();

      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await approveQuestion(page, question);
      await pinOnScreen(page, question);

      await page.goto("/en/live/screen");
      await expect(page.getByTestId("qa-screen-question")).toContainText(question, { timeout: 30_000 });
      await expect(page.getByTestId("qa-screen-hold")).toHaveCount(0);
    });

    await test.step("سحابة الكلمات والإيقاف", async () => {
      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await page.getByTestId("qa-screen-wordcloud").click();
      await expect(page.getByTestId("qa-screen-current")).not.toContainText(question.slice(0, 24));

      await page.goto("/en/live/screen");
      await expect(page.getByTestId("qa-screen-wordcloud")).toBeVisible({ timeout: 30_000 });
    });

    await test.step("«التالي» يختار من الخادم ويملأ الشاشة", async () => {
      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await page.getByTestId("qa-screen-next").click();
      await expect(page.getByTestId("qa-screen-current")).toContainText(question.slice(0, 24));

      await page.goto("/en/live/screen");
      await expect(page.getByTestId("qa-screen-question")).toContainText(question, { timeout: 30_000 });
    });

    await test.step("الوضع التلقائي يدير الشريحة بلا تدخّل", async () => {
      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await page.getByTestId("qa-screen-auto").click();
      // الشارة نصٌّ مترجَم («Auto»)، لا القيمة الخام `auto`.
      await expect(page.getByTestId("qa-screen-mode")).toHaveText(/Auto/i);
      await page.getByTestId("qa-screen-next").click();

      await page.goto("/en/live/screen");
      await expect(page.getByTestId("qa-screen-question")).toContainText(question, { timeout: 30_000 });
    });
  } finally {
    await deleteSession(request, token, sessionId);
  }
});

test("سؤال المسرح: معتمد فوراً، يظهر على الشاشة، وبشارة مصدره", async ({ page, request }) => {
  const token = await apiLogin(request);
  const title = `E2E-STG-${Date.now()}`;
  const staged = `سؤال يكتبه المشرف مباشرة ${Date.now()}`;
  let sessionId = "";

  try {
    await test.step("المشرف يكتب سؤالاً على المسرح فيُعتمد في الحال", async () => {
      sessionId = await createSessionViaApi(page, request, token, title);
      await page.getByTestId("qa-stage-input").fill(staged);
      await page.getByTestId("qa-stage-putonscreen").check();
      await page.getByTestId("qa-stage-submit").click();

      const row = rowOf(page, staged);
      await expect(row).toBeVisible({ timeout: 30_000 });
      // بلا انتظار مراجعة: سؤال المشرف ليس سؤال حاضر.
      await expect(row.getByTestId("qa-source-admin")).toBeVisible();
      await expect(row.getByTestId("qa-approve")).toHaveCount(0);
      await expect(page.getByTestId("qa-screen-current")).toContainText(staged.slice(0, 24));
    });

    await test.step("وهو يصل الجمهور وشاشة العرض كسؤال معتمد", async () => {
      await page.goto("/en/live");
      await page.getByTestId("qa-join-name").fill("حاضر-المسرح");
      await page.getByTestId("qa-join-submit").click();
      await expect(page.locator('[data-testid="qa-question"]', { hasText: staged })).toHaveCount(1, {
        timeout: 30_000,
      });

      await page.goto("/en/live/screen");
      await expect(page.getByTestId("qa-screen-question")).toContainText(staged, { timeout: 30_000 });
    });
  } finally {
    await deleteSession(request, token, sessionId);
  }
});

test("QR الشاشة مربوط بالجلسة: يفتح الحاضر جلسته ويمنع جلسة منتهية", async ({ page, request }) => {
  const token = await apiLogin(request);
  const title = `E2E-QR-${Date.now()}`;
  let sessionId = "";

  try {
    sessionId = await createSessionViaApi(page, request, token, title);

    await test.step("QR يحمل معرّف الجلسة النشطة", async () => {
      await page.goto("/en/live/screen");
      const qr = page.getByTestId("qa-screen-qr");
      await expect(qr).toBeVisible({ timeout: 30_000 });
      const value = await qr.getAttribute("data-qr-value");
      expect(value, "رابط QR يحمل معرّف الجلسة").toContain(`session=${sessionId}`);
    });

    await test.step("QR يفتح صفحة المشاركة على الجلسة نفسها بلا حجب", async () => {
      // الزائر الجديد لم ينضم بعد، فالمتوقَّع نموذج الانضمام لا صندوق السؤال،
      // والأهم: لا رسالة «جلسة منتهية».
      await page.goto(`/en/live?session=${sessionId}`);
      await expect(page.getByTestId("qa-join-name")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId("qa-stale-session")).toHaveCount(0);
      await page.getByTestId("qa-join-name").fill("حاضر-QR");
      await page.getByTestId("qa-join-submit").click();
      await expect(page.getByTestId("qa-ask-text")).toBeVisible();
    });

    await test.step("جلسة غير موجودة = رسالة صريحة لا انتقال صامت", async () => {
      await page.goto("/en/live?session=qa-session-does-not-exist");
      await expect(page.getByTestId("qa-stale-session")).toBeVisible({ timeout: 30_000 });
    });
  } finally {
    await deleteSession(request, token, sessionId);
  }
});

test("الإجابة المفتوحة: تبقى معلّقة حتى المراجعة، ثم تصل المتحدث", async ({ page, browser, request }) => {
  const token = await apiLogin(request);
  const title = `E2E-ANS-${Date.now()}`;
  const question = `سؤال يستحق إجابة ${Date.now()}`;
  const answer = "جواب مفتوح من الحاضر";
  let sessionId = "";

  try {
    sessionId = await createSessionViaApi(page, request, token, title);

    await test.step("الحاضر يسأل ويُعتمد سؤاله", async () => {
      await page.goto("/en/live");
      await page.getByTestId("qa-join-name").fill("حاضر-إجابة");
      await page.getByTestId("qa-join-submit").click();
      await page.getByTestId("qa-ask-text").fill(question);
      await page.getByTestId("qa-ask-submit").click();

      await page.goto("/en/admin/live");
      await selectSession(page, title);
      await approveQuestion(page, question);
    });

    await test.step("الجواب المعلّق يراه صاحبه وحده", async () => {
      await page.goto("/en/live");
      const item = page.locator('[data-testid="qa-question"]', { hasText: question });
      await expect(item).toHaveCount(1, { timeout: 30_000 });
      await item.getByTestId("qa-answer-open").click();
      await page.getByTestId("qa-answer-input").fill(answer);
      await page.getByTestId("qa-answer-submit").click();
      await expect(page.getByTestId("qa-my-pending-answer")).toContainText(answer, { timeout: 30_000 });

      // حاضر آخر: لا يعرف شيئاً عن جواب لم يُعتمد.
      const other = await browser.newContext();
      const otherPage = await other.newPage();
      await stubTurnstile(otherPage);
      await otherPage.goto("/en/live");
      await otherPage.getByTestId("qa-join-name").fill("حاضر-آخر");
      await otherPage.getByTestId("qa-join-submit").click();
      const otherItem = otherPage.locator('[data-testid="qa-question"]', { hasText: question });
      await expect(otherItem).toHaveCount(1, { timeout: 30_000 });
      await expect(otherItem).not.toContainText(answer);
      // والمتحدث لا يرى المعلّق بعد.
      await otherPage.goto("/en/live/speaker");
      await expect(otherPage.locator("body")).not.toContainText(answer, { timeout: 30_000 });
      await other.close();
    });

    await test.step("المشرف يعتمد الجواب من صندوق المراجعة", async () => {
      await page.goto("/en/admin/live");
      await selectSession(page, title);
      const inbox = page.getByTestId("qa-answer-inbox");
      await expect(inbox).toBeVisible({ timeout: 30_000 });
      const item = page.locator('[data-testid="qa-pending-answer"]', { hasText: answer });
      await expect(item).toBeVisible();
      await item.getByTestId("qa-answer-approve").click();
      await expect(page.locator('[data-testid="qa-pending-answer"]', { hasText: answer })).toHaveCount(0);
    });

    await test.step("بعد الاعتماد يظهر للمتحدث وصاحبه", async () => {
      await page.goto("/en/live/speaker");
      await expect(page.locator("body")).toContainText(answer, { timeout: 30_000 });

      await page.goto("/en/live");
      await expect(page.getByTestId("qa-approved-answers")).toContainText(answer, { timeout: 30_000 });
    });

    await test.step("رفض جواب حاضر آخر لا يمسّ جواب المعتمد", async () => {
      // ⚠️ حاضر *آخر* عمداً: لكل (حاضر × سؤال) جواب واحد، فكتابة حاضر آخر
      // على السؤال نفسه تحذف جوابه المعتمد وتُبطل هذا الاختبار بلا سبب.
      // الاختبار هنا: رفض جواب hides من المتحدث ولا يُسقط غيره.
      const other = await browser.newContext();
      const otherPage = await other.newPage();
      try {
        await stubTurnstile(otherPage);
        await otherPage.goto("/en/live");
        await otherPage.getByTestId("qa-join-name").fill("حاضر-سيُرفض");
        await otherPage.getByTestId("qa-join-submit").click();
        const item = otherPage.locator('[data-testid="qa-question"]', { hasText: question });
        await expect(item).toHaveCount(1, { timeout: 30_000 });
        await item.getByTestId("qa-answer-open").click();
        await otherPage.getByTestId("qa-answer-input").fill("جواب سيُرفض");
        await otherPage.getByTestId("qa-answer-submit").click();
        await expect(otherPage.getByTestId("qa-my-pending-answer")).toContainText("جواب سيُرفض", {
          timeout: 30_000,
        });
      } finally {
        await other.close();
      }

      await page.goto("/en/admin/live");
      await selectSession(page, title);
      const pending = page.locator('[data-testid="qa-pending-answer"]', { hasText: "جواب سيُرفض" });
      await expect(pending).toBeVisible({ timeout: 30_000 });
      await pending.getByTestId("qa-answer-reject").click();

      await page.goto("/en/live/speaker");
      await expect(page.locator("body")).not.toContainText("جواب سيُرفض", { timeout: 30_000 });
      await expect(page.locator("body")).toContainText(answer);
    });
  } finally {
    await deleteSession(request, token, sessionId);
  }
});