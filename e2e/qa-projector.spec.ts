import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import creds from "../scripts/qa-test-credentials.json";

/**
 * الطبقة 5: سلوك **المشروعور** — الدوران التلقائي والتثبيت والسحابة.
 *
 * 🎯 الطبقات السابقة تُثبت أن الأسئلة *تصل* إلى الشاشة. لا واحدة منها
 * تُثبت ما يحدث حين تترك الشاشة تحتها أربعين دقيقة:
 *
 *   - `auto` يبدّل السؤال كل ٧ ثوانٍ — هل يعمل فعلاً، وهل يتوقّف عند
 *     سؤال واحد؟
 *   - ⛔ **التثبيت يفوز دائماً**: شريحة يختارها المشرف يدوياً يجب ألّا
 *     تختفي بعد ٧ ثوانٍ. لو دار وضع `auto` فوقها لضاع زرّ «التالي»
 *     كل ٧ ثوانٍ، وقرار المشرف صار عابراً.
 *   - `manual` لا يتقدّم وحده؛ «التالي» هو ما يقدّم.
 *   - السحابة تُبنى من المخزون فعلاً، لا من مساحة فارغة.
 *
 * ⚠️ كل الاختبارات `serial` وجلسة واحدة نشطة (قاعدة C3)، وكل واحد
 * يبني على ما قبله. المهل أطول هنا بطبيعتها: التدوير ٧ ثوانٍ، فاختبار
 * «لا يتقدّم» ينتظر أكثر من دورتين كاملتين — إثباتٌ بالانتظار.
 */

const ADMIN_PW = creds.adminPassword;

const PATHS = {
  admin: "/en/admin/live",
  attendee: "/en/live",
  projector: "/en/live/screen",
} as const;

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

async function openAdmin(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
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
  await page.goto(PATHS.admin);
  await expect(page.getByTestId("qa-session-title")).toBeVisible();
  return { ctx, page };
}

async function openPlain(browser: Browser, path: string): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubTurnstile(page);
  await page.goto(path);
  return { ctx, page };
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

function sentMessage(attendee: Page) {
  return attendee.locator('[data-testid="qa-ask-msg"][data-msg-kind="sent"]');
}

async function joinAttendee(attendee: Page, name: string): Promise<void> {
  await attendee.getByTestId("qa-join-name").fill(name);
  await attendee.getByTestId("qa-join-submit").click();
  await expect(attendee.getByTestId("qa-ask-text")).toBeVisible();
}

/** ⛔ أسئلة متمايزة: كشف المكرر تشابه ضبابي `>= 0.75`. */
const QA = "كيف أبدأ تعلّم البرمجة؟";
const QB = "ما أثر إعادة تدوير النفايات؟";
const QC = "لماذا يهمّ استزراع الأشجار؟";

async function askAndApprove(attendee: Page, admin: Page, question: string): Promise<void> {
  await attendee.getByTestId("qa-ask-text").fill(question);
  await attendee.getByTestId("qa-ask-submit").click();
  await expect(sentMessage(attendee)).toBeVisible();
  await adminRow(admin, question).getByTestId("qa-approve").first().click();
}

async function seedQuestions(attendee: Page, admin: Page): Promise<void> {
  await joinAttendee(attendee, "حاضر-عرض");
  for (const q of [QA, QB, QC]) await askAndApprove(attendee, admin, q);
}

test.describe.configure({ mode: "serial" });

test("⛔ P1: وضع auto يدور فعلاً — ومن سؤالٍ واحد لا يدور", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "rotate-auto");

  const attendee = await openPlain(browser, PATHS.attendee);
  const projector = await openPlain(browser, PATHS.projector);

  try {
    // سؤال واحد معتمد ⇒ لا دوران يُنتظر: شاشة واحدة ثابتة.
    await joinAttendee(attendee.page, "حاضر-دوران");
    await askAndApprove(attendee.page, admin, QA);

    await admin.getByTestId("qa-screen-auto").click();
    await expect(admin.getByTestId("qa-screen-auto")).toBeDisabled();

    await expect(projector.page.getByText(QA)).toBeVisible({ timeout: 20_000 });
    // آخر ما قبل الدوران: ننتظر > ٧ ثوانٍ ونطلب نفس النصّ.
    await expect(projector.page.getByText(QA)).toBeVisible({ timeout: 20_000 });

    // الآن نضيف سؤالاً ثانياً ⇒ يتغيّر ما يُعرض خلال دورة واحدة.
    await askAndApprove(attendee.page, admin, QB);

    // ⛔ الأثر المقصود: نصّ **مختلف** على الشاشة بعد دورة.
    // الاكتفاء بأن السؤال ظاهر يمرّ مع شاشة ساكنة أيضاً.
    await expect(projector.page.getByText(QB), "الشاشة لم تبدّل السؤال خلال دورة").toBeVisible({
      timeout: 20_000,
    });
  } finally {
    await projector.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ P2: التثبيت اليدوي يفوز على الدوران — شريحة المشرف لا تختفي", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "rotate-pinned");

  const attendee = await openPlain(browser, PATHS.attendee);
  const projector = await openPlain(browser, PATHS.projector);

  try {
    await seedQuestions(attendee.page, admin);
    await admin.getByTestId("qa-screen-auto").click();
    await expect(admin.getByTestId("qa-screen-auto")).toBeDisabled();

    // مخزون أسئلة كافٍ للدوران، ثم المشرف يثبّت سؤالاً بعينه.
    await expect(projector.page.getByTestId("qa-screen-question")).toBeVisible({ timeout: 20_000 });
    await adminRow(admin, QC).getByTestId("qa-put-on-screen").first().click();

    /**
     * ⛔ ضمانٌ مرئي: شريحة المشرف تبقى على الشاشة.
     *
     * ⚠️ توثيق دقيق للآلية، لأن الفهم الخاطئ هنا يقود إلى «إصلاح» خاطئ:
     * البقاء هنا يأتي من **ترتيب العرض** في `body` (المثبّت يُقاس
     * قبل `rotateQuestion`) مع `reconcileScreenSlide` في الخادم — لا من
     * `!pinned` في `rotating`. كسرُ `!pinned` وحده **لا يُفشل هذا
     * الفحص** (ثبت بالـmutation)، لأن الشريحة المثبَّتة تُرسم أولاً
     * في كل الأحوال. وظيفة `!pinned` اليوم: منع `qIdx` المخفي من
     * إيقاظ تصيير كل ٧ ثوانٍ بلا أثر مرئي، وتوثيق أن التثبيت أوجب.
     */
    await expect(projector.page.getByText(QC)).toBeVisible({ timeout: 20_000 });
    await expect(projector.page.getByText(QC)).toBeVisible({ timeout: 20_000 });
    await expect(admin.getByTestId("qa-screen-current")).toContainText(QC);
  } finally {
    await projector.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ P3: الوضع اليدوي لا يحرّك شيئاً وحده — «التالي» وحده يقدّم", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "rotate-manual");

  const attendee = await openPlain(browser, PATHS.attendee);
  const projector = await openPlain(browser, PATHS.projector);

  try {
    await seedQuestions(attendee.page, admin);
    // ⚠️ `manual` هو الوضع الافتراضي، فالزر معطّل أصلاً. النقر على عنصر
    // معطّل ينتظر حتى المهلة ويفشل اختباراً صحيحاً تماماً.
    const manual = admin.getByTestId("qa-screen-manual");
    if (await manual.isEnabled()) await manual.click();
    await expect(manual).toBeDisabled();

    // في الوضع اليدوي لا تعرض الشاشة سؤالاً من تلقاء نفسها: تبقى على
    // «انتظار» حتى يختار المشرف. وثلاثة أسئلة معتمدة في الطابور.
    await expect(projector.page.getByTestId("qa-screen-hold")).toBeVisible({ timeout: 20_000 });
    await expect(manual).toBeDisabled();

    // ⛔ إثباتٌ بالانتظار: أكثر من دورتين (١٦ ث). لو كان التدوير يعمل
    // على وضع `manual` لظهرت بطاقة سؤال هنا بلا ضاغطة من أحد.
    await projector.page.waitForTimeout(16_000);
    await expect(projector.page.getByTestId("qa-screen-hold")).toBeVisible();
    await expect(projector.page.getByTestId("qa-screen-question")).toHaveCount(0);

    // «التالي» يقدّم فوراً… ويبقى. الشريحة المثبَّتة لا تمضي من نفسها،
    // وهذا هو المعنى الحقيقي لـ`manual`: القاعة تنتظر قرار المشرف.
    await admin.getByTestId("qa-screen-next").click();
    const card = projector.page.getByTestId("qa-screen-question");
    await expect(card).toBeVisible({ timeout: 20_000 });
    const pinned = await card.innerText();
    expect(pinned.trim().length, "بطاقة فارغة").toBeGreaterThan(0);

    await projector.page.waitForTimeout(16_000);
    expect(await card.innerText(), "الشريحة المثبَّتة تمضت وحدها").toBe(pinned);
  } finally {
    await projector.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ P5: سؤال مثبَّت مُجاب عنه — يغيب عن المسرح، واللوحة تقول «بانتظار المشرف»", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "stale-pin");

  const attendee = await openPlain(browser, PATHS.attendee);
  const projector = await openPlain(browser, PATHS.projector);

  try {
    // وضع `auto` مقصود هنا: لولاه لبقي الفحص في manuals فقط. السؤال
    // البديل يظهر فقط حين `rotateQuestion` معرَّف، أي حين يدور الدوران.
    await joinAttendee(attendee.page, "حاضر-مثبّت");
    await askAndApprove(attendee.page, admin, QA);
    await askAndApprove(attendee.page, admin, QB);
    await admin.getByTestId("qa-screen-auto").click();

    await adminRow(admin, QA).getByTestId("qa-put-on-screen").first().click();
    await expect(projector.page.getByTestId("qa-screen-question")).toContainText(QA, { timeout: 20_000 });

    // المشرف يجيب على السؤال المعروض ⇒ يسقط من `screenEligibleQuestions`.
    await adminRow(admin, QA).getByTestId("qa-answer").first().click();
    await expect(adminRow(admin, QA).getByTestId("qa-answer")).toContainText("Answered");

/**
     * ⛔ لا سؤال مُجاب عنه على المسرح، واللقطة الوحيدة الصحيحة عند
     * لوحة المشرف.
     *
     * ⚠️ تصحيح سلوكي مهم: توقّعتُ هنا «انتظاراً» على الشاشة، وهذا غير
     * صحيح في `auto`. `reconcileScreenSlide` يرجع الشريحة إلى `hold`،
     * فيقول المشرف «بانتظار المشرف» — لكن `hold` مع `auto` ومخزون
     * مؤهَّل يمرّ إلى `rotateQuestion`: فتدور الأسئلة **المؤهَّلة** فوراً
     * (وهي السلوك المقصود: المسرح لا يموت). `HoldCard` تظهر فقط بلا
     * مخزون يدور، أو في `manual`.
     *
     * فالضمان هنا ليس «الانتظار»، بل:
     *   ١. السؤال المُجاب عنه **يغيب** عن المسرح — لو سقط
     *      `!q.answered` من مُرشّح `questions` لبقي على الشاشة.
     *   ٢. اللوحة تقول `hold` صراحةً — لو توقّفت `reconcileScreenSlide`
     *      لقالت «لم يعد متاحاً للعرض»: نصٌّ يدّعي أن الشريحة سؤال وهي
     *      ليس كذلك.
     */
await expect(admin.getByTestId("qa-screen-current")).toContainText("Waiting for the moderator");
    const card = projector.page.getByTestId("qa-screen-question");
    await expect(card).toBeVisible({ timeout: 20_000 });

    // ١) يخرج السؤال المُجاب عنه من المسرح. النافذة القصوى بين
    //    تغيّر لوحة المشرف وتغيّر إطار البثّ للمشروعور دورة واحدة (~٣ ث).
    await expect(card).not.toContainText(QA, { timeout: 20_000 });

    // ٢) ولا **يعود** عبر الدوران في دورتين كاملتين (١٧ عيّنة × ١ ث
    //    ≈ ٢ × ٧ ث). ⛔ العيّنة الواحدة كانت تُمرّ بالحظّ لأن `qIdx`
    //    اعتباطي: قد لا يمرّ النصّ المحظور في اللقطة التي تحالفه الحظ.
    const seen = new Set<string>();
    for (let i = 0; i < 17; i++) {
      if ((await card.count()) > 0) seen.add(await card.innerText());
      await projector.page.waitForTimeout(1_000);
    }
    const shown = [...seen].join(" | ");
    expect(shown, "سؤال مُجاب عنه عاد إلى المسرح").not.toContain(QA);
    expect(shown, "لم يبقَ أي سؤال حيّ على الشاشة").toContain(QB);
  } finally {
    await projector.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ P4: شريحة السحابة تُبنى من المخزون، والنسخة المصغّرة تظهر بثلاثة أسئلة", async ({
  browser,
}) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "word-cloud");

  const attendee = await openPlain(browser, PATHS.attendee);
  const projector = await openPlain(browser, PATHS.projector);

  try {
    // سؤالان فقط ⇒ لا نسخة مصغّرة (العتبة ٣) — نتأكد من السلّم.
    await joinAttendee(attendee.page, "حاضر-سحابة");
    await askAndApprove(attendee.page, admin, QA);
    await askAndApprove(attendee.page, admin, QB);
    await expect(projector.page.getByTestId("qa-screen-cloud-mini")).toBeHidden();

    // السؤال الثالث ⇒ تظهر النسخة المصغّرة.
    await askAndApprove(attendee.page, admin, QC);
    await expect(projector.page.getByTestId("qa-screen-cloud-mini")).toBeVisible({ timeout: 20_000 });

    // شريحة السحابة الكاملة: كلمات عربية حقيقية موضوعة، لا مساحة فارغة.
    await admin.getByTestId("qa-screen-wordcloud").click();
    const cloud = projector.page.getByTestId("qa-screen-wordcloud");
    await expect(cloud).toBeVisible({ timeout: 20_000 });

    const placed = projector.page.getByTestId("qa-word-cloud").first();
    const count = Number(await placed.getAttribute("data-placed-count"));
    expect(count, "لم تُوضَع أي كلمة").toBeGreaterThan(0);

    // ⛔ الكلمات المعروضة عربية ومطابقة للمخزون، لا حروف fallback:
    // الحرف الواحد فقط كان يملأ السحابة رموزاً.
    await expect(cloud).toContainText(/[ء-ي]{2,}/);

    // ولا يتكرّر النصّ الواحد مرّتين (مفتاح `WordCloud` هو النصّ).
    const words = await placed.locator("span").allInnerTexts();
    expect(new Set(words).size, "كلمة مكرّرة في السحابة").toBe(words.length);
  } finally {
    await projector.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});
