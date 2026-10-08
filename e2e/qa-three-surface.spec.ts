import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import creds from "../scripts/qa-test-credentials.json";

/**
 * الطبقة 3: متصفح حقيقي بثلاثة سياقات **متزامنة** على جلسة واحدة.
 *
 * 🎯 لماذا هذا الملف منفصل عن `e2e/qa-live.spec.ts`:
 * ذلك يختبر التدفّق الواحد في نافذة واحدة (context واحد)، فيمرّ كل مسار
 * بينما مسارات التفرّق بين الأسطح تبقى غير مُختبَرة. والعلة التي عالجناها
 * في الطبقتين 1 و2 — استقلال Audience عن Projector — لا يمكن أن تظهر في
 * صفحة واحدة أصلاً: الهاتف والشاشة يفترضان زميلاً. هنا ثلاثة سياقات
 * حقيقية تتحدث إلى الخادم نفسه في اللحظة نفسها، فنلاحظ ما لا يُلاحَظ.
 *
 * ⛔ ثلاثة سياقات = ثلاث جلسات مصادقة مستقلة (cookies وlocalStorage
 * منفصلة لكل سياق). هذا مقصود: زرع التوكن في سياق واحد لا يسرّب إلى
 * الباقي، لو سرّب لكان الاختبار يثبت شيئاً لا يحدث في القاعة.
 *
 * ⛔ كل الاختبارات `serial` وتشترك في جلسة نشطة واحدة (قاعدة «جلسة
 * واحدة» التي تحرسها C3). تشغيل اثنين متوازيين يجعل كلٌّ منهما يُطفئ
 * جلسة الآخر، فتُسقط الفشلُ اختباراً سليماً — أسوأ من الفشل الصريح.
 */

const ADMIN_PW = creds.adminPassword;

/** أسطح القاعة الثلاثة بمساراتها الفعلية في الـApp Router. */
const SURFACES = {
  admin: "/en/admin/live",
  projector: "/en/live/screen",
  attendee: "/en/live",
  speaker: "/en/live/speaker",
} as const;

type SurfaceName = keyof typeof SURFACES;

/**
 * ⛔ زرع `window.turnstile` قبل أي سكربت في الصفحة.
 *
 * بدونه تحمّل الواجهة سكربت Cloudflare الحقيقي، فيحاول الاتصال بـ
 * `challenges.cloudflare.com` من بيئة بلا واي فاي موثوق، فيتعطّل 8 ثوانٍ
 * ثم يعلن `onStalled` — أي يُقرأ «الواجهة مكسورة» بينما هي تنتظر شبكة.
 * و`whenTurnstileReady` يتخطى حقن السكربت كلياً إن وُجد `window.turnstile`
 * سلفاً، فلا يغادر المتصفح الجهاز.
 *
 * ونصدر الرمز المحجوز `qa-test-bypass` لا رمزاً وهمياً، فيمرّ الطلب على
 * نفس فرع `isTestTurnstileToken` في الخادم الذي يمرّ به فاحص الـAPI.
 */
async function stubTurnstile(page: Page): Promise<void> {
  await page.addInitScript((reserved: string) => {
    let n = 0;
    const widgets = new Map<string, (token: string) => void>();
    const rec = (window as unknown as { __qaTurn?: Record<string, unknown> }).__qaTurn ?? {};
    (window as unknown as { __qaTurn?: Record<string, unknown> }).__qaTurn = rec;
    (window as unknown as { turnstile: unknown }).turnstile = {
      render(_el: HTMLElement, opts: { callback: (token: string) => void }) {
        rec.render = Number(rec.render ?? 0) + 1;
        const id = `qa${++n}`;
        widgets.set(id, opts.callback);
        try {
          opts.callback(reserved);
          rec.callback = Number(rec.callback ?? 0) + 1;
        } catch (err) {
          rec.callbackError = String(err);
        }
        return id;
      },
      reset(id?: string) {
        const key = id ?? [...widgets.keys()].pop() ?? "";
        widgets.get(key)?.(reserved);
      },
      remove(id: string) {
        widgets.delete(id);
      },
    };
  }, creds.turnstileToken);
}

type Surface = { name: SurfaceName; context: BrowserContext; page: Page };

/**
 * يفتح سطحاً في سياق مستقل ويحقن الاعتماد المناسب له.
 *
 * ⛔ الحضور يدخل بلا توكن أصلاً — هذا هو ادّعاء الاختبار: أن مسار
 * الحاضر مفتوح. ولو زرعنا فيه توكن إدارة لاختفى أهم ما نختبره: أن
 * الحاضر لا يستطيع التصرّف في الأسئلة.
 */
async function openSurface(
  browser: Browser,
  name: SurfaceName,
  adminToken: string
): Promise<Surface> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await stubTurnstile(page);

  if (name === "admin") {
    // نفس ما يفعله النموذج بعد دخول ناجح: اللوحة تقرأ التوكن من
    // sessionStorage. كل طلب يمرّ بـrequireAdmin على الخادم، فزرع التوكن
    // لا يتجاوز الحماية — لو لم يكن صالحاً لسقط كل اختبار فوراً.
    await page.addInitScript((t: string) => {
      window.sessionStorage.setItem("tedx-admin-token", t);
    }, adminToken);
  }

  await page.goto(SURFACES[name]);
  return { name, context, page };
}

async function closeAll(surfaces: Surface[]): Promise<void> {
  for (const s of surfaces) {
    await s.context.close();
  }
}

/** توكن إدارة عبر API — أسرع من النموذج، ونفس طبقة الحماية. */
async function adminToken(page: Page): Promise<string> {
  const res = await page.request.post("/api/admin/login", {
    data: { username: "admin", password: ADMIN_PW },
    timeout: 90_000,
  });
  expect(res.ok(), `دخول الإدارة فشل بـ${res.status()}`).toBeTruthy();
  return (await res.json()).token as string;
}

/* ── مساعدات على أسطح العميل ── */

/** إنشاء جلسة نشطة وتفعيلها وتجاوز «يقبل الأسئلة» — كلها أزرار حقيقية. */
async function startSessionThroughUi(admin: Page, title: string): Promise<void> {
  await expect(admin.getByTestId("qa-session-title")).toBeVisible();
  await admin.getByTestId("qa-session-title").fill(title);
  await admin.getByTestId("qa-session-create").click();

  const chip = admin.getByRole("button", { name: new RegExp(title) }).first();
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(chip).toHaveClass(/bg-tedx-red/);

  await admin.getByTestId("qa-session-activate").click();
  await expect(admin.getByTestId("qa-session-activate")).toBeHidden();

  // ⛔ زر «يقبل الأسئلة» — بدونه يرفض `join` بـ409.
  //
  // ⚠️ لم يكن لهذا الزر `data-testid` رغم أن كل أزرار اللوحة المجاورة
  // تحمل واحداً، فالاختبار كان مضطراً لمحدِّد بالنص («Open questions»)،
  // وهو ينهار عند أي تعريب للواجهة دون أن ينهار المنتج. أُضيف المعرّف
  // مع `aria-pressed` ليقرأ الاختبار حالةً مقروءة لا نصاً متغيّراً.
  //
  // ⛔ ولا نفترض حالةً ابتدائية: `create` يضع `acceptingQuestions: false`
  // لكن `activate` **يفرضها `true`** (session/route.ts:109). فنقرأ الحالة
  // ونضغط فقط إن كانت مغلقة — هكذا يبقى المساعد صحيحاً أيّاً كان
  // الافتراضي، بدل أن يُسقط كل اختبار إن تغيّر ذلك لاحقاً.
  const accepting = admin.getByTestId("qa-session-accepting");
  await expect(accepting).toBeVisible();
  if ((await accepting.getAttribute("aria-pressed")) !== "true") {
    await accepting.click();
  }
  // ⛔ toHaveAttribute takes no message: its third argument is options.
  // Passing a message there makes TypeScript reject the whole build.
  await expect(accepting).toHaveAttribute("aria-pressed", "true");
  // ونتأكد أن الحالة المقروءة هي ما تعكسه الواجهة فعلاً: زرّ «إغلاق».
  await expect(accepting).toHaveText(/Close questions/i);
}

/** صفّ السؤال في اللوحة حسب نصّه. */
function rowOf(admin: Page, text: string) {
  return admin.locator('[data-testid="qa-question-row"]', { hasText: text });
}

/**
 * الحاضر ينضم عبر النموذج — لا عبر API.
 *
 * ⛔ `toHaveValue` هنا ليس تحفّظاً. حقل الاسم **مضبوط** (controlled)،
 * والصفحة تُرسم قبل أن يكتمل الهيدراتين: فتكتب في الـDOM، ثم يعيد أول
 * `setState` (دورة الاستطلاع كل 4 ثوانٍ) كتابة القيمة الحقيقية `""` فوق
 * ما كتبتَه. النتيجة انضمام مرفوض بـ"Please enter your name" يُقرأ عطل
 * نموذج بينما الخادم والواجهة سليمان. تأكيد القيمة بعد الكتابة هو ما
 * يحوّل ذلك من كتابة أعمى إلى قياسٍ لما نظنّ أننا نقيسه.
 */
async function attendeeJoins(attendee: Page, name: string): Promise<void> {
  const nameField = attendee.getByTestId("qa-join-name");
  await expect(nameField).toBeVisible();
  await nameField.fill(name);
  await expect(nameField).toHaveValue(name);
  await attendee.getByTestId("qa-join-submit").click();
}

/** الحاضر ينضم ثم يُسأل سؤالاً — عبر النموذج، لا عبر API. */
async function attendeeAsks(attendee: Page, text: string): Promise<void> {
  await attendeeJoins(attendee, "حاضر-الاختبار");

  const input = attendee.getByTestId("qa-ask-text");
  await expect(input).toBeVisible();
  await input.fill(text);
  await expect(input).toHaveValue(text);
  await attendee.getByTestId("qa-ask-submit").click();
}

test.describe.configure({ mode: "serial" });

test("⛔ T1: ثلاث أسطح على جلسة واحدة — الحلقة كاملة من الواجهة", async ({ browser }) => {
  const bootstrap = await browser.newContext();
  const bootPage = await bootstrap.newPage();
  const token = await adminToken(bootPage);
  await bootstrap.close();

  const admin = await openSurface(browser, "admin", token);
  const projector = await openSurface(browser, "projector", token);
  const attendee = await openSurface(browser, "attendee", token);

  try {
    // 1) المشرف ينشئ الجلسة ويفعّلها من اللوحة.
    await startSessionThroughUi(admin.page, "ثلاثة أسطح");

    // 2) الحاضر على هاتفه يرى جلسة نشطة ويقبل المشاركة — لا có كلمة مرور.
    await expect(attendee.page.getByTestId("qa-no-session")).toBeHidden();

    // 3) يسأل سؤالاً فيظهر **فوراً** في لوحة المشرف بلا إعادة تحميل.
    const Q = "كيف نطوّر ثقافة العطاء في مدارسنا؟";
    await attendeeAsks(attendee.page, Q);
    await expect(rowOf(admin.page, Q)).toBeVisible();

    // 4) المشرف يعتمد، فيصل السؤال لشاشة القاعة الكبرى.
    await rowOf(admin.page, Q).getByTestId("qa-approve").click();
    await expect(rowOf(admin.page, Q).getByTestId("qa-put-on-screen")).toBeVisible();

    // 5) المشروعور يعرضه. ⛔ بلا `qa-screen-hold`: الشاشة في الوضع
    // اليدوي افتراضياً، والاعتماد وحده لا يملأها — التثبيت هو ما يملؤها.
    await rowOf(admin.page, Q).getByTestId("qa-put-on-screen").click();
    await expect(projector.page.getByTestId("qa-screen-hold")).toBeHidden();
    await expect(projector.page.getByTestId("qa-screen-wordcloud")).toBeHidden();
    await expect(projector.page.locator("body")).toContainText(Q.slice(0, 18));

    // 6) والأهم: السؤال المعتمد يصل **هاتف الحاضر** أيضاً.
    await expect(attendee.page.getByTestId("qa-question")).toContainText(Q.slice(0, 18));
  } finally {
    await closeAll([admin, projector, attendee]);
  }
});

test("⛔ T2: إخفاء Audience في اللوحة يُسقطه من الهاتف ولا يمسّ الشاشة", async ({ browser }) => {
  const bootstrap = await browser.newContext();
  const token = await adminToken(await bootstrap.newPage());
  await bootstrap.close();

  const admin = await openSurface(browser, "admin", token);
  const projector = await openSurface(browser, "projector", token);
  const attendee = await openSurface(browser, "attendee", token);

  try {
    await startSessionThroughUi(admin.page, "استقلال الجمهور");
    await attendeeAsks(attendee.page, "سؤال سنُخفيه عن الجمهور فقط");
    const Q = "سؤال سنُخفيه عن الجمهور فقط";
    await rowOf(admin.page, Q).getByTestId("qa-approve").click();
    await rowOf(admin.page, Q).getByTestId("qa-put-on-screen").click();

    // الحالة الأولى: مرئي على الشاشة **و** على الهاتف.
    await expect(projector.page.locator("body")).toContainText(Q.slice(0, 18));
    await expect(attendee.page.getByTestId("qa-question")).toContainText(Q.slice(0, 18));

    // ⛔ زر الإخفاء: شاشة كبيرة أمام مئات، ولا يظهر على هاتف الحاضر.
    await rowOf(admin.page, Q).getByTestId("qa-toggle-audience").click();

    // ⛔ جوهر الاختبار: أن يبقى على الشاشة. لو سقط معها لكان التسلسل
    // قد نجح بخطأ واحد مشترك (اسم حقل واحد لا اثنين)، فيُقرأ نجاحاً.
    await expect(projector.page.locator("body")).toContainText(Q.slice(0, 18));
    await expect(attendee.page.getByTestId("qa-question")).toHaveCount(0);

    // والعكس: إظهاره للجمهور يُعيده للهاتف دون أن يمسّ الشاشة.
    await rowOf(admin.page, Q).getByTestId("qa-toggle-audience").click();
    await expect(attendee.page.getByTestId("qa-question")).toContainText(Q.slice(0, 18));
    await expect(projector.page.locator("body")).toContainText(Q.slice(0, 18));
  } finally {
    await closeAll([admin, projector, attendee]);
  }
});

test("⛔ T3: سؤال للمشروعور وحده لا يصل هاتف الحاضر أبداً", async ({ browser }) => {
  const bootstrap = await browser.newContext();
  const token = await adminToken(await bootstrap.newPage());
  await bootstrap.close();

  const admin = await openSurface(browser, "admin", token);
  const projector = await openSurface(browser, "projector", token);
  const attendee = await openSurface(browser, "attendee", token);

  try {
    await startSessionThroughUi(admin.page, "مشروعور فقط");
    const Q = "سؤال للشاشة الكبرى وحدها";
    await attendeeAsks(attendee.page, Q);
    await rowOf(admin.page, Q).getByTestId("qa-approve").click();

    // مبدئياً السؤال على الهاتف لسبب وجيه...
    await expect(attendee.page.getByTestId("qa-question")).toContainText(Q.slice(0, 18));

    // ... ثم نُخفيه عن الجمهور ونثبّته على الشاشة.
    await rowOf(admin.page, Q).getByTestId("qa-toggle-audience").click();
    await rowOf(admin.page, Q).getByTestId("qa-put-on-screen").click();

    await expect(projector.page.getByTestId("qa-screen-hold")).toBeHidden();
    await expect(projector.page.locator("body")).toContainText(Q.slice(0, 18));
    await expect(attendee.page.getByTestId("qa-question")).toHaveCount(0);
  } finally {
    await closeAll([admin, projector, attendee]);
  }
});

test("⛔ T4: تعليم السؤال «مُجاب» يُسقطه من الشاشة الكبرى", async ({ browser }) => {
  const bootstrap = await browser.newContext();
  const token = await adminToken(await bootstrap.newPage());
  await bootstrap.close();

  const admin = await openSurface(browser, "admin", token);
  const projector = await openSurface(browser, "projector", token);
  const attendee = await openSurface(browser, "attendee", token);

  try {
    await startSessionThroughUi(admin.page, "علامة الإجابة");
    const Q = "سؤال سنجيب عنه ثم نخفيه";
    await attendeeAsks(attendee.page, Q);
    await rowOf(admin.page, Q).getByTestId("qa-approve").click();
    await rowOf(admin.page, Q).getByTestId("qa-put-on-screen").click();
    await expect(projector.page.locator("body")).toContainText(Q.slice(0, 18));

    await rowOf(admin.page, Q).getByTestId("qa-answer").click();

    // ⛔ الملاحظة على الشاشة هي `hold` — لا يختفي العنصر من الصفحة، بل
    // تعود الشريحة إلى состоя المحايدة. من يفترض اختفاءه يقرأ فشلاً.
    await expect(projector.page.getByTestId("qa-screen-hold")).toBeVisible();
    await expect(projector.page.locator("body")).not.toContainText(Q.slice(0, 18));
  } finally {
    await closeAll([admin, projector, attendee]);
  }
});

test("⛔ T5: تفعيل جلسة جديدة يقلب ما يراه الحاضر والشاشة بلا إعادة تحميل", async ({
  browser,
}) => {
  const bootstrap = await browser.newContext();
  const token = await adminToken(await bootstrap.newPage());
  await bootstrap.close();

  const admin = await openSurface(browser, "admin", token);
  const projector = await openSurface(browser, "projector", token);
  const attendee = await openSurface(browser, "attendee", token);

  try {
    await startSessionThroughUi(admin.page, "الجلسة الأولى");
    const Q = "سؤال يخص الجلسة الأولى";
    await attendeeAsks(attendee.page, Q);
    await rowOf(admin.page, Q).getByTestId("qa-approve").click();
    await rowOf(admin.page, Q).getByTestId("qa-put-on-screen").click();
    await expect(projector.page.locator("body")).toContainText(Q.slice(0, 18));

    // جلسة ثانية تُنشأ وتُفعَّل: القاعدة «جلسة واحدة نشطة» تُطفئ الأولى.
    await startSessionThroughUi(admin.page, "الجلسة الثانية");

    // ⛔ المواضع أولاً: لا يُفترض أن يبقى السؤال معروضاً على الشاشة
    // الكبرى بعد تبديل الجلسة — أسئلة جلسة أخرى ليست أسئلة هذه.
    await expect(projector.page.locator("body")).not.toContainText(Q.slice(0, 18));

    // والحاضر: أسئلته المعلّقة تخصّ الجلسة الأولى، فلا تُعرض في الثانية.
    // نتحقق من الحالة بأقل التزامٍ ممكن: السؤال اختفى من هاتفه.
    await expect(attendee.page.getByTestId("qa-question")).toHaveCount(0);
  } finally {
    await closeAll([admin, projector, attendee]);
  }
});

test("⛔ T6: الرفض يزيل السؤال من الشاشة والهاتف بلا إعادة تحميل", async ({ browser }) => {
  const bootstrap = await browser.newContext();
  const token = await adminToken(await bootstrap.newPage());
  await bootstrap.close();

  const admin = await openSurface(browser, "admin", token);
  const projector = await openSurface(browser, "projector", token);
  const attendee = await openSurface(browser, "attendee", token);

  try {
    await startSessionThroughUi(admin.page, "رفض");
    const Q = "سؤال سنرفضه";
    await attendeeAsks(attendee.page, Q);
    await rowOf(admin.page, Q).getByTestId("qa-approve").click();
    await rowOf(admin.page, Q).getByTestId("qa-put-on-screen").click();
    await expect(projector.page.locator("body")).toContainText(Q.slice(0, 18));
    await expect(attendee.page.getByTestId("qa-question")).toContainText(Q.slice(0, 18));

    await rowOf(admin.page, Q).getByTestId("qa-reject").click();

    // ⛔ بلا `page.reload()` في كل تأكيد: الغرضWhole قياس أن الحدث الحيّ
    // ⛔ بلا page.reload() في كل تأكيد: الغرض قياس أن التحديث الحيّ
    // (SSE) يصل فعلاً. إعادة التحميل تُخفي انقطاع البثّ وتجعله يبدو سليماً.
    await expect(projector.page.locator("body")).not.toContainText(Q.slice(0, 18));
  } finally {
    await closeAll([admin, projector, attendee]);
  }
});

test("⛔ T7: مسار أداة Turnstile يعمل ويُرسل الرمز فعلاً", async ({ browser }) => {
  const bootstrap = await browser.newContext();
  const token = await adminToken(await bootstrap.newPage());
  await bootstrap.close();

  const admin = await openSurface(browser, "admin", token);
  const attendee = await openSurface(browser, "attendee", token);

  try {
    await startSessionThroughUi(admin.page, "verify path");

    // The proof that a token arrived is the ABSENCE of the stall notice.
    //
    // WARNING: toBeEnabled() proves nothing here. The button is enabled in
    // two very different cases: a token arrived, OR the widget gave up
    // after 8s and onStalled deliberately re-enabled it so an attendee is
    // never locked out forever. Asserting on the enabled state alone would
    // pass with no bot verification at all - the worst possible outcome
    // for a test whose whole subject is verification.
    const stalled = attendee.page.getByTestId("qa-verify-stalled");
    await expect(stalled).toBeHidden();
    // Wait past the 8s stall window: a late token would raise the notice,
    // and that gap is the difference between "arrived" and "will arrive".
    await attendee.page.waitForTimeout(9_000);
    await expect(stalled).toBeHidden();

    await attendeeJoins(attendee.page, "verified-attendee");

    // Stronger than the enabled state: the question field appeared, so
    // join succeeded ON THE SERVER with its token. A purely local success
    // proves nothing here.
    await expect(attendee.page.getByTestId("qa-ask-text")).toBeVisible();
  } finally {
    await closeAll([admin, attendee]);
  }
});
