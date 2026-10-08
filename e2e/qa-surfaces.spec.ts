import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import creds from "../scripts/qa-test-credentials.json";

/**
 * الطبقة 4: أسطح لم تغطّها الطبقات السابقة.
 *
 * 🎯 `qa-three-surface` يغطّي الحلقة على ثلاث شاشات (إدارة/مشروعور/حاضر)،
 * و`qa-matrix` يغطّي العقد بلا متصفح. فتبقى ثلاثة أسطح بلا اختبار واجهة:
 *
 *   1. **شاشة المتحدث** (`/en/live/speaker`) — تعمل بتوكن من `sessionStorage`
 *      على جهاز المفاتيح. بلا توكن — كما في القاعة — كان ضغط زرّ
 *      «تمت الإجابة» صامتاً تماماً.
 *   2. **لوحة التحليلات** — تُركَّب أسفل اللوحة دائماً، وزرّها كان
 *      `Refresh` نصاً حرفياً بالإنجليزية داخل واجهة عربية.
 *   3. **الاستبيان** — يبدأ بـ`?session=<id>` في الـURL ومعرّف الحضور في
 *      `sessionStorage`، فلا يظهر شيء «انضم أولاً» لأحد.
 *
 * ⚠️ كل الاختبارات `serial` وتشارك جلسة نشطة واحدة (قاعدة C3)، وكل واحد
 * يبني على ما قبله. الترتيب مقصود: حذف أيّها يكسر ما بعده.
 */

const ADMIN_PW = creds.adminPassword;

const PATHS = {
  admin: "/en/admin/live",
  speaker: "/en/live/speaker",
  attendee: "/en/live",
  projector: "/en/live/screen",
  survey: "/en/live/survey",
} as const;

/** Turnstile مزروع مسبقاً — بلاه تنتظر الواجهة شبكةً ثم تُعلن فشلاً كاذباً. */
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

async function tokenVia(page: Page): Promise<string> {
  const res = await page.request.post("/api/admin/login", {
    data: { username: "admin", password: ADMIN_PW },
    timeout: 90_000,
  });
  expect(res.ok(), `دخول الإدارة فشل بـ${res.status()}`).toBeTruthy();
  return (await res.json()).token as string;
}

/** سياق إدارة بتوكن مزروع في `sessionStorage` كما يفعل نموذج الدخول. */
async function openAdmin(browser: Browser): Promise<{ ctx: BrowserContext; page: Page; token: string }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const token = await tokenVia(page);
  await stubTurnstile(page);
  await page.addInitScript((t: string) => window.sessionStorage.setItem("tedx-admin-token", t), token);
  await page.goto(PATHS.admin);
  await expect(page.getByTestId("qa-session-title")).toBeVisible();
  return { ctx, page, token };
}

/** سطح بلا توكن — كما في القاعة فعلاً. */
async function openPlain(
  browser: Browser,
  path: string,
  seedAttendee?: { id: string; name: string }
): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubTurnstile(page);
  if (seedAttendee) {
    await page.addInitScript(
      (a: { id: string; name: string }) =>
        window.sessionStorage.setItem("tedx-qa-attendee", JSON.stringify(a)),
      seedAttendee
    );
  }
  await page.goto(path);
  return { ctx, page };
}

/**
 * ⚠️ الأسئلة **متداخلة** تحت كل جلسة في حمولة الإدارة
* (`admin/questions/route.ts` L43)، لا في مصفوفة أعلى. افتراض وجودها
 * في الأعلى يجعل `state.questions` غير معرّف، فيفشل الاختبار بـTypeError
 * بلا رسالة تُفهم.
 */
type AdminApi = {
  sessions: {
    id: string;
    active: boolean;
    questions: { id: string; text: string; showToAudience: boolean; answered: boolean }[];
  }[];
};

/** نقرأ الحالة من حمولة الإدارة نفسها — لا نبني معرّفات بأنفسنا. */
async function apiState(admin: Page, token: string): Promise<AdminApi> {
  const res = await admin.request.get("/api/qa/admin/questions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `حمولة الإدارة فشلت بـ${res.status()}`).toBeTruthy();
  return (await res.json()) as AdminApi;
}

async function activeSessionId(admin: Page, token: string): Promise<string> {
  const state = await apiState(admin, token);
  const active = state.sessions.find((s) => s.active);
  expect(active, "لا جلسة نشطة").toBeTruthy();
  return active!.id;
}

async function activeQuestions(admin: Page, token: string): Promise<AdminApi["sessions"][number]["questions"]> {
  const state = await apiState(admin, token);
  const active = state.sessions.find((s) => s.active);
  expect(active, "لا جلسة نشطة").toBeTruthy();
  return active!.questions;
}

async function questionId(admin: Page, token: string, text: string): Promise<string> {
  const id = (await activeQuestions(admin, token)).find((q) => q.text === text)?.id;
  expect(id, `لم أجد السؤال «${text}»`).toBeTruthy();
  return id!;
}

async function moderate(admin: Page, token: string, body: Record<string, unknown>) {
  const res = await admin.request.post("/api/qa/admin/moderate", {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    data: body,
  });
  return res;
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

  // `acceptingQuestions` ليس مفعّلاً تلقائياً مع التنشيط — بدون هذا
  // لا يقبل الخادم سؤالاً، ويظهر الاختبار «لا سؤال» بدل «سؤال حيّ».
  const accepting = admin.getByTestId("qa-session-accepting");
  if ((await accepting.getAttribute("aria-pressed")) !== "true") await accepting.click();
  await expect(accepting).toHaveAttribute("aria-pressed", "true");
}

function adminRow(admin: Page, text: string) {
  return admin.locator('[data-testid="qa-question-row"]', { hasText: text });
}


async function attendeeJoins(page: Page, name: string): Promise<void> {
  const field = page.getByTestId("qa-join-name");
  await expect(field).toBeVisible();
  await field.fill(name);
  await expect(field).toHaveValue(name);
  await page.getByTestId("qa-join-submit").click();
  // بعد النجاح يختفي نموذج الانضمام: لا صفحة فيها مرّتان.
  await expect(page.getByTestId("qa-ask-text")).toBeVisible();
}

/**
 * يسأل ويُثبّت النجاح: رسالة `ok` لا مجرد اختفاء الحقل.
 *
 * ⚠️ لا تنضم هنا — انضمام واحد لكل صفحة. والسؤال الثاني على الصفحة نفسها
 * هو بالضبط ما يختبر `qReset`: الرمز يُستهلك في كل طلب يله، فلو لم
 * يُجدَّد لسقط السؤال الثاني بـ403.
 */
async function attendeeAsks(page: Page, text: string): Promise<void> {
  const input = page.getByTestId("qa-ask-text");
  await expect(input).toBeVisible();
  await input.fill(text);
  await expect(input).toHaveValue(text);
  await page.getByTestId("qa-ask-submit").click();
  // `kind="sent"` لا `type="ok"`: تنبيه «شبيه موجود» أخضر أيضاً، فلو
  // اكتفينا بـ`ok` لَمرّ «لم يُسجَّل سؤالي» على أنه نجاح.
  await expect(page.locator('[data-testid="qa-ask-msg"][data-msg-kind="sent"]')).toBeVisible();
  await expect(input).toHaveValue("");
}

async function approve(admin: Page, text: string): Promise<void> {
  await adminRow(admin, text).getByTestId("qa-approve").first().click();
}

test.describe.configure({ mode: "serial" });

test("⛔ L4-1: المتحدث بلا توكن — أزرار تتحرك، و«تمت الإجابة» تصرخ لا تصمت", async ({ browser }) => {
  const { ctx: adminCtx, page: admin, token } = await openAdmin(browser);
  await createAndActivateSession(admin, "speaker-surface");

const attendee = await openPlain(browser, PATHS.attendee);
  // ⛔ أسئلة متمايزة عمداً: كشف المكرر تشابهٌ ضبابي `>= 0.75`
  // (`question/route.ts` L121)، فسؤالان يختلفان بكلمة واحدة («الأول»
  // و«الثاني») يمرّان مكرراً — وكان الاختبار سيفشل على سلوكٍ صحيح.
  const Q1 = "كيف أبدأ تعلّم البرمجة؟";
  const Q2 = "ما أثر إعادة تدوير النفايات؟";
await attendeeJoins(attendee.page, "حاضر-متحدث");
  await attendeeAsks(attendee.page, Q1);
  await attendeeAsks(attendee.page, Q2);

  // ⛔ الشبيه لا يُرسل، ونصّه يبقى قابلاً للتحرير: المشرفون يريدون
  // «شابه» لا «مكرر» — والفارق بينهما ثقة الحاضر.
  const NEAR = "كيف أبدأ تعلم البرمجة؟";
  await attendee.page.getByTestId("qa-ask-text").fill(NEAR);
  await attendee.page.getByTestId("qa-ask-submit").click();
  await expect(attendee.page.locator('[data-testid="qa-ask-msg"][data-msg-kind="duplicate"]')).toBeVisible();
  await expect(attendee.page.getByTestId("qa-ask-text")).toHaveValue(NEAR);
  await attendee.page.getByTestId("qa-ask-text").fill("");

  // ⛔ المتحدّث **بلا** توكن إدارة: هذا واقع القاعة — جهاز المفاتيح
  // عند المتحدث وشاشة علّامة؛ زرع التوكن كان سيُخفي أهم ما نختبره.
  const speaker = await openPlain(browser, PATHS.speaker);

  try {
    // ⛔ السؤال المعلّق لا يظهر للمتحدّث: العرض يعتمد على `approved`.
    await approve(admin, Q1);
    await approve(admin, Q2);
    await expect(speaker.page.getByText(Q1)).toBeVisible();

    // العدّاد «(1/2)» يثبت ترتيباً حقيقياً لا عرضاً عشوائياً.
    await expect(speaker.page.getByText(/1\/2/)).toBeVisible();

    // «تمت الإجابة» بلا توكن ⇒ **تنبيه صريح**.
    //
    // ⚠️ كان `if (!token) return;` صامتاً: المتحدث يضغط على المسرح ولا
    // يحدث شيء. هذا الاختبار يحرس التنبيه لا الصمت.
    await speaker.page.getByTestId("qa-speaker-answered").click();
    await expect(speaker.page.getByTestId("qa-speaker-error")).toBeVisible();

// التالي/السابق حقيقيان بلا reload.
    //
    // ⚠️ نمط مُثبَّت لا `/next/i`: زرّ أدوات Next في وضع التطوير اسمه
    // «Open Next.js Dev Tools» فيتطابق معه في strict mode.
    await speaker.page.locator("#main-content main").getByRole("button", { name: /^(next|التالي)$/i }).click();
    await expect(speaker.page.getByText(Q2)).toBeVisible();
    await speaker.page.locator("#main-content main").getByRole("button", { name: /^(previous|السابق)$/i }).click();
    await expect(speaker.page.getByText(Q1)).toBeVisible();

    // من السؤال المُجاب عليه ⇒ مخفي: الـAPI يبقيه `visible:true` (قسم
    // `live`) والعميل هو من يفلتر. الاختبار يحرس قرار العميل.
    const sessionId = await activeSessionId(admin, token);
    const res = await moderate(admin, token, {
      action: "answer",
      sessionId,
      questionId: await questionId(admin, token, Q1),
      answered: true,
    });
    expect(res.ok(), `الإجابة فشلت بـ${res.status()}`).toBeTruthy();

    await expect(speaker.page.getByText(Q1)).toBeHidden({ timeout: 15_000 });
    await expect(speaker.page.getByText(Q2)).toBeVisible();

    // ⛔ السؤال ما زال `visible` في العقد ⇒ لا نُصلح «التصفية» بتغيير
    // القسم الخطأ. الفحص السطحي يوثّق أين يقع القرار: في `SpeakerView`.
    const stillVisible = (await activeQuestions(admin, token)).find((q) => q.text === Q1)?.showToAudience;
    expect(stillVisible, "تغيّر عقد الرؤية — راجع public-view").toBe(true);
  } finally {
    await speaker.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ L4-2: إيقاف «شاشة المتحدث» يبدّلها إلى رسالة تعطيل، لا أسئلة", async ({ browser }) => {
  const { ctx: adminCtx, page: admin, token } = await openAdmin(browser);
  await createAndActivateSession(admin, "speaker-disabled");

  const attendee = await openPlain(browser, PATHS.attendee);
  const Q = "سؤال قبل الإيقاف";
  await attendeeJoins(attendee.page, "حاضر-إيقاف");
  await attendeeAsks(attendee.page, Q);
  await approve(admin, Q);

  const speaker = await openPlain(browser, PATHS.speaker);

  try {
    await expect(speaker.page.getByText(Q)).toBeVisible();

    // ⚠️ `setSpeaker` راية جلسة لا مرشّح: أثره في `SpeakerView` وحده.
    // الاختبار هنا للواجهة — وهو أيضاً موضع الفراغ الذي لم يملأه أحد.
    const sessionId = await activeSessionId(admin, token);
    const res = await moderate(admin, token, { action: "setSpeaker", sessionId, enabled: false });
    expect(res.ok(), `setSpeaker فشل بـ${res.status()}`).toBeTruthy();

    // المحتوى يُستبدل برسالة التعطيل — لا قائمة أسئلة ولا «لا أسئلة».
    await expect(speaker.page.getByText(Q)).toBeHidden({ timeout: 15_000 });
    await expect(speaker.page.locator("#main-content main")).toContainText(/disabled|معطّل|متحدث/i);
    await expect(speaker.page.getByTestId("qa-speaker-answered")).toBeHidden();
  } finally {
    await speaker.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ L4-3: التحليلات تُحدَّث بلا إعادة تحميل، وزرّها مترجم", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "analytics-live");

  try {
    await expect(admin.getByTestId("qa-analytics")).toBeVisible();
    const stat = admin.getByTestId("qa-stat-total-questions");
    const readCount = async () => Number((await stat.innerText()).match(/\d+/)?.[0] ?? -1);
    const before = await readCount();
    expect(before, "لا أرقام تحليلات صالحة").toBeGreaterThanOrEqual(0);

    const attendee = await openPlain(browser, PATHS.attendee);
const Q1 = "كيف أبدأ تعلّم التصميم؟";
    const Q2 = "لماذا يهمّ استزراع الأشجار؟";
    await attendeeJoins(attendee.page, "حاضر-تحليلات");
    await attendeeAsks(attendee.page, Q1);
    await attendeeAsks(attendee.page, Q2);
    await approve(admin, Q1);
    await approve(admin, Q2);
    await attendee.ctx.close();

    // ⚠️ الزر كان `Refresh` نصاً حرفياً: يظهر إنجليزياً في الواجهة
    // العربية. الاختبار لا يقرؤ النص (لئلا يتجمّد على ترجمة) بل يقرؤ
    // **المعرّف** ويقيس التغيّر.
    await admin.getByTestId("qa-analytics-refresh").click();

    await expect
      .poll(async () => await readCount(), { timeout: 20_000 })
      .toBeGreaterThan(before);

    // أعلى الأسئلة يعرض النصّ لا المعرّف.
    await expect(admin.getByTestId("qa-analytics")).toContainText(Q1);
    await expect(admin.getByTestId("qa-stat-attendees")).toBeVisible();
  } finally {
    await adminCtx.close();
  }
});

test("⛔ L4-4: الاستبيان — بلا جلسة يرفض بلطف، ومعه يُرسَل مرّة واحدة", async ({ browser }) => {
  const { ctx: adminCtx, page: admin, token } = await openAdmin(browser);
  await createAndActivateSession(admin, "survey-surface");
  const sessionId = await activeSessionId(admin, token);

  try {
    // بلا `?session=` ⇒ «join first» — ما يراه كل من يفتح المسار مباشرة.
    const naked = await openPlain(browser, PATHS.survey);
    await expect(naked.page.getByText(/join the session first/i)).toBeVisible();
    await naked.ctx.close();

    // حضور حقيقي عبر النموذج ⇒ معرّف في sessionStorage.
    const attendee = await openPlain(browser, PATHS.attendee);
    await attendeeJoins(attendee.page, "حاضر-الاستبيان");
    const stored = await attendee.page.evaluate(() => window.sessionStorage.getItem("tedx-qa-attendee"));
    expect(stored, "لم يُحفظ الحضور في sessionStorage").toBeTruthy();
    const attendeeId = (JSON.parse(stored as string) as { id: string }).id;

    // الإرسال فارغاً ⇒ خطأ تحقّق محلي **قبل** أي طلب شبكة.
    const survey = await openPlain(browser, `${PATHS.survey}?session=${sessionId}`, {
      id: attendeeId,
      name: "حاضر-الاستبيان",
    });
    await expect(survey.page.getByTestId("qa-survey-submit")).toBeVisible();
    await survey.page.getByTestId("qa-survey-submit").click();
    await expect(survey.page.getByTestId("qa-survey-error")).toBeVisible();

    // NPS = 0 (!) ونجمة واحدة ⇒ صفر قيمة لا «لم يُختر شيء».
    await survey.page.getByTestId("qa-survey-nps-0").click();
    await survey.page.getByTestId("qa-survey-rating-1").click();
    await survey.page.getByTestId("qa-survey-comment").fill("تعليق-نص-عربي");
    await survey.page.getByTestId("qa-survey-submit").click();
    await expect(survey.page.getByRole("heading", { name: /thank you|شكر/i })).toBeVisible({ timeout: 15_000 });

    // ⛔ التكرار يُرفض من الخادم — لا «شكر» ثانية لنفس الحاضر.
    const again = await openPlain(browser, `${PATHS.survey}?session=${sessionId}`, {
      id: attendeeId,
      name: "حاضر-الاستبيان",
    });
    await again.page.getByTestId("qa-survey-nps-10").click();
    await again.page.getByTestId("qa-survey-rating-5").click();
    await again.page.getByTestId("qa-survey-submit").click();
    await expect(again.page.getByTestId("qa-survey-error")).toBeVisible();
    await expect(again.page.getByRole("heading", { name: /thank you|شكر/i })).toBeHidden();

    await again.ctx.close();
    await survey.ctx.close();
    await attendee.ctx.close();
  } finally {
    await adminCtx.close();
  }
});

test("⛔ L4-5: استفتاء حيّ — النتائج مخفيّة حتى يضغط المشرف «أظهر النتائج»", async ({ browser }) => {
  const { ctx: adminCtx, page: admin, token } = await openAdmin(browser);
  await createAndActivateSession(admin, "poll-surface");
  const sessionId = await activeSessionId(admin, token);

  try {
    await admin.getByTestId("qa-poll-prompt").fill("سؤال الاستفتاء");
    await admin.getByTestId("qa-poll-option-input").nth(0).fill("الخيار الأول");
    await admin.getByTestId("qa-poll-option-input").nth(1).fill("الخيار الثاني");
    await admin.getByTestId("qa-poll-create").click();

const row = admin.locator('[data-testid="qa-admin-poll"]').first();
    await expect(row).toBeVisible();

    // ⛔ الترتيب مقصود: الحاضر يدخل **قبل** البدء. «الاستفتاء مُنشأٌ
    // وغير مُفعَّل» (`poll/route.ts` L102) حالةٌ لا يملكها أحد غير
    // الحاضر، و«لا تصويت على مغلق» أول ما يجب أن يُمنع.
    const attendee = await openPlain(browser, PATHS.attendee);
    await attendeeJoins(attendee.page, "حاضر-الاستفتاء");

    const poll = attendee.page.getByTestId("qa-poll").first();
    await expect(poll).toContainText("سؤال الاستفتاء");
    await expect(poll.getByTestId("qa-poll-option").first()).toBeDisabled();

    // البدء من اللوحة يُفعّل الخيارات على جهاز الحاضر بلا إعادة تحميل.
    await row.getByTestId("qa-poll-start").click();
    await expect(poll.getByTestId("qa-poll-option").first()).toBeEnabled();

    await poll.getByTestId("qa-poll-option").first().click();
    await expect(poll.getByTestId("qa-poll-option").first()).toBeDisabled();
    await expect(poll.getByTestId("qa-poll-option").first()).toHaveClass(/bg-red-600\/10/);
    await expect(poll.getByTestId("qa-poll-option").nth(1)).toBeEnabled();

    // ⛔ `showResults` يبدأ `false` (poll/route L103): لا نسب قبل إذن
    // المشرف. بدون هذا الفحص يمرّ الاختبار بنتيجة متسرّبة.
    await expect(poll).not.toContainText("%");

    await row.getByTestId("qa-poll-results").click();
    await expect(poll).toContainText("100%", { timeout: 15_000 });

    // التصدير عبر الزر — لا `window.open` ولا `?token=` في الـURL.
    const download = admin.waitForEvent("download", { timeout: 30_000 });
    await admin.getByTestId("qa-export-csv").click();
    expect((await download).suggestedFilename()).toBe(`qa-${sessionId}.csv`);
    await expect(admin.getByTestId("qa-export-error")).toBeHidden();
  } finally {
    await adminCtx.close();
  }
});

test("⛔ L4-6: إجابة مفتوحة — تُرفع للمتحدّث وحده، لا للمشروعور", async ({ browser }) => {
  const { ctx: adminCtx, page: admin, token } = await openAdmin(browser);
  await createAndActivateSession(admin, "answers-surface");

  const attendee = await openPlain(browser, PATHS.attendee);
  const speaker = await openPlain(browser, PATHS.speaker);
  const projector = await openPlain(browser, PATHS.projector);
  const Q = "سؤال يستدعي إجابة";
  const A = "إجابة-حرة-من-الحضور";

  try {
    await attendeeJoins(attendee.page, "حاضر-إجابة");
    await attendeeAsks(attendee.page, Q);
    await approve(admin, Q);

    await attendee.page.locator(`[data-testid="qa-question"]`, { hasText: Q }).getByTestId("qa-answer-open").click();
    const input = attendee.page.getByTestId("qa-answer-input").first();
    await expect(input).toBeVisible();
    await input.fill(A);
    await attendee.page.getByTestId("qa-answer-submit").first().click();

    // صندوق المشرف: تظهر بانتظار المراجعة.
    const inbox = admin.getByTestId("qa-answer-inbox");
    await expect(inbox).toContainText(A);

    // قبل الاعتماد: لا تظهر للمتحدّث.
    await expect(speaker.page.getByText(A)).toBeHidden();

    await inbox.getByTestId("qa-answer-approve").first().click();
    await expect(speaker.page.getByTestId("qa-speaker-answers")).toBeVisible({ timeout: 15_000 });
    await expect(speaker.page.getByText(A)).toBeVisible();

// ⛔ الإجابة المعتمدة تظهر لزاوية المتحدث، **لا** للشاشة الكبرى:
    // سطور من إجابات مفتوحة على جهاز القاعة قد تُقرأ من سؤال لم
    // يُقصد. المشروعور لا يعرضها إطلاقاً.
    await expect(projector.page.getByText(A)).toBeHidden();

    // ⛔ ولا السؤال نفسه: المشروعور لا «يتصفّح» الأسئلة، بل يعرض شريحة
    // يختارها المشرف. الاعتماد وحده لا يضع السؤال على الشاشة.
    await expect(projector.page.getByText(Q)).toBeHidden();
    await adminRow(admin, Q).getByTestId("qa-put-on-screen").first().click();
    await expect(projector.page.getByText(Q)).toBeVisible({ timeout: 15_000 });
    await expect(projector.page.getByText(A)).toBeHidden();

    // ⛔ الرفض على إجابة **أخرى** من حاضر ثانٍ: الاعتماد أخرج الأولى من
    // الصندوق، فلم يبقَ زرّ رفض — اختبار الرفض على المُعتمَد كان يمرّ
    // على فراغ.
    const B = "إجابة-حرة-من-حاضر-آخر";
    const second = await openPlain(browser, PATHS.attendee);
    await attendeeJoins(second.page, "حاضر-إجابة-٢");
    await second.page.locator('[data-testid="qa-question"]', { hasText: Q }).getByTestId("qa-answer-open").click();
    await second.page.getByTestId("qa-answer-input").first().fill(B);
    await second.page.getByTestId("qa-answer-submit").first().click();
    await expect(inbox).toContainText(B);

    await inbox.getByTestId("qa-answer-reject").first().click();
    // ⚠️ لا `inbox.not.toContainText`: آخر إجابة مرفوضة تُفرغ الصندوق
    // فتختفي الحاوية نفسها، فيفشل الفحص بـ«element not found» بدل
    // أن ينجح. الفحص على النصّ في اللوحة يغطّي الحالتين.
    await expect(admin.getByText(B)).toBeHidden();
    await expect(speaker.page.getByText(B)).toBeHidden();

    // ⛔ والرفض لا يُطهِر المعتمد: الأولى ما زالت زاوية المتحدث.
    await expect(speaker.page.getByText(A)).toBeVisible();

    await second.ctx.close();
  } finally {
    await projector.ctx.close();
    await speaker.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ L4-7: توكن ميت ⇒ اللوحة تسأل الدخول من جديد، لا صمت", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubTurnstile(page);
  await page.addInitScript(() => window.sessionStorage.setItem("tedx-admin-token", "not-a-real-token"));
  await page.goto(PATHS.admin);

  try {
    // النموذج يظهر مباشرةً لأن التوكن موجود لكن سيُرفض عند أول طلب.
    await page.getByTestId("qa-login-password").fill(ADMIN_PW);
    await page.getByTestId("qa-login-submit").click();

    // 401 ⇒ العودة لشاشة الدخول لا لوحة صامتة نصف فارغة.
    await expect(page.getByTestId("qa-login-submit")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("qa-session-title")).toBeHidden();
  } finally {
    await ctx.close();
  }
});
