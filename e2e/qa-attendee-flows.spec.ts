import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import creds from "../scripts/qa-test-credentials.json";

/**
 * الطبقة 7: تدفّق الحضور + **حالات التدهور** بفَصل شبكة حقيقي.
 *
 * 🎯 لماذا فصل الشبكة لا محاكاة خادم: القيمة هنا ليست في كيفية فشل
 * الخادم بل في **ماذا يرى الحاضر والمتحدث** عند فشل اللقطة. الأشكال
 * (رمز ٥٠٠، قطع اتصال، مهلة) كلها تمرّ بالالتقاط نفس في
 * `SpeakerView.load`/`LiveParticipate`.
 *
 * والقاعدة التي تُختبر تحديداً (وهي الوعد المكتوب في الشيفرة):
 *   **انقطاع مؤقت = تحذير فقط. لا تُمسح أسئلة المتحدث، ولا تُفقد
 *   هوية الحاضر وصوته.** أسوأ خطأ هنا شاشة تمسح المسرح بسبب شبكة.
 */

const ADMIN_PW = creds.adminPassword;

const PATHS = {
  admin: "/en/admin/live",
  attendee: "/en/live",
  speaker: "/en/live/speaker",
} as const;

/** لقطة الجلسة على أي جهاز — المسار الذي تُقطَع منه الشبكة. */
const SNAPSHOT_GLOB = "**/api/qa/session/current**";
const ANALYTICS_GLOB = "**/api/qa/admin/analytics**";
const SURVEY_GLOB = "**/api/qa/survey**";

async function stubTurnstile(page: Page): Promise<void> {
  await page.addInitScript((reserved: string) => {
    let n = 0;
    const widgets = new Map<string, (token: string) => void>();
    (window as unknown as { turnstile: unknown }).turnstile = {
      render(_el: HTMLElement, opts: { callback: (token: string) => void }) {
        const id = `qa${++n}`;
        widgets.set(id, opts.callback);
        opts.callback(reserved);
        return id;
      },
      reset(id?: string) {
        widgets.get(id ?? [...widgets.keys()].pop() ?? "")?.(reserved);
      },
      remove(id: string) {
        widgets.delete(id);
      },
    };
  }, creds.turnstileToken);
}

/**
 * `hook` يُنفَّذ **قبل** `goto` — لازم: طلب التحليلات ينطلق مع أول
 * تصيير، فتسجيل `route` بعد فتح اللوحة ينأخر عن الطلب فيمرّ بلا اعتراض.
 */
async function openAdmin(
  browser: Browser,
  hook?: (page: Page) => Promise<void>
): Promise<{ ctx: BrowserContext; page: Page; token: string }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const res = await page.request.post("/api/admin/login", {
    data: { username: "admin", password: ADMIN_PW },
    timeout: 90_000,
  });
  expect(res.ok(), `دخول الإدارة فشل بـ${res.status()}`).toBeTruthy();
  const token = (await res.json()).token as string;
  await stubTurnstile(page);
  await page.addInitScript((t: string) => window.sessionStorage.setItem("tedx-admin-token", t), token);
  if (hook) await hook(page);
  await page.goto(PATHS.admin);
  await expect(page.getByTestId("qa-session-title")).toBeVisible();
  return { ctx, page, token };
}

async function openPlain(browser: Browser, path: string): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubTurnstile(page);
  await page.goto(path);
  return { ctx, page };
}

/** 🚦 يحبس أول طلب ردود حتى يُفلَث — أوضح من مهلة تخمينية. */
async function holdFirstSurveyRequest(admin: Page): Promise<() => void> {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((res) => {
    release = res;
  });
  let held = false;
  await admin.route(SURVEY_GLOB, async (route) => {
    if (held) return route.fallback();
    held = true;
    await gate;
    await route.continue().catch(() => undefined);
  });
  return release;
}

/** 🐌 يؤخّر الطلب أول مرة فقط — يكفي لاصطياد الحالة العابرة. */
async function delayFirstRequest(page: Page, glob: string, ms: number): Promise<void> {
  let seen = false;
  await page.route(glob, async (route) => {
    if (seen) return route.fallback();
    seen = true;
    await new Promise((r) => setTimeout(r, ms));
    // ⛔ `continue()` قابل للرمي: إن غادر الحاضر الصفحة (reload/join) أثناء
    // التأخير، ألغى Playwright المسار أصلاً — وبلا هذا الحارس كان الاختبار
    // يفشل بخطأ البنية «Route is already handled» بدل أن يمضي.
    await route.continue().catch(() => undefined);
  });
}

async function createAndActivateSession(admin: Page, title: string): Promise<void> {
  await admin.getByTestId("qa-session-title").fill(title);
  await admin.getByTestId("qa-session-create").click();
  const chip = admin.getByRole("button", { name: new RegExp(title) }).first();
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(chip).toHaveClass(/bg-tedx-red/);
  await admin.getByTestId("qa-session-activate").click();
  await expect(admin.getByTestId("qa-session-activate")).toBeHidden();
  const accepting = admin.getByTestId("qa-session-accepting");
  if ((await accepting.getAttribute("aria-pressed")) !== "true") await accepting.click();
  await expect(accepting).toHaveAttribute("aria-pressed", "true");
}

function adminRow(admin: Page, text: string) {
  return admin.locator('[data-testid="qa-question-row"]', { hasText: text });
}

async function joinAttendee(attendee: Page, name: string): Promise<void> {
  await attendee.getByTestId("qa-join-name").fill(name);
  await attendee.getByTestId("qa-join-submit").click();
  await expect(attendee.getByTestId("qa-ask-text")).toBeVisible();
}

async function askAndApprove(attendee: Page, admin: Page, question: string): Promise<void> {
  await attendee.getByTestId("qa-ask-text").fill(question);
  await attendee.getByTestId("qa-ask-submit").click();
  await expect(attendee.locator('[data-testid="qa-ask-msg"][data-msg-kind="sent"]')).toBeVisible();
  await adminRow(admin, question).getByTestId("qa-approve").first().click();
}

const QA = "كيف أبدأ تعلّم البرمجة؟";

test.describe.configure({ mode: "serial" });

test("⛔ D1: انقطاع الشبكة يُظهر تنبيهاً ولا يمسح أسئلة المتحدث", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "stale-speaker");

  const attendee = await openPlain(browser, PATHS.attendee);
  const speaker = await openPlain(browser, PATHS.speaker);
  try {
    await joinAttendee(attendee.page, "حاضر-انقطاع");
    await askAndApprove(attendee.page, admin, QA);

    // ⛔ السؤال على شاشة المتحدث **قبل** القطع (نقطة مقارنة لا تُعدّ تغطيةً).
    const questionCard = speaker.page.getByTestId("qa-speaker-question").first();
    await expect(questionCard).toContainText(QA, { timeout: 20_000 });
    await expect(speaker.page.getByTestId("qa-speaker-stale")).toHaveCount(0);

    // قطع حقيقي: كل لقطات الجلسة تفشل (`route.abort`) ⇒ `fetch` يرمي.
    await speaker.page.route(SNAPSHOT_GLOB, (route) => route.abort("connectionfailed"));

    // ⛔ التحذير يظهر…
    await expect(speaker.page.getByTestId("qa-speaker-stale")).toBeVisible({ timeout: 30_000 });
    // …واللقطة الأخيرة **باقية**. القتل هنا يعني محو أسئلة المتحدث
    //    من على المسرح لحظةً لكل انقطاع شبكة في القاعة.
    await expect(questionCard).toContainText(QA);
    await expect(questionCard).toBeVisible();

    // وبعود الشبكة يختفي التحذير وحده (لا يبقى عالقاً بعد عودة الحياة).
    await speaker.page.unroute(SNAPSHOT_GLOB);
    await expect(speaker.page.getByTestId("qa-speaker-stale")).toHaveCount(0, { timeout: 30_000 });
    await expect(questionCard).toContainText(QA);
  } finally {
    await speaker.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ D2: انقطاع الشبكة عند الحاضر يحذّر ولا يفقد هويته ولا أسئلته", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "stale-attendee");

  const attendee = await openPlain(browser, PATHS.attendee);
  try {
    await joinAttendee(attendee.page, "حاضر-هوية");
    await attendee.page.getByTestId("qa-ask-text").fill(QA);
    await attendee.page.getByTestId("qa-ask-submit").click();
    await expect(attendee.page.locator('[data-testid="qa-ask-msg"][data-msg-kind="sent"]')).toBeVisible();
    // اعتماد السؤال: نحتاجه **ظاهراً في قائمة الحاضر** قبل القطع، وإلا
    // فالتأكيد التالي يمرّ على فراغ (لا سؤال أصلاً يُثبت شيئاً).
    await adminRow(admin, QA).getByTestId("qa-approve").first().click();
    await expect(attendee.page.getByTestId("qa-question").filter({ hasText: QA }).first()).toBeVisible({
      timeout: 20_000,
    });

    await attendee.page.route(SNAPSHOT_GLOB, (route) => route.abort("connectionfailed"));

    // ⛔ تنبيه الاتصال يظهر (وليس «لا توجد جلسة»).
    await expect(attendee.page.getByTestId("qa-connection-issue")).toBeVisible({ timeout: 30_000 });

    // ⛔ وبوابة الانضمام لا تعود: الهوية محفوظة. لو عادت، يفقد الحاضر
    //    هويته وصوته — وهو أسوأ من التحذير.
    await expect(attendee.page.getByTestId("qa-join-name")).toHaveCount(0);
    await expect(attendee.page.getByTestId("qa-ask-text")).toBeVisible();
    // وسؤاله ما زال معروضاً له.
    await expect(attendee.page.getByTestId("qa-question").filter({ hasText: QA }).first()).toBeVisible();

    await attendee.page.unroute(SNAPSHOT_GLOB);
    await expect(attendee.page.getByTestId("qa-connection-issue")).toHaveCount(0, { timeout: 30_000 });
  } finally {
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ D3: التحليلات: تحميل معلَّق ثم أصفار صادقة — بلا وميض «لا بيانات»", async ({ browser }) => {
  // ⛔ الاعتراض قبل `goto`: طلب التحليلات ينطلق مع أول تصيير.
  const { ctx: adminCtx, page: admin } = await openAdmin(browser, async (page) => {
    await page.route(ANALYTICS_GLOB, async (route) => {
      await new Promise((r) => setTimeout(r, 8_000));
      await route.continue();
    });
  });
  await createAndActivateSession(admin, "analytics-empty");

  try {
    /**
     * حالات `qa-analytics-empty`: كانت تُقرأ كـ«لا بيانات» فقط، وهي في
     * الواقع **حالة التحميل** — فالـAPI يُعيد دائماً كائناً بأصفار،
     * وفرع `!data` بعد النداء لا يُعرض. ولذلك نُثبّت مرحلتين:
     *   ١. الحِمل معلَّق ⇒ «جارٍ التحميل» بلا أرقام،
     *   ٢. الحِمل يكمل ⇒ أصفار وبلا خطأ.
     *
     * والومضة التي أُصلحت (`loading` يبدأ `true`) هي ما يمنع
     * «لا بيانات» من الظهور إطاراً قبل «جارٍ التحميل».
     */
    await expect(admin.getByTestId("qa-analytics-empty")).toBeVisible({ timeout: 20_000 });
    await expect(admin.getByTestId("qa-analytics-empty")).toContainText("Loading");
    await expect(admin.getByTestId("qa-analytics-empty")).not.toContainText("No data");
    // ⛔ لا أرقام أثناء التحميل: صفرٌ مبكر يُقرأ تقريراً.
    await expect(admin.getByTestId("qa-stat-total-questions")).toHaveCount(0);

    await expect(admin.getByTestId("qa-stat-total-questions")).toContainText("0", { timeout: 30_000 });
    await expect(admin.getByTestId("qa-stat-attendees")).toContainText("0");
    await expect(admin.getByTestId("qa-analytics-error")).toHaveCount(0);
  } finally {
    await adminCtx.close();
  }
});

test("⛔ D4: فشل التحليلات يُظهر رسالة ويبقى «تحديث» يعمل", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "analytics-error");

  try {
    // ⛔ ننتظر **نجاح** التحميل أولاً: `qa-analytics` قشرة النجاح وحدها
    // (فروع التحميل/الخطأ تُخرجها)، فمن لم ينتظرها يسجّل فشلاً على
    // حالةٍ لم تبدأ بعد.
    await expect(admin.getByTestId("qa-analytics")).toBeVisible({ timeout: 30_000 });

    await admin.route(ANALYTICS_GLOB, (route) => route.abort("connectionfailed"));
    await admin.getByTestId("qa-analytics-refresh").click();

    // ⛔ الخطأ يظهر… وقشرة النجاح تختفي (لا تُبق أرقاماً قديمة beneath خطأ).
    await expect(admin.getByTestId("qa-analytics-error")).toBeVisible({ timeout: 30_000 });
    await expect(admin.getByTestId("qa-analytics")).toHaveCount(0);
    // ⛔ والخطأ محصور في لوحة التحليلات: بقية اللوحة حيّة.
    await expect(admin.getByTestId("qa-session-title")).toBeVisible();
    await expect(admin.getByTestId("qa-refresh")).toBeVisible();

    // و«إعادة المحاولة» **داخل** لوحة التحليلات تعيدها بلا رجوع لأعلى
    // الصفحة — لا يقف الخطأ بلا مخرج بعد إصلاحه.
    await admin.unroute(ANALYTICS_GLOB);
    await admin.getByTestId("qa-analytics-retry").click();
    await expect(admin.getByTestId("qa-analytics")).toBeVisible({ timeout: 30_000 });
    await expect(admin.getByTestId("qa-analytics-error")).toHaveCount(0);
  } finally {
    await adminCtx.close();
  }
});

test("⛔ D5: إجابة سؤال: إرسالها، اعتمادها، وظهورها — والرفض يُخفيها", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "answer-flow");

  const attendee = await openPlain(browser, PATHS.attendee);
  const other = await openPlain(browser, PATHS.attendee);
  try {
    await joinAttendee(attendee.page, "سائل");
    await askAndApprove(attendee.page, admin, QA);

    // ⛔ نموذج الإجابة مخفيّ حتى يُفتح عمداً — لا حقن تلقائي.
    await expect(attendee.page.getByTestId("qa-answer-form")).toHaveCount(0);
    await attendee.page.getByTestId("qa-question").filter({ hasText: QA }).first().getByTestId("qa-answer-open").click();
    await expect(attendee.page.getByTestId("qa-answer-form")).toBeVisible();

    // ⛔ زر الإرسال معطّل قبل حرفين (حدّ أدنى حقيقي في الخادم أيضاً).
    const send = attendee.page.getByTestId("qa-answer-submit");
    await expect(send).toBeDisabled();
    await attendee.page.getByTestId("qa-answer-input").fill("من عمر اثن عشرة.");
    await expect(send).toBeEnabled();

    await send.click();

    // ⛔ الإجابة **معلّقة** عند المراجعة: تظهر له كمسودته، ولا تظهر
    //    للجمهور قبل اعتماد المشرف.
    await expect(attendee.page.getByTestId("qa-my-pending-answer")).toContainText("من عمر اثن عشرة.");
    await joinAttendee(other.page, "مشاهد");
    await expect(other.page.getByTestId("qa-approved-answers")).toHaveCount(0);

    // اعتماد المشرف: تظهر عند المشاهد الثاني.
    await admin.locator('[data-testid="qa-answer-inbox"]').getByTestId("qa-answer-approve").first().click();
    await expect(other.page.getByTestId("qa-approved-answers")).toContainText("من عمر اثن عشرة.", {
      timeout: 20_000,
    });
    // ⛔ ورأس «الإجابة المعلّقة» يختفي عند الكاتب بعد الاعتماد.
    await expect(attendee.page.getByTestId("qa-my-pending-answer")).toHaveCount(0, { timeout: 20_000 });

    // إجابة ثانية تُرفض: لا تصل أحداً.
    await other.page.getByTestId("qa-question").filter({ hasText: QA }).first().getByTestId("qa-answer-open").click();
    await other.page.getByTestId("qa-answer-input").fill("من عمري خمسة عشر.");
    await other.page.getByTestId("qa-answer-submit").click();
    await expect(other.page.getByTestId("qa-my-pending-answer")).toBeVisible();
// ⚠️ النصّ «أُرسل» وحده كان يخلط الانتظارَ بالرفض (F5): النصّ الوحيد
    //    الممكن كان «أُرسل» فلا يميّز «ما زالت في الطريق» عن «مُرفضت».
    //    الآن الخادم يرسل الحالة، فـ«قيد المراجعة» ادّعاء صادق.
    await expect(other.page.getByTestId("qa-my-pending-answer")).toHaveAttribute(
      "data-status",
      "pending"
    );
    await expect(other.page.getByTestId("qa-my-pending-answer")).not.toContainText("انتظار");

    await admin.locator('[data-testid="qa-answer-inbox"]').getByTestId("qa-answer-reject").first().click();
    // ⛔ والرفض **يُخفي النصّ** عن الجميع — بما فيه صاحبُه: قائمة الإجابات
    //    المعتمدة مشتركة، فـ«غياب» هنا = `toContainText` سالب لا `count(0)`،
    //    لأن المعتمدة الأولى ما زالت تُعرض في نفس القائمة.
    await expect(other.page.getByTestId("qa-approved-answers")).toContainText("من عمر اثن عشرة.");
    await expect(other.page.getByTestId("qa-approved-answers")).not.toContainText("من عمري خمسة عشر.");
    await expect(attendee.page.getByTestId("qa-approved-answers")).not.toContainText("من عمري خمسة عشر.");
    // ✅ F5: الرفض **يصل** إلى صاحبها الآن — «لم تُعتمد» صراحةً، بدل انتظار
    //    صامت لا ينتهي. وهي إشارة الحالة من الخادم لا استنتاج من النصّ.
    await expect(other.page.getByTestId("qa-my-pending-answer")).toHaveAttribute(
      "data-status",
      "rejected",
      { timeout: 20_000 }
    );
    await expect(other.page.getByTestId("qa-my-pending-answer")).toContainText("من عمري خمسة عشر.");
  } finally {
    await other.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ D6: «إغلاق» الاستبيان يعيد الحاضر إلى المشاركة", async ({ browser }) => {
  const { ctx: adminCtx, page: admin, token: adminToken } = await openAdmin(browser);
  await createAndActivateSession(admin, "survey-close");
  const current = await (await admin.request.get("/api/qa/session/current?view=audience")).json();
  const activeSessionId = current.session.id as string;

  const attendee = await openPlain(browser, PATHS.attendee);
  try {
    await joinAttendee(attendee.page, "حاضر-استبيان");

    /**
     * ⛔ صندوق الردود يفرّق ثلاث حالات: تحميل، لا ردود، ردود. بلا حالة
     *    «لا ردود» يقرأ المشرفُ صفراً كأن الفعالية أُلغيت، وهي أطول حالة
     *    يبقى فيها المشرف قبل بدايتها.
     */
    await expect(admin.getByTestId("qa-survey-empty")).toBeVisible({ timeout: 30_000 });

    /**
     * ⛔ الوصول إلى الاستبيان **بالنقر** لا بتخمين الرابط: كانت الصفحة
     *    بلا أي رابط من أي واجهة، فبلوغها كان يتطلّب معرفة الرابط مسبقاً.
     */
    await attendee.page.getByTestId("qa-survey-link").click();
    await expect(attendee.page.getByTestId("qa-survey-form")).toBeVisible({ timeout: 20_000 });

    // ⛔ الإرسال بنموذج فارغ **يُرفض برسالة** (لا طلب، لا شاشة شكر):
    //    NPS + التقييم مطلوبان في `handleSubmit`.
    await attendee.page.getByTestId("qa-survey-submit").click();
    await expect(attendee.page.getByTestId("qa-survey-error")).toBeVisible();
    await expect(attendee.page.getByTestId("qa-survey-thanks")).toHaveCount(0);

    await attendee.page.getByTestId("qa-survey-nps-9").click();
    await attendee.page.getByTestId("qa-survey-rating-4").click();
    await attendee.page.getByTestId("qa-survey-comment").fill("تجربة ممتعة وشكراً.");
    await attendee.page.getByTestId("qa-survey-submit").click();
    await expect(attendee.page.getByTestId("qa-survey-thanks")).toBeVisible({ timeout: 20_000 });
    await expect(attendee.page.getByTestId("qa-survey-error")).toHaveCount(0);

    // ⛔ والإغلاق يعيد الحاضر إلى المشاركة: `onClose` لم يكن يُمرَّر
    //    أصلاً، فزرّ الإغلاق لم يكن يرسم أصلاً — محتجَز في «شكراً».
    await attendee.page.getByTestId("qa-survey-close").click();
    await expect(attendee.page.getByTestId("qa-ask-text")).toBeVisible({ timeout: 20_000 });
    await expect(attendee.page.getByTestId("qa-survey-thanks")).toHaveCount(0);
    /**
     * ⛔ الرد **محفوظ فعلاً** — ومقاييسه محسوبة، لا مجرّد HTTP 200.
     * نقرأ بالـAPI الإداري أولاً لأن التحقق من الأرقام أدقّ من قراءة
     * نصّ على الشاشة، ثم نُثبت العرض في D8 أدناه.
     */
    const res = await admin.request.get(`/api/qa/survey?sessionId=${encodeURIComponent(activeSessionId)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok(), `قراءة الردود بـ${res.status()}`).toBeTruthy();
    const body = await res.json();
    // ⛔ والردود كلها محصورة في هذه الجلسة (لا تسريب بين الجلسات).
    expect(body.total, "عدد الردود").toBe(1);
    expect(body.avgNps, "متوسط NPS").toBe(9);
    expect(body.avgRating, "متوسط التقييم").toBe(4);
    expect(body.npsScore, "درجة NPS").toBe(100);
    expect(body.npsBreakdown.promoters).toBe(1);
    expect(JSON.stringify(body.responses), "نصّ الرد غير محفوظ").toContain("تجربة ممتعة وشكراً.");

    /**
     * ⛔ F2 كان أن الردود تُجمع ولا يقرأها أحد: `QaAdminPanel` بلا صندوق
     *    ردود، ومفاتيح الترجمة (`avgNps`, `promoters`, ...) مكتوبة منذ
     *    البداية بلا مستهلِك. فلا يُعرف وجود التعليقات ⇒ صفر تحسين.
     *    وهنا: اللوحة تُعاد فتحها فيرى المشرف **نصّ الحاضر** على الشاشة.
     */
    /**
     * ⛔ أوّل قراءة للردود **معلّقة** لها حالة صريحة: بلا «جارٍ القراءة»
     *    كانت القفزة من صفحةٍ بلا صندوق إلى «صفر ردود» تُقرأ كأن
     *    الاستبيان لا يُفتح أصلاً — وهي أسوأ صورة لواجهة تعمل.
     */
    const releaseSurvey = await holdFirstSurveyRequest(admin);
    await admin.reload();
    await expect(admin.getByTestId("qa-session-title")).toBeVisible();
    await expect(admin.getByTestId("qa-survey-loading")).toBeVisible({ timeout: 30_000 });
    releaseSurvey();
    const inbox = admin.getByTestId("qa-survey-inbox");
    await expect(inbox, "صندوق ردود الاستبيان غير معروض").toBeVisible({ timeout: 30_000 });
    await expect(admin.getByTestId("qa-survey-total")).toContainText("1");
    await expect(admin.getByTestId("qa-survey-nps")).toContainText("100");
    await expect(admin.getByTestId("qa-survey-response")).toHaveCount(1);
    await expect(admin.getByTestId("qa-survey-comment")).toHaveText("تجربة ممتعة وشكراً.");
    // ⛔ والتوزيع والرد المفرد بأرقامه: مقياس بلا ردّ حرّ رقمٌ مجرّد، وردٌ بلا
    //    NPS/تقييم لا يُحسَن عليه أحد. والاثنان معاً في اللوحة.
    await expect(admin.getByTestId("qa-survey-breakdown")).toContainText("1");
    await expect(admin.getByTestId("qa-survey-responses")).toBeVisible();
    await expect(admin.getByTestId("qa-survey-response-nps")).toContainText("9/10");
    await expect(admin.getByTestId("qa-survey-response-rating")).toContainText("4/5");
    await expect(admin.getByTestId("qa-survey-empty")).toHaveCount(0);

    // ⛔ «تحديث» في الصندوق يعمل بلا إعادة تحميل الصفحة كاملة.
    await admin.getByTestId("qa-survey-refresh").click();
    await expect(admin.getByTestId("qa-survey-total")).toContainText("1", { timeout: 20_000 });

    /**
     * ⛔ فشل القراءة يظهر مع مخرج داخل الصندوق نفسه. قبل F2 لم يكن للصندوق
     *    وجود أصلاً، فكان فشل `/api/qa/survey` صامتاً عند المشرف: ردود
     *    محفوظة ولا أحد يعرف. وكما في D4، الخطأ لا يفسد بقية اللوحة.
     */
    await admin.route(SURVEY_GLOB, (route) => route.abort("connectionfailed"));
    await admin.getByTestId("qa-survey-refresh").click();
    await expect(admin.getByTestId("qa-survey-error")).toBeVisible({ timeout: 30_000 });
    await expect(admin.getByTestId("qa-session-title")).toBeVisible();
    await admin.unroute(SURVEY_GLOB);
    await admin.getByTestId("qa-survey-retry").click();
    await expect(admin.getByTestId("qa-survey-inbox")).toBeVisible({ timeout: 30_000 });
    await expect(admin.getByTestId("qa-survey-error")).toHaveCount(0);
    await expect(admin.getByTestId("qa-survey-response")).toHaveCount(1);

    /**
     * ⛔ الردّ **بلا تعليق** يظهر بنصٍّ صريح («بلا تعليق») لا بفراغٍ صامت:
     *    ردّ ناقص بلا تفسير يُقرأ كأنه ردّ ضاع. والتعليق اختياري في
     *    الاستمارة، فحالة «بلا تعليق» واجبة لا افتراضية.
     */
    const second = await openPlain(browser, PATHS.attendee);
    try {
      await joinAttendee(second.page, "حاضر بلا تعليق");
      await second.page.getByTestId("qa-survey-link").click();
      await expect(second.page.getByTestId("qa-survey-form")).toBeVisible({ timeout: 20_000 });
      await second.page.getByTestId("qa-survey-nps-5").click();
      await second.page.getByTestId("qa-survey-rating-2").click();
      await second.page.getByTestId("qa-survey-submit").click();
      await expect(second.page.getByTestId("qa-survey-thanks")).toBeVisible({ timeout: 20_000 });

      await admin.getByTestId("qa-survey-refresh").click();
      await expect(admin.getByTestId("qa-survey-response")).toHaveCount(2, { timeout: 20_000 });
      await expect(admin.getByTestId("qa-survey-comment-empty")).toHaveCount(1);
      await expect(admin.getByTestId("qa-survey-comment")).toHaveCount(1);
      // ⛔ والأحدث أولاً: الردّ بلا تعليق (آخر إرسال) فوق نصّ الرد الأول.
      //    التحقق بـ`data-testid` لا بنصّ «بلا تعليق» — اللوحة قد تعمل
      //    بالإنجليزية، والنصّ هنا سيجعل الاختبار هشًّا أمام اللغة.
      const rows = admin.getByTestId("qa-survey-response");
      await expect(rows.first().getByTestId("qa-survey-comment-empty")).toHaveCount(1);
      await expect(rows.nth(1).getByTestId("qa-survey-comment")).toHaveCount(1);
      await expect(admin.getByTestId("qa-survey-total")).toContainText("2");
    } finally {
      await second.ctx.close();
    }
  } finally {
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ D9: مصير السؤال يصل صاحبه: «قيد المراجعة» ثم «لم تُعتمد»", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "question-status");

  const asker = await openPlain(browser, PATHS.attendee);
  const other = await openPlain(browser, PATHS.attendee);
  const ASK = "هل سنحصل على تسجيلات الجلسات؟";
  try {
    await joinAttendee(asker.page, "صاحب السؤال");
    await joinAttendee(other.page, "حاضر آخر");

    await asker.page.getByTestId("qa-ask-text").fill(ASK);
    await asker.page.getByTestId("qa-ask-submit").click();
    await expect(asker.page.locator('[data-testid="qa-ask-msg"][data-msg-kind="sent"]')).toBeVisible();

    /**
     * ⛔ F5 كان في_question فقط_: الرفض كان صامتاً تماماً — لا حقل حالة في
     *    اللقطة العامة ولا نقطة نهاية تعرض-case صاحب السؤال، فبقيت رسالة
     *    «أُرسل» (أو البطاقة) بلا أي خبر بالمصير. أطول انتظار بلا معلومة.
     */
    const mine = asker.page.getByTestId("qa-my-questions");
    await expect(mine, "قائمة «أسئلتي» غير معروضة بعد الإرسال").toBeVisible({ timeout: 20_000 });
    await expect(mine.getByTestId("qa-my-question")).toHaveCount(1);
    await expect(mine.getByTestId("qa-my-question")).toHaveAttribute("data-status", "pending");
    await expect(mine).toContainText(ASK);

    // ⛔ ولا يتسرّب سؤال غيري إلى «أسئلتي» — النطاق هو صاحبُ السؤال.
    await expect(other.page.getByTestId("qa-my-questions")).toHaveCount(0);

    // الاعتماد: «معروضة على الشاشة».
    await adminRow(admin, ASK).getByTestId("qa-approve").first().click();
    await expect(mine.getByTestId("qa-my-question")).toHaveAttribute("data-status", "approved", {
      timeout: 20_000,
    });

    // سؤال ثانٍ يُرفض: «لم تُعتمد» صراحةً، لا انتظارٌ صامت.
    const ASK2 = "هل هناك مواصلات من القاعة؟";
    await asker.page.getByTestId("qa-ask-text").fill(ASK2);
    await asker.page.getByTestId("qa-ask-submit").click();
    await expect(mine.getByTestId("qa-my-question")).toHaveCount(2);
    await adminRow(admin, ASK2).getByTestId("qa-reject").first().click();
    const rejected = mine.locator('[data-testid="qa-my-question"][data-status="rejected"]');
    await expect(rejected, "الرفض لم يصل صاحب السؤال").toHaveCount(1, { timeout: 20_000 });
    await expect(rejected).toContainText(ASK2);
    // ⛔ والمرفوض لا يظهر في قائمة الأسئلة العامة عند الحاضر.
    await expect(asker.page.getByTestId("qa-question").filter({ hasText: ASK2 })).toHaveCount(0);

    // ✅ ويعيش بعد إعادة التحميل — المصدر خادمي لا تخزين محلي.
    await asker.page.reload();
    await expect(asker.page.getByTestId("qa-my-questions")).toBeVisible({ timeout: 20_000 });
    await expect(
      asker.page.locator('[data-testid="qa-my-question"][data-status="rejected"]')
    ).toHaveCount(1);
  } finally {
    await other.ctx.close();
    await asker.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ D7: أوّل لقطة متأخرة لحاضرٍ عائد ⇒ «جارٍ الاتصال» لا «لا توجد جلسة»", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "first-snapshot");

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubTurnstile(page);
  try {
    /**
     * ⛔ `qa-connecting` (LiveParticipate.tsx:586) هي آخر مرساة بلا تغطية.
     *    وحدها تظهر لمن **سبق انضمامه**: لِحاضر جديد تُعرض بوابة
     *    الانضمام أولاً (`!attendee` يسبقها في السلسلة)، فلا داعي لفحص
     *    التغطية عليها هناك. وخطرها الحقيقي مَن هو عائد على شبكة
     *    القاعة البطيئة: قبل أوّل لقطة ناجحة، عرض «لا توجد جلسة» يدفعه
     *    للضغط على «انضمام» جديد فيفقد هويته وأصواته — بسبب شبكة.
     */
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        "tedx-qa-attendee",
        JSON.stringify({ id: "d7-returning", name: "حاضر-عائد" })
      );
    });
    await delayFirstRequest(page, SNAPSHOT_GLOB, 3_000);
    await page.goto(PATHS.attendee);

    await expect(page.getByTestId("qa-connecting")).toBeVisible();
    // ⛔ ولا بوابة انضمام تُفتح تحت الطلب المعلّق.
    await expect(page.getByTestId("qa-join-name")).toHaveCount(0);

    // ثم تنكشف المشاركة وحدها حين تصل اللقطة — بلا أي إجراء من الحاضر.
    await expect(page.getByTestId("qa-ask-text")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("qa-connecting")).toHaveCount(0);
  } finally {
    await ctx.close();
    await adminCtx.close();
  }
});
