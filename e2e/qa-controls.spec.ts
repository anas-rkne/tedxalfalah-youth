import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import creds from "../scripts/qa-test-credentials.json";

/**
 * الطبقة 6: **كل ضابط إداري متبقٍّ** — مُقادة من `scripts/qa-control-inventory.mjs`
 * لا من الذاكرة.
 *
 * 🎯 الجرد كشف ثلاثة أزرار لم يذكرها أحد: «حذف الجلسة» (إجراء مُتلِف!) و
 * «إيقاف الاستطلاع» و«إغلاق الاستبيان»، كلٌّ بلا `data-testid` فلا يمكن
 * اختباره آلياً أصلاً. أُضيفت المراسي، وهنا تُختبر.
 *
 * الطبقات السابقة غطّت **تدفّق الأسئلة**؛ هذه غطّي **الضوابط**: كل زر
 * تُضغط، وأثرها يُثبت على الطرف الآخر (لا على الشاشة وحدها).
 */

const ADMIN_PW = creds.adminPassword;

const PATHS = {
  admin: "/en/admin/live",
  attendee: "/en/live",
  speaker: "/en/live/speaker",
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

/** توكن الإدارة مع مسار الجذر baseURL مُلحَقاً. */
async function openAdmin(browser: Browser): Promise<{ ctx: BrowserContext; page: Page; token: string }> {
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
  return { ctx, page, token };
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

async function askAndApprove(attendee: Page, admin: Page, question: string): Promise<void> {
  await attendee.getByTestId("qa-ask-text").fill(question);
  await attendee.getByTestId("qa-ask-submit").click();
  await expect(sentMessage(attendee)).toBeVisible();
  await adminRow(admin, question).getByTestId("qa-approve").first().click();
}

/** ⛔ أسئلة متمايزة: كشف المكرر تشابه ضبابي `>= 0.75`. */
const QA = "كيف أبدأ تعلّم البرمجة؟";

test.describe.configure({ mode: "serial" });

test("⛔ C1: حذف الجلسة يزيلها من اللوحة ويُنهيها على أجهزة الحضور", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "to-delete");

  const attendee = await openPlain(browser, PATHS.attendee);
  const projector = await openPlain(browser, PATHS.projector);
  await joinAttendee(attendee.page, "حاضر-حذف");

  try {
    // الحضور والمشروعور يريان الجلسة قبل الحذف.
    await expect(projector.page.getByTestId("qa-screen-qr")).toBeVisible({ timeout: 20_000 });
    await expect(attendee.page.getByTestId("qa-ask-text")).toBeVisible();

    // ⛔ `confirm()` أصلي: بلا معالج الحوار يفتح الاختبار نافذة نظام
    // ويعلّق حتى المهلة. القبول صريح هنا — الإلغاء هو ما نختبره في C1b.
    admin.once("dialog", (d) => void d.accept());
    await admin.getByTestId("qa-session-delete").click();

    await expect(admin.getByRole("button", { name: new RegExp("to-delete") })).toHaveCount(0);

    // ⛔ الأثر على الطرف الآخر: لا جلسة ⇒ لا رمز QR ولا نموذج سؤال.
    await expect(projector.page.getByTestId("qa-screen-qr")).toHaveCount(0, { timeout: 20_000 });
    await expect(projector.page.getByTestId("qa-screen-waiting")).toBeVisible();
    await expect(attendee.page.getByTestId("qa-ask-text")).toHaveCount(0, { timeout: 20_000 });
  } finally {
    await projector.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ C1b: «حذف» مُلغى لا يفعل شيئاً — النافذة الملغاة تحمي من نقرة عابرة", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "cancel-delete");

  try {
    admin.once("dialog", (d) => void d.dismiss());
    await admin.getByTestId("qa-session-delete").click();

    // ⛔ الجلسة باقية. لولا هذا الفحص لكان «نقرة نعم» شرطاً لاكتشاف
    //    أن نافذة الحذف تعمل أصلاً.
    await expect(admin.getByRole("button", { name: new RegExp("cancel-delete") })).toBeVisible();
    await expect(admin.getByTestId("qa-session-delete")).toBeVisible();
  } finally {
    await adminCtx.close();
  }
});

test("⛔ C2: «تحديث» يعيد طلب الخادم بلا كسر اللوحة", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "refresh-ok");

  try {
    // ⛔ لا نكتفي بأن الزر قُبل: نطالب بطلب شبكة فعلي. زر يُطلق
    //    `setState` محلياً بلا نداء يُمرّ بلا أثر لو كان الرابط مقطوعاً.
    const seen: string[] = [];
    page_listen(admin, seen);

    await admin.getByTestId("qa-refresh").click();
    await expect.poll(() => seen.length, { timeout: 20_000 }).toBeGreaterThan(0);

    // واللوحة ما زالت سليمة بعد التحديث (لا شاشة خطأ، لا فقدان جلسة).
    await expect(admin.getByTestId("qa-session-title")).toBeVisible();
    await expect(admin.locator('[data-testid="qa-analytics-error"]')).toHaveCount(0);
  } finally {
    await adminCtx.close();
  }
});

function page_listen(page: Page, out: string[]): void {
  page.on("request", (r) => {
    if (r.url().includes("/api/qa/")) out.push(r.url());
  });
}

test("⛔ C3: وقت الانتهاء المعروض = `exp` من التوكن نفسه", async ({ browser }) => {
  const { ctx: adminCtx, page: admin, token } = await openAdmin(browser);

  try {
    // ⛔ نقارن الرقم المعروض بحمولة التوكن، لا بأنّ هناك نصاً. عنصر
    //    `qa-session-expiry` كان يُظهر أي وقت والمرور بلا خطأ.
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    expect(typeof payload.exp, "التوكن بلا `exp`").toBe("number");

    const expected = new Date(payload.exp * 1000).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    await expect(admin.getByTestId("qa-session-expiry")).toContainText(expected);
  } finally {
    await adminCtx.close();
  }
});

test("⛔ C4: «خروج» يمسح التوكن من المتصفح ويعيد بوابة الدخول", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "sign-out-ok");

  try {
    await admin.getByTestId("qa-sign-out").click();

    // ⛔ التوكن الممسح هو الضمان: البوابة قد تختفّي لسبب آخر (انتهاء
    //    التوكن) بينما يبقى الرمز في `sessionStorage` فيجلس خلف كل
    //    صفحة أخرى. نقرأ التخزين مباشرة.
    await expect(admin.getByTestId("qa-login-submit")).toBeVisible();
    await expect
      .poll(async () => await admin.evaluate(() => window.sessionStorage.getItem("tedx-admin-token")))
      .toBeNull();

    // ⛔ ولا تنعش اللوحة وحدها: تحديث الصفحة لا يعيد الجلسة.
    await admin.reload();
    await expect(admin.getByTestId("qa-login-submit")).toBeVisible();
    await expect(admin.getByTestId("qa-session-title")).toHaveCount(0);
  } finally {
    await adminCtx.close();
  }
});

test("⛔ C5: «تمييز» سؤال يغيّره على واجهة الحضور، ويُلغى بالنقر الثاني", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "feature-toggle");

  const attendee = await openPlain(browser, PATHS.attendee);
  try {
    await joinAttendee(attendee.page, "حاضر-تمييز");
    await askAndApprove(attendee.page, admin, QA);

    const row = adminRow(admin, QA);
    await row.getByTestId("qa-feature").first().click();

    // ⛔ الأثر على واجهة الحضور لا على اللوحة: شارة «مميّز» تظهر فوق
    //    السؤال عند الحاضر. زرٌ بلا أثر يمرّ بلا خطأ.
    const qCard = attendee.page.getByTestId("qa-question").filter({ hasText: QA }).first();
    await expect(qCard.getByTestId("qa-featured-badge")).toBeVisible({ timeout: 20_000 });

    // والنقر الثاني يرجع الحالة (زرٌ واحد يبدّل معناه).
    await row.getByTestId("qa-feature").first().click();
    await expect(qCard.getByTestId("qa-featured-badge")).toHaveCount(0, { timeout: 20_000 });
  } finally {
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ C6: «إخفاء من شاشة المتحدث» يُخفيه هناك ويبقيه للجمهور", async ({ browser }) => {
  const { ctx: adminCtx, page: admin } = await openAdmin(browser);
  await createAndActivateSession(admin, "speaker-visibility");

  const attendee = await openPlain(browser, PATHS.attendee);
  const speaker = await openPlain(browser, PATHS.speaker);
  try {
    await joinAttendee(attendee.page, "حاضر-متحدث");
    await askAndApprove(attendee.page, admin, QA);

const row = adminRow(admin, QA);
    await expect(speaker.page.getByText(QA)).toBeVisible({ timeout: 20_000 });

    await row.getByTestId("qa-toggle-speaker").first().click();

    // ⛔ الوجهان منفصلان: يختفي عن **المتحدث** ويبقى عند **الجمهور**.
    //    إخفاءٌ بلا أثر على أحد الطرفين اختبارٌ يمرّ بلا معنى.
    await expect(speaker.page.getByText(QA)).toHaveCount(0, { timeout: 20_000 });
    await expect(attendee.page.getByTestId("qa-question").filter({ hasText: QA }).first()).toBeVisible();

    // ثم يعود بالنقر الثاني.
    await row.getByTestId("qa-toggle-speaker").first().click();
    await expect(speaker.page.getByText(QA)).toBeVisible({ timeout: 20_000 });
  } finally {
    await speaker.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});

test("⛔ C7: استطلاع على الشاشة، ثم «إيقاف» يُسقطه ولا يُبطل الأصوات المسجّلة", async ({ browser }) => {
  const { ctx: adminCtx, page: admin, token: adminToken } = await openAdmin(browser);
  await createAndActivateSession(admin, "poll-lifecycle");

  const attendee = await openPlain(browser, PATHS.attendee);
  const projector = await openPlain(browser, PATHS.projector);
  try {
    await joinAttendee(attendee.page, "حاضر-استطلاع");

    // ⛔ خياران: استطلاع بمفرده يُنتج «٠ / ٠» غير مفيد، والاختبار
    //    الذي يمرّ على است/Askoption واحد يمرّ على أسوأ حالة.
    await admin.getByTestId("qa-poll-prompt").fill("أيّهما ألزوم؟");
    await admin.getByTestId("qa-poll-option-input").first().fill("الزراعة");
    await admin.getByTestId("qa-poll-option-input").nth(1).fill("إعادة التدوير");
    await admin.getByTestId("qa-poll-create").click();
    const pollRow = admin.getByTestId("qa-admin-poll").first();
    await expect(pollRow).toBeVisible({ timeout: 20_000 });

    await pollRow.getByTestId("qa-poll-start").click();
    await expect(attendee.page.getByTestId("qa-poll")).toBeVisible({ timeout: 20_000 });

    // ⛔ «على الشاشة» يُظهر نصّ الاستطلاع وخياراته على المسرح.
    //    قبل هذا الإصلاح كان الزر يبدو بلا أثر: لا `PollResults` (شرطها
    //    `wantsResults`) ولا غيره — فسقط إلى `rotateQuestion`/`HoldCard`.
    await pollRow.getByTestId("qa-poll-put-on-screen").click();
    const onStage = projector.page.getByTestId("qa-screen-poll");
    await expect(onStage).toBeVisible({ timeout: 20_000 });
    await expect(onStage).toContainText("الزراعة");
    // ⛔ بلا نسب قبل الإغلاق: النسب تُعلن ما صوّت له القاعة.
    await expect(onStage).not.toContainText("%");

    // تصويت حقيقي قبل الإيقاف — به يُختبر ما يبقى بعده.
    // ⛔ الخيار المُختار يُعلَّم بـ`border-red-600 bg-red-600/10` لا
    //    بالأخضر (تقدير ثم فشل): نطالب بصنف الاختيار نفسه.
    await attendee.page.getByTestId("qa-poll-option").first().click();
    await expect(attendee.page.getByTestId("qa-poll-option").first()).toHaveClass(/border-red-600/, {
      timeout: 20_000,
    });

    await pollRow.getByTestId("qa-poll-stop").click();

    /**
     * ⛔ «إيقاف» = **قفل التصويت + إعلان النتائج** في نداء واحد.
     *
     * تصحيحان بالقياس (`route.ts:116-118`):
     *   ١. توقّعتُ اختفاء البطاقة — لا: الواجهة ترسم **كل** الاستطلاعات
     *      (`polls.map`) لا النشطة فقط. الضمان هو تعطيل الخيارات.
     *   ②. توقّعتُ بقاء نصّ السؤال على المسرح — لا: `stop` يفرض
     *      `showResults = true`، فيحلّ محلّ النصّ **النتائج** فوراً.
     *      وهنا بالذات يقع الفحص: حذفُ السطر ١١٨ كان يُخفي النتائج
     *      إلى أن يضغط المشرف زرّها يدوياً.
     */
    await expect(attendee.page.getByTestId("qa-poll")).toHaveCount(1, { timeout: 20_000 });
    await expect(attendee.page.getByTestId("qa-poll-option").first()).toBeDisabled();
    await expect(attendee.page.getByTestId("qa-poll-option").nth(1)).toBeDisabled();

    const results = projector.page.getByTestId("qa-screen-poll-results");
    await expect(results).toBeVisible({ timeout: 20_000 });
    // ⛔ النسبة محسوبة من الصوت الذي سُجّل **قبل** الإيقاف: لم يُمحَ شيء.
    await expect(results).toContainText("100%");
    // ونصّ السؤال لم يبقَ على المسرح بعد إعلان النتائج.
    await expect(projector.page.getByTestId("qa-screen-poll")).toHaveCount(0);

    // زرّ النتائج يُخفيها بعرضها...
    await pollRow.getByTestId("qa-poll-results").click();
    await expect(results).toHaveCount(0, { timeout: 20_000 });
    // ...ويعيدها.
    await pollRow.getByTestId("qa-poll-results").click();
    await expect(results).toBeVisible({ timeout: 20_000 });

    /**
     * ⚠️ **قرار منتج مفتوح (F1)** — لا إصلاح تلقائي.
     *
     * «انتظار» **لا يُخفي** النتائج: الأولوية في `body` تجعل استطلاعاً
     * منتهياً بنتائج (`endedPoll`) يتقدّم على `hold`، فالزر يبدو بلا
     * أثر ما دامت النتائج منشورة. يُسقِطه فقط تثبيت شريحة أخرى.
     *
     * ⛔ نُثبّت السلوك **الحاضر** صراحةً بدل إصلاح مبادِر: لو صُحّح
     *    السلوك لاحقاً إلى «انتظار يُخفي»، يسقط هذا الفحص صراحةً.
     */
    await admin.getByTestId("qa-screen-hold").click();
    await expect(results).toBeVisible({ timeout: 20_000 });
    await expect(projector.page.getByTestId("qa-screen-hold")).toHaveCount(0);

    /**
     * ✅ **F1 (قرار المشرف: «تمسح فور بدء جلسة جديدة»)**.
     *
     * قبله كانت `showResults: true` تبقى على استطلاع الجلسة السابقة إلى
     * الأبد، فلو عادت لقطة قديمة (شبكة بطيئة/تبويب خامل) أو أُعيد فتح
     * الجلسة القديمة، بقيت نتائج جلسةٍ انتهت تُقرأ كأنها نتائج «الآن».
     */
    await createAndActivateSession(admin, "poll-session-two");
    // ⛔ المشروعور يعتمد اللقطة: النتائج تسقط فور انتهاء الجلسة.
    await expect(results).toHaveCount(0, { timeout: 20_000 });

    // ⛔ وبيانياً: `showResults` أُغلق، لكن **الأصوات نفسها لم تُمحَ** —
    //    الإغلاق للعرض لا حذف. (قراءة عبر API أدقّ من نصّ على الشاشة.)
    const adminData = await (
      await admin.request.get("/api/qa/admin/questions", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    ).json();
    const oldSession = adminData.sessions.find(
      (s: { id: string; title: string }) => s.title === "poll-lifecycle"
    );
    expect(oldSession, "الجلسة السابقة غير موجودة في ملف الإدارة").toBeTruthy();
    const storedPoll = oldSession.polls[0];
    expect(storedPoll.showResults, "نتائج الجلسة السابقة مُسحت للعرض").toBe(false);
    expect(storedPoll.tallies[0], "الصوت المسجَّل باقٍ").toBe(1);
    expect(storedPoll.tallies[1], "لم تُخترع أصوات").toBe(0);

    /**
     * ⛔ والمسح دائم: العودة إلى الجلسة القديمة لا تُحيي النتائج وحدها.
     *    نعيد التفعيل عبر المسار نفسه الذي يستدعيه الزر ثم نُحدّث اللوحة،
     *    فيعود اختيارها إلى الجلسة النشطة (وهو ما يفعله `pickDefaultSessionId`)
     *    بدل تقرير حالة اللوحة بأصابعنا.
     */
    const activateRes = await admin.request.post("/api/qa/admin/session", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { action: "activate", sessionId: oldSession.id },
    });
    expect(activateRes.ok(), `إعادة تفعيل بـ${activateRes.status()}`).toBeTruthy();
    await admin.reload();
    await expect(admin.getByTestId("qa-session-title")).toBeVisible({ timeout: 30_000 });
    await expect(results).toHaveCount(0, { timeout: 20_000 });
    // وزرّ «النتائج» يعيدها كما يريد — العودة متاحة لا مفقودة.
    const pollRowAgain = admin.getByTestId("qa-admin-poll").first();
    await expect(pollRowAgain).toBeVisible({ timeout: 30_000 });
    await pollRowAgain.getByTestId("qa-poll-results").click();
    await expect(results).toBeVisible({ timeout: 20_000 });
  } finally {
    await projector.ctx.close();
    await attendee.ctx.close();
    await adminCtx.close();
  }
});
