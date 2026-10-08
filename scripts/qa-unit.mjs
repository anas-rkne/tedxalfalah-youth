/**
 * اختبارات وحدة (L1) لمكتبة Q&A — بلا خادم وبلا شبكة.
 *
 * تغطّي الطبقة التي لا يلتقطها TypeScript ولا ESLint: الإسقاط العام
 * (`buildPublicSnapshot`)، وتطبيع البيانات القديمة، وحساب `meta`، والتحقق من
 * هويّة الحضور. تكمّل `scripts/qa-suite.mjs` (تكامل عبر HTTP) و
 * `e2e/qa-live.spec.ts` (متصفح).
 *
 * ملاحظة: Node يزيل أنواع TypeScript عند الاستيراد (>= 22.6)، وكل وحدات
 * `src/lib/qa/*` تستورد بمسارات نسبية فقط — لذلك يعمل هذا الملف بلا خطوة بناء.
 *
 * التشغيل:  node scripts/qa-unit.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

/**
 * مصغّر الاستيراد: شيفرة المشروع تستورد بمسارات نسبية بلا امتداد
 * (`./service` ← `service.ts`) وهو ما يدعمه مُجمِّع Next، لكنه يرفضه محلّل ESM
 * في Node. نضيف امتداد `.ts` تلقائياً فيفحص نفس الملفات التي يفحصها البناء —
 * دون step ترجمة إضافية.
 *
 * كما نُترجم بادئة `@/` إلى `src/` (نفس ما يفعله `tsconfig.json`). بدونها لا
 * يمكن استيراد `admin-auth.ts` لأنه يستورد `@/lib/jwt`، أي استحالة اختبار
 * سلسلة المصادقة تنفيذياً والاكتفاء بفحص النص — وهو أسوأ اختبار ممكن هنا.
 */
const SRC_ROOT = fileURLToPath(new URL("../src/", import.meta.url));
const NEXT_SERVER_JS = fileURLToPath(
  new URL("../node_modules/next/server.js", import.meta.url)
);

registerHooks({
  resolve(specifier, context, nextResolve) {
    // ⚠️ `next/server` له ملف `server.js` لكن لا entry في `exports`، فيرفضه
    // محلّل ESM. نوجّهه إلى الملف مباشرة. هذا لتحتIY الاختبارات فقط — لا
    // نلمس شيفرة الإنتاج، وNext نفسه يحلّه أثناء البناء.
    if (specifier === "next/server") {
      return nextResolve(pathToFileURL(NEXT_SERVER_JS).href, context);
    }
    // `@/lib/jwt` ← مسار مطلق داخل src/، و Next يستعمله بلا امتداد.
    if (specifier.startsWith("@/")) {
      const base = path.join(SRC_ROOT, specifier.slice(2));
      let lastErr;
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        try {
          return nextResolve(pathToFileURL(base + ext).href, context);
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr;
    }
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
        for (const ext of [".ts", "/index.ts"]) {
          try {
            return nextResolve(specifier + ext, context);
          } catch {
            /* نجرّب الامتداد التالي */
          }
        }
      }
      throw err;
    }
  },
});

const { buildPublicSnapshot, isQaView } = await import("../src/lib/qa/public-view.ts");
const {
  normalizeData,
  recomputeMeta,
  findAttendee,
  attendeeCountOf,
  getActiveSession,
  newId,
  normalizeScreen,
  defaultScreenState,
  screenEligibleQuestions,
  orderForScreen,
  nextScreenSlide,
  reconcileScreenSlide,
  applyVisibilityChange,
  countAnswersBy,
  upsertAnswer,
  MAX_ANSWERS_PER_ATTENDEE,
  normalizeArabic,
  tokenizeArabic,
  calculateWordFrequency,
  computeFontSizes,
  layoutSpiral,
} = await import("../src/lib/qa/service.ts");

let passed = 0;
const failures = [];

/**
 * يزيل تعليقات JS/TS من مقطع قبل فحص أسماء الحقول.
 *
 * ⚠️ لماذا؟ توثيقنا العربي يذكر أسماء الحقول المهمّلة عمداً («كان يقرأ
 * `showOnLive`») لتشرح سبب القرار. الفحص على النص الخام يقرأ تلك الوثائق
 * كاعتمادٍ زائد فيفشل اختباراً صحيحاً — أو الأسوأ: يمرّ اختباراً خاطئاً
 * لأن الوثيقة صُنفت كاعتماد.
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function test(name, fn) {
  // ⛔ حاجز ضد الفئة نفسها من الخطأ: `test` متزامنة، فاستخدامها مع دالة
  // `async` يجعلها تُحسب ناجحة قبل أوّل `await` داخلها، ويرفض وعدها
  // لاحقاً كـunhandled rejection فيقتل العملية بدل الإبلاغ. النتيجة عدّاد
  // نجاح كاذب — أسوأ من غياب الاختبار. الحل الصحيح هو `await testAsync`.
  if (fn.constructor.name === "AsyncFunction") {
    failures.push({
      name,
      err: new Error(
        "دالة غير متزامنة في test() — استخدم await testAsync(...) بدلها"
      ),
    });
    console.log(`  FAIL  ${name}`);
    return;
  }
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failures.push({ name, err });
    console.log(`  FAIL  ${name}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failures.push({ name, err });
    console.log(`  FAIL  ${name}`);
  }
}

const session = (over = {}) => ({
  id: "sess_1",
  title: "اختبار",
  titleAr: "اختبار",
  active: true,
  acceptingQuestions: true,
  speakerEnabled: true,
  questions: [],
  polls: [],
  attendees: [],
  createdAt: new Date(0).toISOString(),
  ...over,
});

const data = (over = {}) => ({
  version: 1,
  sessions: [session()],
  settings: { speakerEnabled: true },
  meta: { totalQuestions: 0, totalVotes: 0, totalAttendees: 0 },
  ...over,
});

console.log("\n── 1) الإسقاط العام: لا تسريب لأسئلة غير معتمدة ──────────────");

test("F5: myQuestions/myAnswers تُبني لصاحبها فقط (لا تسريب بين الحضور)", () => {
  const snap = buildPublicSnapshot(
    data({
      sessions: [
        session({
          attendees: [
            { id: "att_1", name: "سائل", joinedAt: "1" },
            { id: "att_2", name: "آخر", joinedAt: "1" },
          ],
          questions: [
            {
              id: "q1",
              text: "سؤالي",
              author: "سائل",
              status: "rejected",
              votes: 0,
              createdAt: "1",
              attendeeId: "att_1",
              answers: [
                {
                  id: "a1",
                  questionId: "q1",
                  attendeeId: "att_1",
                  author: "سائل",
                  text: "إجابتي المرفوضة",
                  status: "rejected",
                  createdAt: "1",
                },
                {
                  id: "a2",
                  questionId: "q1",
                  attendeeId: "att_2",
                  author: "آخر",
                  text: "إجابة غيري",
                  status: "approved",
                  createdAt: "1",
                },
              ],
            },
          ],
        }),
      ],
    }),
    "audience",
    "att_1"
  );
  // ⛔ الحالة تصل رغم أن السؤال مرفوض (وهو الفجوة نفسها: الرفض كان صامتاً).
  assert.deepEqual(snap.myQuestions, [
    { id: "q1", status: "rejected", text: "سؤالي" },
  ]);
  // ⛔ إجابة غيري (att_2) لا تتسرّب أبداً — حتى لو كانت معتمدة ومنشورة.
  assert.deepEqual(snap.myAnswers, [
    { id: "a1", questionId: "q1", status: "rejected", text: "إجابتي المرفوضة" },
  ]);
});

test("F5: معرّف غريب ⇒ [] (لا 404، ولا تمييز بين الغائب والمخترع)", () => {
  const snap = buildPublicSnapshot(
    data({
      sessions: [
        session({
          attendees: [{ id: "att_1", name: "سائل", joinedAt: "1" }],
          questions: [
            {
              id: "q1",
              text: "سؤالي",
              author: "سائل",
              status: "approved",
              votes: 0,
              createdAt: "1",
              attendeeId: "att_1",
            },
          ],
        }),
      ],
    }),
    "audience",
    "att_ghost"
  );
  assert.deepEqual(snap.myQuestions, []);
  assert.deepEqual(snap.myAnswers, []);
});

test("F5: بلا معرّف ⇒ الحقل غائب تماماً (لا []) — المشروعور لا يبني «لم تُقبل»", () => {
  const snap = buildPublicSnapshot(
    data({
      sessions: [
        session({
          attendees: [{ id: "att_1", name: "سائل", joinedAt: "1" }],
          questions: [
            {
              id: "q1",
              text: "سؤالي",
              author: "سائل",
              status: "approved",
              votes: 0,
              createdAt: "1",
              attendeeId: "att_1",
            },
          ],
        }),
      ],
    }),
    "audience"
  );
  // ⛔ `undefined` لا `[]`:غيابه إشارة «لست حاضراً» لا «رُفض كل شيء».
  assert.equal(snap.myQuestions, undefined);
  assert.equal(snap.myAnswers, undefined);
});

test("F5: لا حقل owner في اللقطات العامة (attendeeId يبقى في الخادم فقط)", () => {
  const snap = buildPublicSnapshot(
    data({
      sessions: [
        session({
          attendees: [{ id: "att_1", name: "سائل", joinedAt: "1" }],
          questions: [
            {
              id: "q1",
              text: "سؤالي",
              author: "سائل",
              status: "approved",
              votes: 0,
              createdAt: "1",
              attendeeId: "att_1",
              answers: [
                {
                  id: "a1",
                  questionId: "q1",
                  attendeeId: "att_1",
                  author: "سائل",
                  text: "إجابتي",
                  status: "approved",
                  createdAt: "1",
                },
              ],
            },
          ],
        }),
      ],
    }),
    "audience",
    "att_1"
  );
  // ⛔ المعرّف سرّ إسناد: يظهر في `myX` المقيّدة فقط، لا في `questions`.
  for (const q of snap.questions) {
    assert.equal(q.attendeeId, undefined);
    for (const a of q.answers ?? []) assert.equal(a.attendeeId, undefined);
  }
});

test("buildPublicSnapshot يتجاهل pending و rejected", () => {
  const snap = buildPublicSnapshot(
    data({
      sessions: [
        session({
          questions: [
            { id: "q1", text: "معتمدة", author: "أ", status: "approved", votes: 3, createdAt: "1" },
            { id: "q2", text: "قيد المراجعة", author: "ب", status: "pending", votes: 9, createdAt: "2" },
            { id: "q3", text: "مرفوضة", author: "ج", status: "rejected", votes: 5, createdAt: "3" },
          ],
        }),
      ],
    }),
    "live"
  );
  assert.deepEqual(snap.questions.map((q) => q.id), ["q1"]);
});

test("الإسقاط لا يحمل أي حقل إداري أو معرّف حضور", () => {
  const snap = buildPublicSnapshot(
    data({
      sessions: [
        session({
          attendees: [{ id: "atn_secret", name: "مشارك", joinedAt: "1" }],
          questions: [
            {
              id: "q1",
              text: "سؤال",
              author: "أ",
              status: "approved",
              votes: 1,
              featured: true,
              answered: true,
              showOnLive: true,
              showOnSpeaker: false,
              createdAt: "1",
            },
          ],
        }),
      ],
    }),
    "live"
  );
  const serialized = JSON.stringify(snap);
  assert.ok(!serialized.includes("atn_secret"), "تسريب معرّف الحضور");
  assert.ok(!serialized.includes("attendees"), "تسريب سجل الحضور");
  assert.ok(!serialized.includes("status"), "تسريب حالة السؤال");
  assert.ok(!serialized.includes("approvedAt"), "تسريب وقت الاعتماد");
  assert.equal(snap.session.attendeeCount, 1, "عدد الحاضرين يكفي دون كشف هوياتهم");
});

test("visibility تختلف بين شاشتَي للجمهور والمتحدث", () => {
  const raw = data({
    sessions: [
      session({
        questions: [
          {
            id: "q1",
            text: "مخفي عن المتحدث",
            author: "أ",
            status: "approved",
            votes: 0,
            showOnSpeaker: false,
            showOnLive: true,
            createdAt: "1",
          },
        ],
      }),
    ],
  });
  assert.equal(buildPublicSnapshot(raw, "live").questions[0].visible, true);
  assert.equal(buildPublicSnapshot(raw, "speaker").questions[0].visible, false);
});

test("الترتيب: المميّز أولاً ثم الأعلى تصويتاً", () => {
  const snap = buildPublicSnapshot(
    data({
      sessions: [
        session({
          questions: [
            { id: "low", text: "أ", author: "x", status: "approved", votes: 1, createdAt: "1" },
            { id: "high", text: "ب", author: "x", status: "approved", votes: 7, createdAt: "2" },
            { id: "star", text: "ج", author: "x", status: "approved", votes: 2, featured: true, createdAt: "3" },
          ],
        }),
      ],
    }),
    "live"
  );
  assert.deepEqual(snap.questions.map((q) => q.id), ["star", "high", "low"]);
});

test("لا جلسة نشطة = لقطة فارغة بلا أخطاء", () => {
  const snap = buildPublicSnapshot(data({ sessions: [] }), "live");
  assert.equal(snap.active, false);
  assert.equal(snap.session, null);
  assert.deepEqual(snap.questions, []);
  assert.deepEqual(snap.polls, []);
});

test("buildPublicSnapshot يتحمّل بيانات قديمة تالفة (null)", () => {
  const snap = buildPublicSnapshot(null, "speaker");
  assert.equal(snap.active, false);
});

test("نتائج الاستفتاء محجوبة أثناء التصويت وتظهر بعد الإيقاف", () => {
  const raw = data({
    sessions: [
      session({
        polls: [
          {
            id: "p1",
            prompt: "سؤال",
            options: ["أ", "ب"],
            optionsAr: ["أ", "ب"],
            active: true,
            showResults: false,
            tallies: [3, 2],
            createdAt: "1",
          },
        ],
      }),
    ],
  });
  const live = buildPublicSnapshot(raw, "live").polls[0];
  assert.equal(live.tallies, null, "الترجيحات محجوبة أثناء التصويت");
  assert.equal(live.totalVotes, null);

  // ⛔ F1: إيقاف التصويت وحده **لا يفتح** النتائج — هذا هو الشرط القديم
  //    (`showResults || !active`) الذي جعل استطلاعاً لم يبدأ قط يبدو
  //    «منتهياً بأصفار» على الشاشة. الفتح طلبٌ صريح من المشرف.
  raw.sessions[0].polls[0].active = false;
  const stopped = buildPublicSnapshot(raw, "live").polls[0];
  assert.equal(stopped.tallies, null, "إيقاف بلا طلب عرض ⇒ لا نتائج");
  assert.equal(stopped.totalVotes, null);

  // وحين يُطلب العرض صراحةً (وهو ما يفعله `stop` في المسار الحالي):
  raw.sessions[0].polls[0].showResults = true;
  const closed = buildPublicSnapshot(raw, "live").polls[0];
  assert.deepEqual(closed.tallies, [3, 2]);
  assert.equal(closed.totalVotes, 5);

  // ⛔ والإخفاء المقصود يُحجب فعلاً — لا يمرّ عبر استطلاع منتهٍ آخر.
  raw.sessions[0].polls[0].showResults = false;
  const hidden = buildPublicSnapshot(raw, "live").polls[0];
  assert.equal(hidden.tallies, null, "الإخفاء المقصود مُحترم");
});

test("isQaView يقبل المعروفة فقط فقط", () => {
  assert.equal(isQaView("live"), true);
  assert.equal(isQaView("speaker"), true);
  assert.equal(isQaView("audience"), true, "وجه الحضور جهازه لا المشروعور");
  assert.equal(isQaView("admin"), false);
  assert.equal(isQaView(undefined), false);
  assert.equal(isQaView("../etc/passwd"), false);
});

console.log("\n── 1b) ترحيل الحقول: showOnLive يفصل الجمهور عن المشروعور ──────");

/** سؤال قديم بحقل `showOnLive` فقط — الصورة الفعلية لملفات الإنتاج. */
const legacySession = (showOnLive) =>
  session({
    questions: [
      { id: "q_legacy", text: "س", author: "أ", status: "approved", votes: 0, showOnLive, createdAt: "1" },
    ],
  });

test("ترحيل showOnLive=true ينسخه إلى وجهَي الجمهور والمشروعور معاً", () => {
  const q = normalizeData({ sessions: [legacySession(true)] }).sessions[0].questions[0];
  assert.equal(q.showToAudience, true, "الجمهور يبقى كما كان — لم يختفي أحد");
  assert.equal(q.showOnProjector, true, "المشروعور يبقى كما كان");
  assert.equal(q.showOnSpeaker, true);
});

test("ترحيل showOnLive=false يُخفيه من الوجهين معاً", () => {
  const q = normalizeData({ sessions: [legacySession(false)] }).sessions[0].questions[0];
  assert.equal(q.showToAudience, false);
  assert.equal(q.showOnProjector, false);
});

test("⚠️ نسخ الحقل القديم إلى المشروعور وحده ينقلب على الجمهور", () => {
  // هذا هو الخطأ الذي يحمي منه التكرار في migrateQuestionVisibility: لو نُسخ
  // `showOnLive` إلى `showOnProjector` فقط، لبقي `showToAudience` بلا قيمة.
  // ⚠️ نحذف `showOnLive` أيضاً: لولاه لأعاد `normalizeData` الترحيل عند كل
  // قراءة (وهو المطلوب في الإنتاج) وأخفى العطل الذي نحاول قياسه.
  const wrong = {
    sessions: [
      session({
        questions: [
          { id: "q_legacy", text: "س", author: "أ", status: "approved", votes: 0, createdAt: "1" },
        ],
      }),
    ],
  };
  assert.equal(
    buildPublicSnapshot(wrong, "audience").questions.length,
    1,
    "بلا أي حقل: السؤال ظاهر — الغياب يُقرأ «ظاهر»"
  );

  wrong.sessions[0].questions[0].showOnProjector = true; // نُسخ للمشروعور وحده
  assert.equal(
    buildPublicSnapshot(wrong, "audience").questions.length,
    1,
    "والترحيح: الغياب عن showToAudience لا يُقرأ كـ«مخفي»"
  );

  // حالة النسخة الناقصة: المشروعور مفعّل والحقل القديم ممسوح، فلا يبقى أي
  // مصدر للترحيل.
  const stripped = structuredClone(wrong);
  delete stripped.sessions[0].questions[0].showOnProjector;
  assert.equal(
    buildPublicSnapshot(stripped, "audience").questions.length,
    1,
    "لا وجود لمصدر قرار: يبقى ظاهراً"
  );
});

test("الترحيل لا يطمس قراراً جديداً بسبب حقل قديم باقٍ", () => {
  const q = normalizeData({
    sessions: [
      session({
        questions: [
          {
            id: "q_mixed",
            text: "س",
            author: "أ",
            status: "approved",
            votes: 0,
            createdAt: "1",
            showOnLive: false, // قرار قديم: مخفي عن المشروعور
            showToAudience: true, // قرار جديد: مطلوب على الحضور
          },
        ],
      }),
    ],
  }).sessions[0].questions[0];
  assert.equal(q.showToAudience, true, "الحقل الجديد مقدّم على القديم");
  assert.equal(q.showOnProjector, false, "ولم يُطمس القديم على المشروعور");
});

test("سؤال بلا أي حقول عرض = ظاهر على الوجوه الثلاثة", () => {
  const snap = buildPublicSnapshot({ sessions: [legacySession(undefined)] }, "audience");
  assert.equal(snap.questions[0].visible, true);
});

test("وجه الجمهور يحذف المخفي من المصفوفة لا يتركه visible=false", () => {
  const raw = data({
    sessions: [
      session({
        questions: [
          { id: "q_show", text: "ظاهر", author: "أ", status: "approved", votes: 0, createdAt: "1", showToAudience: true },
          { id: "q_hide", text: "مخفي", author: "ب", status: "approved", votes: 0, createdAt: "2", showToAudience: false },
        ],
      }),
    ],
  });
  const snap = buildPublicSnapshot(raw, "audience");
  assert.deepEqual(snap.questions.map((q) => q.id), ["q_show"], "لا أثر للمخفي أصلاً");
  assert.ok(
    !JSON.stringify(snap).includes("مخفي"),
    "نصّ السؤال المخفي لا يخرج في اللقطة إطلاقاً"
  );
  // والمشروعور لا يتأثر بإخفاء الجمهور —الاستقلال الحقيقية.
  assert.deepEqual(
    buildPublicSnapshot(raw, "live").questions.map((q) => q.id).sort(),
    ["q_hide", "q_show"],
    "إخفاء الجمهور لا يخفيه عن المشروعور"
  );
});

test("screen يصف المشروعور دائماً حتى في لقطة الجمهور", () => {
  const raw = data({
    sessions: [
      session({
        screen: { mode: "manual", slide: { kind: "question", questionId: "q_hide" } },
        questions: [
          { id: "q_hide", text: "للشاشة فقط", author: "أ", status: "approved", votes: 0, createdAt: "1", showToAudience: false, showOnProjector: true },
        ],
      }),
    ],
  });
  const snap = buildPublicSnapshot(raw, "audience");
  assert.equal(
    snap.screen.slide.kind,
    "question",
    "لقطة الجمهور لا تدّعي أن الشاشة على hold بينما هي تعرض سؤالاً"
  );
});

test("screenEligibleQuestions يتبع showOnProjector وحده", () => {
  const s = session({
    questions: [
      { id: "q_p", text: "a", author: "أ", status: "approved", votes: 0, createdAt: "1", showOnProjector: true },
      { id: "q_a", text: "b", author: "ب", status: "approved", votes: 0, createdAt: "2", showToAudience: true, showOnProjector: false },
    ],
  });
  assert.deepEqual(
    screenEligibleQuestions(s).map((q) => q.id),
    ["q_p"],
    "السؤال المرفوع للمشروعور لا يُحجبواحدواحد لأنه ليس للجمهور"
  );
});

console.log("\n── 1c) فرض جلسة نشطة واحدة ───────────────────────────────────");

test("جلستان نشطتان على القرص ⇒ الأحدث يبقى والباقي يُطفأ", () => {
  const n = normalizeData({
    sessions: [
      { id: "old", title: "قديمة", active: true, createdAt: "2026-09-01T00:00:00.000Z" },
      { id: "new", title: "جديدة", active: true, createdAt: "2026-09-05T00:00:00.000Z" },
    ],
  });
  assert.equal(n.sessions.filter((s) => s.active).length, 1, "واحدة لا أكثر");
  assert.equal(getActiveSession(n).id, "new", "والفائزة هي الأحدث");
});

test("جلسة واحدة نشطة سليمة تُترك كما هي", () => {
  const n = normalizeData({
    sessions: [
      { id: "a", title: "مطفأة", active: false, createdAt: "2026-09-09T00:00:00.000Z" },
      { id: "b", title: "نشطة", active: true, createdAt: "2026-09-01T00:00:00.000Z" },
    ],
  });
  assert.equal(getActiveSession(n).id, "b", "لا يُغيَّر شيء");
});

test("لا جلسة نشطة تبقى كما هي (لا يُختلق نشطة)", () => {
  const n = normalizeData({ sessions: [{ id: "a", title: "مطفأة", active: false, createdAt: "1" }] });
  assert.equal(getActiveSession(n), null);
});

console.log("\n── 2) التطبيع واحتساب meta ────────────────────────────────────");

test("normalizeData يملأ الحقول الناقصة في البيانات القديمة", () => {
  const n = normalizeData({ sessions: [{ id: "s1", title: "قديم" }] });
  const s = n.sessions[0];
  assert.ok(Array.isArray(s.questions), "قائمة الأسئلة مصفوفة");
  assert.ok(Array.isArray(s.polls), "قائمة الاستفتاءات مصفوفة");
  assert.ok(Array.isArray(s.attendees), "سجل الحضور مصفوفة");
  assert.equal(s.speakerEnabled, true, "شاشة المتحدث مفعّلة افتراضياً");
  assert.ok(n.meta, "meta موجودة دائماً");
  assert.ok(n.settings, "الإعدادات موجودة دائماً");
});

test("الجلسة القديمة بلا acceptingQuestions تُقرأ مغلقة (سلوك آمن)", () => {
  // الحقل يُقرأ في كل الاستدعاءات بمقارنة `=== true`، فغيابه يعني الإغلاق.
  const s = normalizeData({ sessions: [{ id: "s1", title: "قديم" }] }).sessions[0];
  assert.equal(s.acceptingQuestions === true, false, "لا تُستقبل أسئلة افتراضياً");
});

test("الجلسات القديمة تُحسب من attendeeNames دون اختلاق هويات", () => {
  const s = normalizeData({
    sessions: [{ id: "s1", title: "قديم", attendeeNames: ["أ", "ب", "أ"] }],
  }).sessions[0];
  assert.equal(attendeeCountOf(s), 3, "العدّ يعود للأسماء القديمة");
  assert.equal(s.attendees.length, 0, "لا معرّفات مُختلقة لزوار قدامى");
  assert.equal(findAttendee(s, "أ"), null, "لا يمكن لانتحال اسم قديم أن يصوّت");
});

test("أسئلة قديمة بلا حقول العرض تُقرأ بقيمها الافتراضية", () => {
  const n = normalizeData({
    sessions: [
      {
        id: "s1",
        title: "قديم",
        active: true,
        questions: [{ id: "q1", text: "س", author: "أ", status: "approved", votes: 2, createdAt: "1" }],
      },
    ],
  });
  const q = n.sessions[0].questions[0];
  assert.equal(q.showOnSpeaker, true, "تظهر للمتحدث");
  assert.equal(q.showToAudience, true, "تظهر لأجهزة الحضور");
  assert.equal(q.showOnProjector, true, "تدخل مخزون المشروعور");
  // ⚠️ `showOnLive` لم يعد يُكتب: لو وُلد لكان الحقل المهجور يبدو
  // حيّاً على القرص، فيقرأه مسار قادم ويظنّ أنه ما زال يقرّر شيئاً.
  assert.equal(q.showOnLive, undefined, "الحقل المهجور لا يُكتب في التطبيع");
  // الحقول تُقرآن بمقارنة `!== false` في الإسقاط، فغيابها يعني false
  const snap = buildPublicSnapshot(n, "live");
  assert.equal(snap.questions[0].featured, undefined, "لا يُختلق تمييز");
  assert.equal(snap.questions[0].answered, false, "غير مُجاب عليه");
  assert.equal(snap.questions[0].visible, true);
});

test("recomputeMeta يجمع أصوات الاستفتاءات والأسئلة", () => {
  const d = normalizeData(
    data({
      sessions: [
        session({
          attendees: [{ id: "a1", name: "أ", joinedAt: "1" }],
          polls: [
            { id: "p1", prompt: "س", options: ["أ"], optionsAr: ["أ"], active: false, tallies: [4, 6], createdAt: "1" },
          ],
          questions: [{ id: "q1", text: "س", author: "أ", status: "approved", votes: 1, createdAt: "1" }],
        }),
      ],
    })
  );
  const meta = recomputeMeta(d, { votes: [], questionVotes: [{ sessionId: "sess_1", questionId: "q1", voterId: "a1" }] });
  assert.equal(meta.totalVotes, 11, "10 من الاستفتاء + 1 سؤال");
  assert.equal(meta.totalAttendees, 1);
});

test("recomputeMeta يتحمّل ملف أصوات بلا questionVotes", () => {
  const d = normalizeData(data());
  const meta = recomputeMeta(d, { votes: [] });
  assert.equal(meta.totalVotes, 0);
});

test("meta يتبع المصدر لا العدّاد المخزَّن", () => {
  const d = normalizeData(
    data({
      sessions: [
        session({
          polls: [{ id: "p1", prompt: "س", options: ["أ"], optionsAr: ["أ"], active: false, tallies: [2, 0], createdAt: "1" }],
        }),
      ],
    })
  );
  d.meta.totalVotes = 999; // عداد قديم كاذب
  const meta = recomputeMeta(d, { votes: [], questionVotes: [] });
  assert.equal(meta.totalVotes, 2, "يُعاد الاحتساب من الاستgeries");
});

console.log("\n── 3) هوية الحضور والجلسة النشطة ─────────────────────────────");

test("getActiveSession يعيد الجلسة النشطة فقط", () => {
  const d = normalizeData({
    sessions: [session({ id: "a", active: false }), session({ id: "b", active: true })],
  });
  assert.equal(getActiveSession(d)?.id, "b");
});

test("findAttendee لا يقبل معرّفاً مُختلقاً", () => {
  const s = session({ attendees: [{ id: "atn_1", name: "أ", joinedAt: "1" }] });
  assert.equal(findAttendee(s, "atn_1")?.name, "أ");
  assert.equal(findAttendee(s, "atn_other"), null);
  assert.equal(findAttendee(s, ""), null);
});

test("معرّف حضور من جلسة أخرى لا يُقبل في جلسة أخرى", () => {
  const a = session({ id: "sess_A", attendees: [{ id: "atn_1", name: "أ", joinedAt: "1" }] });
  const b = session({ id: "sess_B", attendees: [{ id: "atn_2", name: "ب", joinedAt: "1" }] });
  assert.equal(findAttendee(a, "atn_2"), null, "منع إعادة استخدام المعرّف بين الجلسات");
  assert.ok(findAttendee(b, "atn_2"));
});

test("newId يعيد معرّفات فريدة مسبوقة بالبادئة", () => {
  const ids = new Set(Array.from({ length: 200 }, () => newId("q")));
  assert.equal(ids.size, 200, "لا تكرار في 200 استدعاء");
  assert.ok([...ids].every((id) => id.startsWith("q_")));
});

console.log("\n── 4) التخزين: قراءة الملفات القديمة ──────────────────────────");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-unit-"));
const prevDataDir = process.env.QA_DATA_DIR;
process.env.QA_DATA_DIR = tmpDir;

await testAsync("readVotes يرقّي ملف أصوات بلا questionVotes", async () => {
  const { readVotes } = await import("../src/lib/qa/storage.ts");
  fs.writeFileSync(
    path.join(tmpDir, "qa-votes.json"),
    JSON.stringify({ version: 1, votes: [{ sessionId: "s1", pollId: "p1", voterId: "a1", optionIndex: 0 }] })
  );
  const votes = await readVotes();
  assert.ok(Array.isArray(votes.questionVotes), "questionVotes موجودة بعد الترقية");
  assert.equal(votes.questionVotes.length, 0);
  assert.equal(votes.votes.length, 1, "أصوات الاستفتاء القديمة لم تُفقد");
});

await testAsync("readVotes يتحمّل ملفاً تالفاً بدل رمي استثناء", async () => {
  const { readVotes } = await import("../src/lib/qa/storage.ts");
  fs.writeFileSync(path.join(tmpDir, "qa-votes.json"), "{ليس JSON");
  const votes = await readVotes();
  assert.equal(votes.votes.length, 0);
  assert.equal(votes.questionVotes.length, 0);
});

await testAsync("readQaData يرقّي ملف بيانات قديم", async () => {
  const { readQaData } = await import("../src/lib/qa/storage.ts");
  fs.writeFileSync(
    path.join(tmpDir, "qa-data.json"),
    JSON.stringify({ version: 1, sessions: [{ id: "s1", title: "قديم", attendeeNames: ["أ"] }] })
  );
  const d = await readQaData();
  assert.equal(attendeeCountOf(d.sessions[0]), 1, "عدد الحاضرين من الأسماء القديمة");
  assert.ok(Array.isArray(d.sessions[0].polls));
  assert.ok(d.meta);
});

await testAsync("قفل الكتابة يمنع ضياع تعديلين متزامنين", async () => {
  const { readQaData, mutateQaData } = await import("../src/lib/qa/storage.ts");
  await mutateQaData(() => normalizeData(null));
  const [a, b] = await Promise.all([
    mutateQaData((d) => {
      d.sessions.push(session({ id: "x1" }));
      return "ok";
    }),
    mutateQaData((d) => {
      d.sessions.push(session({ id: "x2" }));
      return "ok";
    }),
  ]);
  assert.equal(a, "ok");
  assert.equal(b, "ok");
  const d = await readQaData();
  const ids = d.sessions.map((s) => s.id).sort();
  assert.ok(ids.includes("x1") && ids.includes("x2"), `كتابتان متزامنتان: ${ids.join(",")}`);
});

console.log("\n── 5) حراسة المصدر: سياسات لا يكشفها أي اختبار سلوكي ──────────");

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/*
 * بعض الأخطاء لا يمكن كشفها فوق هذا الخط في بيئة بلا اعتمادات — مثل دور
 * "viewer": المستخدمون في Google Sheet، ولا يمكن إنشاء حساب من خارج
 * الخادم. في هذه الحالة نفحص المصدر نفسه. هذا أضعف من اختبار سلوكي،
 * لكنه يمنع الانحدار الصامت.
 */

await testAsync("كل مسارات Q&A الإدارية تفحص الدور admin", async () => {
  const dir = path.join(rootDir, "src/app/api/qa/admin");
  const routes = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(dir, d.name, "route.ts"))
    .filter((p) => fs.existsSync(p));

  assert.ok(routes.length >= 6, `عدد مسارات Q&A الإدارية: ${routes.length}`);

  for (const route of routes) {
    const src = fs.readFileSync(route, "utf8");
    assert.ok(
      /role\s*!==\s*"admin"/.test(src),
      `${path.basename(path.dirname(route))} يفحص الدور admin`
    );
  }
});

await testAsync("مسارات القراءة الحية تستخدم محدد القراءة لا محدد الفورم", async () => {
  for (const rel of ["src/app/api/qa/session/current/route.ts", "src/app/api/qa/stream/route.ts"]) {
    const src = fs.readFileSync(path.join(rootDir, rel), "utf8");
    assert.ok(src.includes("checkQaReadRateLimit"), `${rel} يستخدم checkQaReadRateLimit`);
    assert.ok(!/checkRateLimit\(/.test(src), `${rel} لا يستخدم حد الفورم (5/10 دقيقة)`);
  }

  const limiter = fs.readFileSync(path.join(rootDir, "src/lib/rate-limit.ts"), "utf8");
  // نثبّت على كتل الإنشاء نفسها: البحث الحر يلتقط أقرب slidingWindow بعد الاسم.
  const readLimit = Number(
    limiter.match(/qaReadRatelimit\s*=\s*new Ratelimit\([\s\S]*?slidingWindow\((\d+)/)?.[1] ?? 0
  );
  const adminLimit = Number(
    limiter.match(/adminApiRatelimit\s*=\s*new Ratelimit\([\s\S]*?slidingWindow\((\d+)/)?.[1] ?? 0
  );
  const formLimit = Number(
    limiter.match(/^\s*ratelimit\s*=\s*new Ratelimit\([\s\S]*?slidingWindow\((\d+)/m)?.[1] ?? 0
  );
  assert.ok(readLimit > formLimit * 10, `حد القراءة ${readLimit} >> حد الفورم ${formLimit}`);

  // لوحة الإدارة تسحب كل 5 ثوانٍ = 120 طلباً/10 دقائق، فحد 100 كان يحجبها.
  assert.ok(adminLimit >= 300, `حد لوحة الإدارة ${adminLimit} يسع الاستطلاع المستمر`);
});

await testAsync("تصدير CSV يحرس ضد حقن الصيغ", async () => {
  const src = fs.readFileSync(
    path.join(rootDir, "src/app/api/qa/admin/export/route.ts"),
    "utf8"
  );
  assert.ok(/escapeCsv/.test(src), "يوجد escapeCsv");
  // البادئات التي يفسرها Excel/Sheets كصيغة (بعد تجريد الشرطات المائلة).
  const classes = src.replace(/\\/g, "").match(/\[[^\]]*\]/g) ?? [];
  assert.ok(
    classes.some((c) => c.includes("=") && c.includes("+") && c.includes("-") && c.includes("@")),
    `escapeCsv يغطي = + - @ (وجدنا: ${classes.join(" | ")})`
  );
  assert.ok(/role\s*!==\s*"admin"/.test(src), "التصدير يفحص الدور admin");
});

await testAsync("LiveParticipate يرسل رمز Turnstile في التصويت على الاستبيان", async () => {
  const src = fs.readFileSync(
    path.join(rootDir, "src/components/qa/LiveParticipate.tsx"),
    "utf8"
  );
  const voteBody = src.match(/api\("\/api\/qa\/poll\/vote"[\s\S]*?\n\s*\}\);/)?.[0] ?? "";
  assert.ok(voteBody.length > 0, "وُجد طلب التصويت على الاستبيان");
  assert.ok(
    /turnstileToken:\s*pollToken/.test(voteBody),
    "الطلب يحمل turnstileToken (وإلا يفشل بـ403 في الإنتاج)"
  );
  // A transient read failure must not be shown as "session ended".
  assert.ok(
    !/catch\s*\{\s*setActive\(false\)/.test(src),
    "فشل الجلب لا يضبط active=false"
  );
});

console.log("\n── 6) حالة الشاشة: يدوي افتراضياً، والمؤشر لا يسرّب ──────────");

const q = (over = {}) => ({
  id: "q_" + Math.random().toString(36).slice(2, 8),
  text: "سؤال",
  author: "أ",
  status: "approved",
  votes: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  featured: false,
  showOnSpeaker: true,
  showOnLive: true,
  ...over,
});

test("جلسة بلا screen تُرجَّع يدوي/hold (الوضع الافتراضي آمن)", () => {
  const s = normalizeScreen(session());
  assert.equal(s.mode, "manual");
  assert.deepEqual(s.slide, { kind: "hold" });
  assert.deepEqual(defaultScreenState(), { mode: "manual", slide: { kind: "hold" } });
});

test("screen محفوظ يُحترم كما هو (لا يُعاد ضبطه في كل قراءة)", () => {
  const s = normalizeScreen(
    session({ screen: { mode: "auto", slide: { kind: "wordCloud" }, updatedAt: "t" } })
  );
  assert.equal(s.mode, "auto");
  assert.deepEqual(s.slide, { kind: "wordCloud" });
});

test("مؤشر suspicuous يُسقَط إلى hold: نوع مجهول أو سؤال بلا id", () => {
  const s1 = normalizeScreen(session({ screen: { mode: "manual", slide: { kind: "evil" } } }));
  assert.deepEqual(s1.slide, { kind: "hold" });
  const s2 = normalizeScreen(session({ screen: { mode: "manual", slide: { kind: "question" } } }));
  assert.deepEqual(s2.slide, { kind: "hold" });
  const s3 = normalizeScreen(session({ screen: { mode: "manual", slide: { kind: "poll" } } }));
  assert.deepEqual(s3.slide, { kind: "hold" });
});

test("اللقطة العامة: المؤشر على سؤال غير معتمد يعود hold ولا يسرّب معرّفه", () => {
  const pending = q({ id: "q_pending", status: "pending", text: "سري" });
  const snap = buildPublicSnapshot(
    data({ sessions: [session({ questions: [pending], screen: { mode: "manual", slide: { kind: "question", questionId: "q_pending" } } })] }),
    "live"
  );
  assert.deepEqual(snap.screen.slide, { kind: "hold" }, "مؤشر غير مؤهَّل = hold");
  const serialized = JSON.stringify(snap);
  assert.ok(!serialized.includes("q_pending"), "لا يخرج معرّف السؤال المعلّق في اللقطة العامة");
  assert.ok(!serialized.includes("سري"), "لا يخرج نصّ السؤال المعلّق");
});

test("اللقطة العامة: المؤشر على سؤال مرفوض/مخفي/مُجاب يعود hold", () => {
  const cases = [
    q({ id: "q_rej", status: "rejected" }),
    q({ id: "q_hide", showOnLive: false }),
    q({ id: "q_done", answered: true }),
  ];
  for (const target of cases) {
    const snap = buildPublicSnapshot(
      data({ sessions: [session({ questions: [target], screen: { mode: "manual", slide: { kind: "question", questionId: target.id } } })] }),
      "live"
    );
    assert.deepEqual(snap.screen.slide, { kind: "hold" }, `hold للمؤشر على ${target.id}`);
  }
});

test("اللقطة العامة: المؤشر على سؤال مؤهَّل يُحفظ معرّفه فقط", () => {
  const good = q({ id: "q_ok", text: "سؤال معتمد" });
  const snap = buildPublicSnapshot(
    data({ sessions: [session({ questions: [good], screen: { mode: "auto", slide: { kind: "question", questionId: "q_ok" } } })] }),
    "live"
  );
  assert.deepEqual(snap.screen, { mode: "auto", slide: { kind: "question", questionId: "q_ok" } });
});

test("بلا جلسة نشطة: الشاشة hold يدوي (لا تدوير على قائمة فارغة)", () => {
  const snap = buildPublicSnapshot(data({ sessions: [session({ active: false })] }), "live");
  assert.equal(snap.active, false);
  assert.deepEqual(snap.screen, { mode: "manual", slide: { kind: "hold" } });
});

test("screenEligibleQuestions + orderForScreen: مميّز ثم الأعلى votes ثم الأقدم", () => {
  const s = session({
    questions: [
      q({ id: "old", votes: 5, createdAt: "2026-01-01T00:00:00.000Z" }),
      q({ id: "new", votes: 5, createdAt: "2026-02-01T00:00:00.000Z" }),
      q({ id: "hot", votes: 50 }),
      q({ id: "star", votes: 1, featured: true }),
      q({ id: "gone", votes: 99, answered: true }),
      q({ id: "hidden", votes: 98, showOnLive: false }),
      q({ id: "pend", votes: 97, status: "pending" }),
    ],
  });
  assert.deepEqual(
    screenEligibleQuestions(s).map((x) => x.id),
    ["star", "hot", "old", "new"],
    "المؤهَّل فقط، مرتّباً"
  );
  assert.deepEqual(
    [...screenEligibleQuestions(s)].sort(orderForScreen).map((x) => x.id),
    ["star", "hot", "old", "new"],
    "والمقارن يرتّب نفس الترتيب"
  );
});

test("nextScreenSlide: دوري على المؤهَّل، وhold على مخزون فارغ", () => {
  const s = session({ questions: [q({ id: "a" }), q({ id: "b" }), q({ id: "c" })] });
  const first = nextScreenSlide(s, undefined);
  assert.deepEqual(first, { kind: "question", questionId: "a" }, "يبدأ من الأول");
  assert.deepEqual(nextScreenSlide(s, { kind: "question", questionId: "a" }), {
    kind: "question",
    questionId: "b",
  });
  assert.deepEqual(nextScreenSlide(s, { kind: "question", questionId: "c" }), {
    kind: "question",
    questionId: "a",
  },"يلتفّ إلى الأول");
  assert.deepEqual(nextScreenSlide(session({ questions: [q({ id: "x", answered: true })] }), undefined), {
    kind: "hold",
  });
});

test("reconcileScreenSlide يُسقط الشريحة التي لم تعد مؤهَّلة ويحفظ الوضع", () => {
  // المشرف ثبّت سؤالاً ثم خبّأه من الشاشة: المؤشر يجب أن يسقط فوراً،
  // وإلا كتبت اللوحة «المعروض الآن: السؤال X» بينما الشاشة تعرض hold.
  const s = session({
    questions: [q({ id: "hidden" })],
    screen: { mode: "auto", slide: { kind: "question", questionId: "hidden" } },
  });
  s.questions[0].showOnLive = false;
  reconcileScreenSlide(s);
  assert.deepEqual(s.screen, { mode: "auto", slide: { kind: "hold" } }, "سقطت الشريحة وبقي الوضع");

  // سؤال ما زال مؤهَّلاً: لا تغيير.
  const ok = session({
    questions: [q({ id: "still" })],
    screen: { mode: "manual", slide: { kind: "question", questionId: "still" } },
  });
  reconcileScreenSlide(ok);
  assert.deepEqual(ok.screen.slide, { kind: "question", questionId: "still" }, "المؤهَّل يبقى");

  // وضع answered/rejected يُسقط الشريحة أيضاً (ليست الرؤية وحدها السبب).
  for (const patch of [{ answered: true }, { status: "rejected" }]) {
    const t = session({
      questions: [q({ id: "gone" })],
      screen: { mode: "manual", slide: { kind: "question", questionId: "gone" } },
    });
    Object.assign(t.questions[0], patch);
    reconcileScreenSlide(t);
    assert.deepEqual(t.screen.slide, { kind: "hold" }, JSON.stringify(patch));
  }

  // غير سؤال: لا مساس (سحابة كلمات / استفتاء / hold).
  const poll = session({ screen: { mode: "manual", slide: { kind: "wordCloud" } } });
  reconcileScreenSlide(poll);
  assert.deepEqual(poll.screen.slide, { kind: "wordCloud" });
});

console.log("\n── 7) الإجابات المفتوحة: الحصة والاستبدال وخصوصية المعلّق ────────");

test("upsertAnswer يضيف جواباً معلّقاً باسم الحاضر من الخادم", () => {
  const s = session({ questions: [q({ id: "q1" })] });
  const { answer, replaced } = upsertAnswer(
    s,
    s.questions[0],
    { id: "atn_1", name: "سلمى" },
    "الجواب الطويل",
    "2026-01-01T00:00:00.000Z"
  );
  assert.equal(replaced, false);
  assert.equal(answer.status, "pending", "يبدأ معلّقاً: لا نشر بلا مراجعة");
  assert.equal(answer.author, "سلمى", "الاسم من سجل الحضور لا من العميل");
  assert.equal(s.questions[0].answers.length, 1);
});

test("upsertAnswer يستبدل جواب الحاضر على نفس السؤال ويعيده إلى pending", () => {
  const s = session({ questions: [q({ id: "q1" })] });
  const first = upsertAnswer(s, s.questions[0], { id: "atn_1", name: "س" }, "نص أول", "t");
  first.answer.status = "approved";
  first.answer.approvedAt = "t2";
  const second = upsertAnswer(s, s.questions[0], { id: "atn_1", name: "س" }, "نص مصحَّح", "t3");
  assert.equal(second.replaced, true);
  assert.equal(s.questions[0].answers.length, 1, "جواب واحد لكل (حاضر × سؤال)");
  assert.equal(s.questions[0].answers[0].text, "نص مصحَّح");
  assert.equal(
    s.questions[0].answers[0].status,
    "pending",
    "⚠️ النصّ الجديد لم يُراجَع: يبقى معلّقاً رغم أن القديم كان معتمداً"
  );
  assert.equal(s.questions[0].answers[0].approvedAt, undefined, "وقت الاعتماد يُمسح");
});

test("upsertAnswer يفرض حصة الحاضر عبر كل أسئلة الجلسة", () => {
  const s = session({ questions: Array.from({ length: MAX_ANSWERS_PER_ATTENDEE + 1 }, () => q()) });
  for (let i = 0; i < MAX_ANSWERS_PER_ATTENDEE; i++) {
    upsertAnswer(s, s.questions[i], { id: "atn_1", name: "س" }, "جواب", "t");
  }
  assert.equal(countAnswersBy(s, "atn_1"), MAX_ANSWERS_PER_ATTENDEE);
  // السؤال الثالث عشر لم يُجبَّ عليه بعد: فنصل إلى الحصة لا إلى الاستبدال.
  assert.throws(
    () => upsertAnswer(s, s.questions[MAX_ANSWERS_PER_ATTENDEE], { id: "atn_1", name: "س" }, "إقصائي", "t"),
    /answer-quota-reached/,
    "رفض الجواب الثالث عشر بدل إغراق صندوق المراجعة"
  );
  assert.equal(s.questions[MAX_ANSWERS_PER_ATTENDEE].answers.length, 0, "لم يُكتب شيء عند الرفض");
  // وحاضر آخر لا يتأثر بحصة غيره.
  assert.doesNotThrow(() =>
    upsertAnswer(s, s.questions[MAX_ANSWERS_PER_ATTENDEE], { id: "atn_2", name: "أخرى" }, "جواب", "t")
  );
  // والاستبدال يبقى ممكناً دائماً: التصحيح لا يُحسب جواباً جديداً.
  assert.doesNotThrow(() =>
    upsertAnswer(s, s.questions[0], { id: "atn_1", name: "س" }, "جواب مصحَّح", "t")
  );
});

test("countAnswersBy لا يحسب إجابات حاضر آخر", () => {
  const s = session({ questions: [q(), q()] });
  upsertAnswer(s, s.questions[0], { id: "atn_1", name: "أ" }, "ج", "t");
  upsertAnswer(s, s.questions[1], { id: "atn_2", name: "ب" }, "ج", "t");
  assert.equal(countAnswersBy(s, "atn_1"), 1);
  assert.equal(countAnswersBy(s, "atn_2"), 1);
  assert.equal(countAnswersBy(s, "atn_3"), 0);
});

test("اللقطة العامة: الإجابات المعتمدة فقط، بلا attendeeId ولا pending", () => {
  const snap = buildPublicSnapshot(
    data({
      sessions: [
        session({
          questions: [
            q({
              id: "q1",
              answers: [
                { id: "a1", questionId: "q1", attendeeId: "atn_secret", author: "سلمى", text: "معتمدة", status: "approved", createdAt: "1" },
                { id: "a2", questionId: "q1", attendeeId: "atn_2", author: "آخر", text: "معلّقة سرّية", status: "pending", createdAt: "2" },
                { id: "a3", questionId: "q1", attendeeId: "atn_3", author: "ثالث", text: "مرفوضة", status: "rejected", createdAt: "3" },
              ],
            }),
          ],
        }),
      ],
    }),
    "speaker"
  );
  const answers = snap.questions[0].answers;
  assert.deepEqual(answers.map((a) => a.id), ["a1"], "المعتمد فقط");
  assert.ok(!("attendeeId" in answers[0]), "لا معرّف حضور في اللقطة العامة");
  const serialized = JSON.stringify(snap);
  assert.ok(!serialized.includes("atn_secret"), "تسريب معرّف الحضور");
  assert.ok(!serialized.includes("معلّقة سرّية"), "تسريب جواب معلّق");
  assert.ok(!serialized.includes("مرفوضة"), "تسريب جواب مرفوض");
});

test("الإجابات تُرتّب بالأقدم أولاً وثبات تام", () => {
  const build = () =>
    buildPublicSnapshot(
      data({
        sessions: [
          session({
            questions: [
              q({
                id: "q1",
                answers: [
                  { id: "b", questionId: "q1", attendeeId: "x", author: "ب", text: "ثانٍ", status: "approved", createdAt: "2026-02-01T00:00:00.000Z" },
                  { id: "a", questionId: "q1", attendeeId: "y", author: "أ", text: "أول", status: "approved", createdAt: "2026-01-01T00:00:00.000Z" },
                ],
              }),
            ],
          }),
        ],
      }),
      "speaker"
    ).questions[0].answers.map((a) => a.id);
  assert.deepEqual(build(), ["a", "b"], "الأقدم أولاً");
  assert.deepEqual(build(), ["a", "b"], "والترتيب لا يتغيّر بين اللقطتين");
});

await testAsync("نقاط الشاشة والإجابات محروسة بالدور الإداري", async () => {
  for (const rel of [
    "src/app/api/qa/admin/screen/route.ts",
    "src/app/api/qa/admin/answer/route.ts",
  ]) {
    const src = fs.readFileSync(path.join(rootDir, rel), "utf8");
    assert.ok(/requireAdmin/.test(src), `${rel} يستخدم requireAdmin`);
    assert.ok(/role\s*!==\s*"admin"/.test(src), `${rel} يفحص الدور admin`);
    assert.ok(/checkAdminApiRateLimit/.test(src), `${rel} يحدّ معدّل الطلبات`);
    assert.ok(/validateOrigin/.test(src), `${rel} يفحص Origin`);
  }
});

await testAsync("شاشة العرض بلا اختصارات لوحة مفاتيح", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/LiveScreen.tsx"), "utf8");
  // ⚠️ أي مستخدم يمرّ على غرفة التحكّم (أو يتّصل بـHDMI) يستخدم لوحة مفاتيح،
  // فأي onKeyDown في شاشة العرض باب مفتوح لتبديل ما يراه الحضور.
  assert.ok(!/onKeyDown|addEventListener\(\s*["']keydown/.test(src), "لا مستمع لمفاتيح في شاشة العرض");
  assert.ok(!/useHotkeys|useKeyboard/.test(src), "لا hook اختصارات في شاشة العرض");
  // وفي المقابل: التحكم كله في اللوحة المحمية.
  const panel = fs.readFileSync(path.join(rootDir, "src/components/qa/QaAdminPanel.tsx"), "utf8");
  assert.ok(/qa-screen-bar/.test(panel), "اللوحة تحتوي شريط تحكم الشاشة");
  assert.ok(/qa-put-on-screen/.test(panel), "اللوحة تحتوي زر «على الشاشة»");
  // ⚠️ استثناء مقصود: Enter في حقلي كلمة مرور الدخول فقط (سلوك نموذج
  // تسجيل دخول متوقّع)، ولا علاقة له بتبديل ما يُعرض على الشاشة.
  const keydowns = [...panel.matchAll(/onKeyDown=\{[^}]*\}/g)].map((m) => m[0]);
  for (const h of keydowns) {
    assert.ok(/Enter/.test(h), `معالج لوحة مفاتيح في اللوحة: ${h}`);
  }
});

await testAsync("LiveScreen يعرض ما يمليه الخادم، والتثبيت يتفوّق على التدوير", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/LiveScreen.tsx"), "utf8");
  assert.ok(/screen\s*\?\?\s*EMPTY_SNAPSHOT\.screen/.test(src), "يقرأ screen من اللقطة");
  assert.ok(/mode\s*===\s*"auto"/.test(src), "يحسب وضع auto");
  // القاعدة الحرجة: التدوير يتوقف عند وجود شريحة مثبَّتة.
  assert.ok(
    /const pinned =[\s\S]{0,120}const rotating = screen\.mode === "auto" && !pinned/.test(src),
    "rotating = auto && !pinned (التثبيت اليدوي يفوز على التلقائي)"
  );
  assert.ok(/setInterval/.test(src), "التدوير التلقائي ما زال موجوداً في وضع auto");
});

await testAsync("QR الخاص بالجلسة يصل إلى صفحة المشاركة ويحمل session", async () => {
  const live = fs.readFileSync(path.join(rootDir, "src/components/qa/LiveScreen.tsx"), "utf8");
  assert.ok(
    /live\?session=\$\{data\.session\.id\}/.test(live),
    "QR يحمل ?session=<id> (بارامتر حيّ لا ميت)"
  );
  const part = fs.readFileSync(path.join(rootDir, "src/components/qa/LiveParticipate.tsx"), "utf8");
  assert.ok(/get\("session"\)/.test(part), "صفحة المشاركة تقرأ ?session=");
  assert.ok(/qa-stale-session/.test(part), "وتعرض رسالة عند رمز قديم أو منتهٍ");
  assert.ok(/sessionMismatch/.test(part), "وتقارن بالجلسة النشطة");
});

await testAsync("واجهة الحاضر تكتب جواباً مفتوحاً ولا ترسل بلا رمز", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/LiveParticipate.tsx"), "utf8");
  const block = src.match(/const submitAnswer = [\s\S]*?\n  };/)?.[0] ?? "";
  assert.ok(block.length > 0, "وُجد submitAnswer");
  assert.ok(
    /api\("\/api\/qa\/question\/answer"/.test(block),
    "يستخدم نقطة الإجابة"
  );
  assert.ok(/turnstileToken:\s*answerToken/.test(block), "يرسل turnstileToken");
  assert.ok(
    /TURNSTILE_ENABLED && !answerToken && !answerStalled/.test(block),
    "يمنع الإرسال بلا رمز (وينجو بعد تعذّر تحميله فقط)"
  );
  // حفظ محلي لنسخة صاحب الجواب حتى لا تختفي عنه بعد التحديث.
  assert.ok(/MY_ANSWERS_STORAGE/.test(src), "يحفظ إجاباته المعلّقة محلياً");
});

// ═══════════════════════════════════════════════════════════════════════
// 8) الفصل بين الجمهور والمشروعور — قواعد بوابة الخادم
// ═══════════════════════════════════════════════════════════════════════
console.log("\n── 8) الفصل بين الجمهور والمشروعور: قواعد الخادم ──");

const qVis = (over = {}) => ({
  id: "q_x",
  author: "أ",
  text: "س",
  votes: 0,
  status: "approved",
  createdAt: "2026-01-01T00:00:00.000Z",
  featured: false,
  answered: false,
  showOnSpeaker: true,
  showToAudience: true,
  showOnProjector: true,
  answers: [],
  ...over,
});

test("إخفاء الجمهور وحده:Audience يخفي، المشروعور يبقى ظاهراً", () => {
  const q = qVis();
  const r = applyVisibilityChange(q, { audience: false });
  assert.equal(q.showToAudience, false, "أُخفي عن الجمهور");
  assert.equal(q.showOnProjector, true, "بقي ظاهراً على المشروعور");
  assert.equal(r.droppedFromProjector, false, "لا يسقط الشريحة");
});

test("إخفاء المشروعور وحده:الجمهور يبقى، والقاعدة تُسقط الشريحة", () => {
  const q = qVis();
  const r = applyVisibilityChange(q, { projector: false });
  assert.equal(q.showToAudience, true, "بقي ظاهراً للجمهور");
  assert.equal(q.showOnProjector, false, "أُخفي عن المشروعور");
  assert.equal(r.droppedFromProjector, true, "سقطت من المشروعور ⇒ تسقط الشريحة");
});

test("showOnLive القديم يضبط الوجهين معاً (مسار الإقلاع)", () => {
  const q = qVis();
  const r = applyVisibilityChange(q, { legacyLive: false });
  assert.equal(q.showToAudience, false, "الوجه الأول");
  assert.equal(q.showOnProjector, false, "الوجه الثاني");
  assert.equal(r.droppedFromProjector, true);
});

test("الحقل الجديد يتقدّم على القديم عند تعارضهما في الطلب", () => {
  const q = qVis();
  // لوحة قديمة ترسل showOnLive=false بينما الواجهة الجديدة تحدّد المشروعور صراحةً.
  applyVisibilityChange(q, { legacyLive: false, projector: true, audience: false });
  assert.equal(q.showToAudience, false, "الجمهور من الحقل الجديد");
  assert.equal(q.showOnProjector, true, "المشروعور من الحقل الجديد يتغلب على القديم");
});

test("لا تُكتب showOnLive أبداً — الحقل يبقى أثراً تاريخياً", () => {
  const q = qVis({ showOnLive: true });
  applyVisibilityChange(q, { audience: false, projector: true });
  assert.equal(q.showOnLive, true, "لم تُمسّ قيمة الحقل القديم على القرص");
});

test("إعادة المشروعور للظهور لا تُعيد الشريحة (تحتاج setSlide صريحاً)", () => {
  const q = qVis({ showOnProjector: false });
  const r = applyVisibilityChange(q, { projector: true });
  assert.equal(q.showOnProjector, true, "عاد ظاهراً");
  assert.equal(r.droppedFromProjector, false, "لا يسقط شيئاً عند الإظهار");
});

test("setSpeaker مستقل تماماً عن الوجهين", () => {
  const q = qVis();
  applyVisibilityChange(q, { speaker: false });
  assert.equal(q.showOnSpeaker, false);
  assert.equal(q.showToAudience, true, "الجمهور لم يتغيّر");
  assert.equal(q.showOnProjector, true, "المشروعور لم يتغيّر");
});

test("إخفاء الجمهور لا يمسّ شريحة مثبَّتة على المشروعور", () => {
  const s = session({ questions: [qVis({ id: "q1" })] });
  s.screen = { mode: "manual", slide: { kind: "question", questionId: "q1" } };
  applyVisibilityChange(s.questions[0], { audience: false });
  reconcileScreenSlide(s);
  assert.equal(
    s.screen.slide.kind,
    "question",
    "الشريحة باقية: السؤال ما زال مؤهَّلاً للمشروعور"
  );
});

test("إخفاء المشروعور يُسقط الشريحة المثبَّتة فوراً", () => {
  const s = session({ questions: [qVis({ id: "q1" })] });
  s.screen = { mode: "manual", slide: { kind: "question", questionId: "q1" } };
  const { droppedFromProjector } = applyVisibilityChange(s.questions[0], { projector: false });
  if (droppedFromProjector) reconcileScreenSlide(s);
  assert.equal(s.screen.slide.kind, "hold", "سقطت إلى hold");
});

test("قاعدة العرض تعتمد المشروعور لا الجمهور", () => {
  const s = session({
    questions: [
      qVis({ id: "q_both", showToAudience: false }),
      qVis({ id: "q_screen", showOnProjector: false }),
    ],
  });
  const ids = screenEligibleQuestions(s).map((q) => q.id);
  assert.deepEqual(ids, ["q_both"], "q_both (مخفي عن الجمهور) مؤهَّل، q_screen ليس كذلك");
});

await testAsync("البوابة في /question/answer تعتمد isAudienceVisible لا حقول المشروعور", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/app/api/qa/question/answer/route.ts"), "utf8");
  // نقتصر على **الشرط** نفسه؛ التعليقات تذكر أسماء الحقول المهمّلة عمداً
  // لتوثيق سبب الاختيار، والإسقاط عليها يُقرأ كاعتماد زائد.
  const guard = src.match(/if \(\s*!question \|\|[\s\S]{0,200}?\)\s*\{/)?.[0] ?? "";
  assert.ok(guard.length > 0, "وُجد شرط الإجابة");
  assert.ok(/!isAudienceVisible\(question\)/.test(guard), "الحارس يقرأ isAudienceVisible");
  assert.ok(
    !/showOnLive|showOnSpeaker|isProjectorVisible/.test(guard),
    "لا اعتماد على حقول المشروعور/المتحدث في شرط الإجابة"
  );
});

await testAsync("التصويت غير مقيّد بالعرض عمداً (قرار: المعرّف المعروف يكفي)", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/app/api/qa/question/vote/route.ts"), "utf8");
  assert.ok(
    !/isAudienceVisible|isProjectorVisible|showTo/.test(src),
    "لا حارس رؤية في التصويت — إخفاء عن الجمهور لا يُسقط الأصوات القديمة"
  );
  assert.ok(/question\.status !== "approved"/.test(src), "يبقى حارس الاعتماد فقط");
});

await testAsync("/admin/screen لا ينشئ أسئلة بالحقل البطل showOnLive", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/app/api/qa/admin/screen/route.ts"), "utf8");
  const block = src.match(/const question: QaQuestion = \{[\s\S]*?\n        \};/)?.[0] ?? "";
  assert.ok(block.length > 0, "وُجد بناء سؤال الإدارة");
  assert.ok(/showToAudience: true/.test(block), "يكتب showToAudience");
  assert.ok(/showOnProjector: true/.test(block), "يكتب showOnProjector");
  assert.ok(!/showOnLive/.test(block), "لا يكتب الحقل البطل");
});

await testAsync("/admin/session: تشغيل جلسة لم تكن نشطة يُطفئ البقية", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/app/api/qa/admin/session/route.ts"), "utf8");
  const toggle = src.match(/if \(action === "toggle"\) \{[\s\S]*?\n        \}/)?.[0] ?? "";
  assert.ok(toggle.length > 0, "وُجد فرع toggle");
  // الفرع المجرّد (بلا acceptingQuestions) هو موضع الثغرة.
  const bare = toggle.split("} else {")[1] ?? "";
  assert.ok(
    /forEach\(\(s\) => \(s\.active = false\)\)/.test(bare),
    "يُطفئ كل الجلسات قبل التشغيل (وإلا صارت جلستان نشطتان)"
  );
  assert.ok(!/target\.active = !target\.active/.test(bare), "لا انعكاس للـactive");
});

await testAsync("/admin/moderate: الحقل القديم مقبول في الطلب وغير مكتوب", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/app/api/qa/admin/moderate/route.ts"), "utf8");
  assert.ok(/showToAudience: z\.boolean\(\)/.test(src), "يقبل showToAudience");
  assert.ok(/showOnProjector: z\.boolean\(\)/.test(src), "يقبل showOnProjector");
  assert.ok(/showOnLive: z\.boolean\(\)/.test(src), "يقبل القديم للتوافق");
  const write = src.match(/if \(action === "setVisibility"\) \{[\s\S]*?\n      \}/)?.[0] ?? "";
  assert.ok(!/q\.showOnLive\s*=/.test(write), "لا يكتب الحقل البطل على السؤال");
});

await testAsync("اللوحة لم تعد تُرسل الحقل البطل showOnLive إطلاقاً", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/QaAdminPanel.tsx"), "utf8");
  // تعريف الحقل في الواجهة مقصود (قراءة القديم فقط)؛ المهمّ ألّا يمرّ في طلب.
  const calls = stripComments(src).match(/moderate\("setVisibility"[\s\S]{0,140}?\}/g) ?? [];
  assert.ok(calls.length >= 3, "ثلاثة أزرار رؤية تستدعي setVisibility", `عدد=${calls.length}`);
  for (const c of calls) {
    assert.ok(!/showOnLive/.test(c), "لا زر يرسل الحقل البطل", c.slice(0, 80));
  }
  assert.ok(!/data-testid="qa-toggle-live"/.test(src), "testid القديم أُزيل");
  assert.ok(/data-testid="qa-toggle-audience"/.test(src), "زر الجمهور");
  assert.ok(/data-testid="qa-toggle-projector"/.test(src), "زر المشروعور");
});

await testAsync("طابور الشاشة في اللوحة يطابق service.ts حرفياً", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/QaAdminPanel.tsx"), "utf8");
  const queue = stripComments(
    src.match(/const screenQueue = approved\.filter\([\s\S]{0,300}?\);/)?.[0] ?? ""
  );
  assert.ok(queue.length > 0, "وُجد تعريف screenQueue");
  // ⚠️ الاختلاف بين `showOnProjector` و`showToAudience` يجعل عدّاد اللوحة
  // يخالف الخادم: إن أسقطنا المخفي عن الجمهور من الطابور، قال العدّاد ١
  // بينما الشاشة تعرضه.
  assert.ok(/q\.showOnProjector !== false/.test(queue), "يقرأ showOnProjector", queue);
  assert.ok(!/showToAudience/.test(queue), "لا يقرأ showToAudience", queue);
});

await testAsync("زر «على الشاشة» يُعطَّل بالمشروعور لا بالجمهور", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/QaAdminPanel.tsx"), "utf8");
  // 1.4KB بين data-testid و`</Button>` (تعليق + خصائص)، فالنطاق واسع.
  const btn = stripComments(
    src.match(/data-testid="qa-put-on-screen"[\s\S]{0,1800}?<\/Button>/)?.[0] ?? ""
  );
  assert.ok(btn.length > 0, "وُجد الزر");
  assert.ok(/q\.showOnProjector === false/.test(btn), "التعطيل يقرأ showOnProjector");
  assert.ok(!/showOnLive/.test(btn), "لا اعتماد على الحقل البطل");
  assert.ok(!/showToAudience/.test(btn), "لا اعتماد على رؤية الجمهور");
});

await testAsync("409 من الشاشة يُترجم لا يظهر كنص إنجليزي", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/QaAdminPanel.tsx"), "utf8");
  assert.ok(/res\.status === 409/.test(src), "api() يميّز 409");
  assert.ok(/isScreenConflict\(e\)/.test(src), "act() يميّز خطأ الشاشة");
  assert.ok(/t\("screenConflict"\)/.test(src), "يُعرض بالمفتاح المُترجَم");
  // ⚠️ لا يجوز أن يمرّ 409 في مسار clearSession: توكن سليم + خطأ محتوى
  // يجب ألا يُفكّ جلسة المشرف.
  const act = stripComments(
    src.match(/const act = <T,>[\s\S]{0,900}?\.finally\(\(\) => setBusy\(null\)\);/)?.[0] ?? ""
  );
  assert.ok(act.length > 0, "وُجد act()");
  const auth = act.match(/if \(isAuthError\(e\)\) \{[\s\S]{0,160}?\n {8}\}/)?.[0] ?? "";
  assert.ok(auth.length > 0, "وُجد فرع isAuthError", act);
  assert.ok(!/isScreenConflict/.test(auth), "409 لا يمرّ بتفكيك الجلسة", auth);
});

await testAsync("مفاتيح الترجمة الثلاثة للوجهين موجودة في اللغتين", async () => {
  for (const loc of ["ar", "en"]) {
    const j = JSON.parse(fs.readFileSync(path.join(rootDir, `messages/${loc}.json`), "utf8"));
    const a = j.qa?.adminLive ?? {};
    for (const k of [
      "audienceVisible",
      "audienceHidden",
      "projectorVisible",
      "projectorHidden",
      "audienceFacingHint",
      "projectorFacingHint",
      "screenConflict",
    ]) {
      assert.equal(typeof a[k], "string", `${loc}.${k}`);
      assert.ok(a[k].length > 0, `${loc}.${k} غير فارغ`);
    }
    assert.equal(a.liveVisible, undefined, `${loc}: liveVisible حُذف`);
    assert.equal(a.liveHidden, undefined, `${loc}: liveHidden حُذف`);
  }
});

await testAsync("E2E يستخدم أسماء الأزرار الجديدة", async () => {
  const src = fs.readFileSync(path.join(rootDir, "e2e/qa-live.spec.ts"), "utf8");
  assert.ok(!/qa-toggle-live/.test(src), "لا مرجع لاسم الزر القديم");
  assert.ok(/qa-toggle-projector/.test(src), "يستخدم زر المشروعور");
  assert.ok(/qa-toggle-audience/.test(src), "يستخدم زر الجمهور");
});

await testAsync("لا محارف من لغات أخرى في شيفرة Q&A (حارس ضد التلف)", async () => {
  // ⚠️ التلف يمرّ من `tsc` و`lint` و`build` كلّها دون خطأ: محرف واحد
  // غريب داخل تعليق أو قائمة كلمات توقف لا يُترجم ولا يُصرّف. ظهر فعلياً
  // ثلاث مرات أثناء العمل على هذه المراحل. الفحص نصّي لا بديل عنه.
  const foreign = /[\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/u;
  const targets = [
    "src/lib/qa/types.ts",
    "src/lib/qa/service.ts",
    "src/lib/qa/public-view.ts",
    "src/lib/qa/storage.ts",
    "src/app/api/qa/admin/session/route.ts",
    "src/app/api/qa/admin/moderate/route.ts",
    "src/app/api/qa/admin/screen/route.ts",
    "src/app/api/qa/question/answer/route.ts",
    "src/app/api/qa/question/vote/route.ts",
    "src/components/qa/QaAdminPanel.tsx",
    "src/components/qa/LiveParticipate.tsx",
    "src/components/qa/LiveScreen.tsx",
    "src/components/qa/SpeakerView.tsx",
    "src/components/qa/WordCloud.tsx",
    "src/components/qa/AnalyticsDashboard.tsx",
    "src/lib/jwt.ts",
  ];
  const bad = [];
  for (const f of targets) {
    const p = path.join(rootDir, f);
    if (!fs.existsSync(p)) continue;
    fs.readFileSync(p, "utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (foreign.test(line)) bad.push(`${f}:${i + 1}`);
      });
  }
  assert.deepEqual(bad, [], "أسطر فيها محرف من خارج العربية/اللاتينية", bad.join(", "));
});

await testAsync("قائمة كلمات التوقف عربية بحت", async () => {
  // ⚠️ القائمة في `service.ts` لا في المكوّن: الكود الخالص قابل لاختبار
  // الوحدة، والمكوّن يعرض فقط. قراءة `WordCloud.tsx` كانت تمرّ بصمت
  // وتسقط الاختبار بـ«لم تُوجد القائمة» لا بذكر السبب.
  const src = fs.readFileSync(path.join(rootDir, "src/lib/qa/service.ts"), "utf8");
  const list = src.match(/const RAW_STOP_WORDS = \[([\s\S]*?)\];/)?.[1] ?? "";
  assert.ok(list.length > 0, "وُجدت قائمة كلمات التوقف");
  const words = [...list.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  assert.ok(words.length > 100, "القائمة غير ناقصة", `عدد=${words.length}`);
  for (const w of words) {
    assert.ok(
      /^[A-Za-z\u0600-\u06FF]+$/.test(w),
      `كلمة توقف غير عربية/إنكليزية: ${w}`
    );
  }
});

await testAsync("LiveParticipate يطلب view=audience لا view=live", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/LiveParticipate.tsx"), "utf8");
  const calls = stripComments(src).match(/["'`]\/api\/qa\/session\/current[^"'`]*["'`]/g) ?? [];
  assert.ok(calls.length > 0, "وُجد نداء اللقطة", `عدد=${calls.length}`);
  for (const c of calls) {
    assert.ok(
      c.includes("view=audience"),
      "لقطة الجمهور يجب أن تطلب view=audience صراحةً",
      c
    );
    assert.ok(!/view=live/.test(c), "لا تقرأ لوح المشروعور", c);
  }
});

await testAsync("LiveScreen يبقى على view=live ويؤخذ `visible` منه", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/LiveScreen.tsx"), "utf8");
  assert.ok(/useQaStream\(\{\s*view:\s*"live"/.test(src), "يطلب view=live");
  assert.ok(/q\.visible/.test(src), "يطبّق `visible` القادم من الخادم");
});

await testAsync("SpeakerView يبقى على view=speaker", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/SpeakerView.tsx"), "utf8");
  assert.ok(/\/api\/qa\/session\/current\?view=speaker/.test(src), "يطلب view=speaker");
});

await testAsync("شريحة السحابة لا تظهر فراغاً على الشاشة الكبرى", async () => {
  const src = fs.readFileSync(path.join(rootDir, "src/components/qa/LiveScreen.tsx"), "utf8");
  // بلا هذا الشرط تظهر تسمية «سحابة الكلمات» وحدها فوق مساحة سوداء
  // أمام الحضور، لأن المكوّن يرسم حاوية فارغة لا `null`.
  assert.ok(
    /slide\.kind === "wordCloud" && cloudWords\.length > 0/.test(src),
    "شريحة السحابة مشروطة بوجود كلمات"
  );
  assert.ok(
    /calculateWordFrequency\(questions\.map/.test(src),
    "السحابة تُحسب من أسئلة المشروعور لا من كل أسئلة اللقطة"
  );
});

/* ── Word Cloud: حساب خالص بلا DOM ─────────────────────────────────────── */

const cloudWords = (...texts) => calculateWordFrequency(texts, 50);

/** مفتاح العدّ المجمَّع لكلمات نص، للاختبارات. */
const cloudKeys = (text) => tokenizeArabic(text).map((t) => t.key);

/** أسماء العرض لكلمات نص، للاختبارات. */
const cloudForms = (text) => tokenizeArabic(text).map((t) => t.display);

/** مقياس نص وهمي ثابت: العرض بعرض الحرف الواحد. */
const fakeMeasure = (text, fontPx) => ({
  width: text.length * fontPx * 0.5,
  height: fontPx,
});

const CLOUD = { width: 900, height: 500, measure: fakeMeasure, gap: 6 };

test("التطبيع يطوي التشكيل وصور الهمزة والتاء المربوطة", () => {
  assert.equal(normalizeArabic("الحياة"), "الحياه", "التاء المربوطة تطوى");
  assert.equal(normalizeArabic("حَياة"), "حياه", "التشكيل يُزال");
  assert.equal(normalizeArabic("الحياة"), "الحياه", "ألف مقصورة تطوى");
  assert.equal(normalizeArabic("مــدرسة"), "مدرسه", "التطويل يُزال");
  assert.equal(normalizeArabic("إلى"), "الي", "ألف مقصورة تصير ياء");
  assert.equal(normalizeArabic("إنَّ"), "ان", "تشكيل فوق همزة");
  assert.equal(normalizeArabic("إسلام"), "اسلام", "همزة تحت الألف");
});

test("الأرقام الهندية تصير لاتينية قبل التنقية", () => {
  assert.equal(normalizeArabic("٢٠٢٦"), "2026", "أرقام عربية-هندية");
  assert.equal(normalizeArabic("٢٠٢٦"), "2026", "أرقام فارسية");
  assert.deepEqual(cloudKeys("عام ٢٠٢٦"), ["عام", "2026"]);
});

test("كلمات التوقف تُقارن بعد التطبيع لا قبله", () => {
  // ⚠️ هذا هو سبب تمرير قائمة التوقف بـ`normalizeArabic` عند البناء:
  // «إن» مطبَّعة تصير «ان»، وقائمة غير مطبَّعة لا تطابقها أبداً.
  assert.deepEqual(cloudKeys("إنَّ هذا"), [], "كلمتا توقف فقط");
  assert.ok(!cloudKeys("هل هذا سؤال").includes("هل"));
  assert.ok(!cloudKeys("من إلى على").includes("من"));
  // توقف إنكليزي يبقى يعمل بعد طي الأحرف الكبير.
  assert.deepEqual(cloudKeys("The Future of The Ideas"), ["future", "ideas"]);
});

test("التطبيع يسبق القسمة فلا تتقطّع الكلمة المشكولة", () => {
  // ⚠️ انحدار لعلّة حقيقية: علامات التشكيل من الفئة `Mn` لا `L`، فالقسمة
  // على «غير حرف» كانت تمرّ عليها وتقطّع «رَأْسٌ» إلى `ر` `أ` `س`،
  // وكلها أقصر من الحد الأدنى فتسقط الكلمة كلها.
  assert.deepEqual(cloudKeys("رَأْسٌ، نَفْسٌ"), ["راس", "نفس"]);
  // «الْ حياة» سوكون على اللام: بلا الإصلاح تُفصل «ال» وتُحسب «حياة».
  assert.deepEqual(cloudKeys("الْحياة"), cloudKeys("الحياة"));
  assert.deepEqual(cloudForms("الْحياة"), ["الحياة"]);
  // الرموز تُحذف بعد التشكيل: الفاصلة والعلامة لا تقطعان الكلمة.
  assert.deepEqual(cloudKeys("التطوُّعُ، القيادةُ! المجتمعُ؟"), [
    "التطوع",
    "القياده",
    "المجتمع",
  ]);
  // «هي» كلمة توقف فحذفت، و«و» حرف عطف يلتصق بما بعده: قيد معروف
  // لا يحتاج تحليلاً صرفياً، وغيره لا يبتلع صيغةً صحيحة.
  assert.deepEqual(cloudKeys("ما هي؟ ولماذا!"), ["ولماذا"]);
});

test("التطويل لا يبقى في الاسم المعروض", () => {
  assert.equal(normalizeArabic("مــدرسة"), "مدرسه", "التطويل 0640 محذوف");
  assert.deepEqual(cloudForms("مــدرسة"), ["مدرسة"]);
  assert.deepEqual(cloudKeys("مــدرسة"), cloudKeys("مدرسة"));
});

test("العدّ يطوي الإملاء والعرض يحفظ الصيغة الأصلية", () => {
  // ⚠️ هذا هو سبب فصل `key` عن `display`: بلا الفصل تُطبع «الحياه»
  // على الشاشة الكبرى أمام الحضور.
  // ثلاث صيغ تختلف بالتشكيل والتاء المربوطة فقط: مفتاح واحد.
  const out = cloudWords("الحياة", "الْحياة", "الحياه");
  assert.equal(out.length, 1, "ثلاث صيغ = كلمة واحدة في العدّ");
  assert.equal(out[0].count, 3, "ثلاثة أسئلة");
  assert.equal(out[0].text, "الحياة", "تُعرض صيغة الأكثر وروداً");
  assert.deepEqual(cloudForms("الحياة"), ["الحياة"], "اسم العرض لا يُطوى");
  assert.deepEqual(cloudForms("مــدرسة"), ["مدرسة"], "التطويل يُزال من العرض");
  assert.deepEqual(cloudKeys("الحياة"), cloudKeys("الحياه"), "المفتاح واحد");
  // اختلاف «ال» يبقى كلمةً أخرى: ليست خطأً إملائياً.
  assert.equal(cloudWords("الحياة", "حياة").length, 2);
});

test("صيغة العرض الأكثر وروداً تتقدم", () => {
  const out = cloudWords("القيادة", "القيادة", "القياده");
  assert.equal(out.length, 1, "كل صيغ القيادة كلمة واحدة");
  assert.equal(out[0].count, 3);
  assert.equal(out[0].text, "القيادة", "الصيغة الصحيحة تتقدم");
});

test("الوزن عدد الأسئلة لا مرات التكرار", () => {
  // «القيادة» مكرّرة ست مرات في سؤال واحد، و«الشباب» في ثلاثة أسئلة.
  const out = cloudWords(
    "القيادة القيادة القيادة القيادة القيادة القيادة",
    "الشباب",
    "الشباب",
    "الشباب",
  );
  const youth = out.find((w) => w.text === "الشباب");
  const drive = out.find((w) => w.text === "القيادة");
  assert.equal(drive?.count, 1, "التكرار في سؤال واحد = سؤال واحد");
  assert.equal(youth?.count, 3, "ثلاثة أسئلة = ثلاثة");
  assert.ok(youth && drive, "الكلمتان موجودتان");
  assert.ok(
    out.indexOf(youth) < out.indexOf(drive),
    "الكلمة الأكثر حضوراً جماعياً تتصدّر",
  );
});

test("تكرار الكلمة في السؤال نفسه لا يُضاعف الوزن", () => {
  const a = cloudWords("الشباب الشباب الشباب")[0].count;
  const b = cloudWords("الشباب")[0].count;
  assert.equal(a, b);
});

test("السقف يمنع كلمة مكرّرة من احتكار السحابة", () => {
  // خمسون سؤالاً كلها عن كلمة واحدة: بدون سقف يبتلع العددُ كل شيء.
  const many = Array.from({ length: 50 }, (_, i) => `الشباب والمجتمع ${i}`);
  const out = calculateWordFrequency(many, 50);
  const youth = out.find((w) => w.text === "الشباب");
  assert.ok(youth, "الكلمة موجودة");
  assert.ok(youth.count <= 4, `الوزن مقيّد (${youth.count})`);
  // كلمات أخرى ظهرت أيضاً، فلا احتكار.
  assert.ok(out.length > 1, "كلمات أخرى لم تُسحق");
});

test("ترتيب الكلمات لا يعتمد ترتيب الأسئلة", () => {
  const qs = ["الشباب والقيادة", "الشباب والمجتمع", "القيادة والشباب"];
  const a = cloudWords(...qs);
  const b = cloudWords(qs[2], qs[0], qs[1]);
  // نفس الكلمات بنفس الأوزان: لو اعتمدنا على ترتيب الإدخال لتغيّرت
  // مواضع السحابة أمام الحضور بلا سبب.
  assert.deepEqual(
    a.map((w) => [w.text, w.count]),
    b.map((w) => [w.text, w.count]),
  );
  // والتساوي يُحسم أبجدياً لا عشوائياً.
  const tie = cloudWords("القيادة المجتمع الشباب");
  const tied = tie.filter((w) => w.count === tie[0].count).map((w) => w.text);
  assert.deepEqual(tied, [...tied].sort((x, y) => x.localeCompare(y, "ar")));
});

test("حجم الخط يتبع الجذر التربيعي فيبقى النادر مقروءاً", () => {
  const sizes = computeFontSizes(
    [
      { text: "a", count: 20 },
      { text: "b", count: 1 },
    ],
    20,
    64,
  );
  assert.equal(sizes[0], 64, "الأكثر حضوراً يبلغ الحد الأعلى");
  assert.ok(sizes[1] > 20 + (64 - 20) * 0.05, "النادر لا ينزل تحت الحد الأدنى");
  assert.ok(sizes[1] < 64, "وأقل من الأكثر");
});

test("اللولب حتمي: نفس المدخلات تعطي نفس المواضع بالبكسل", () => {
  const words = cloudWords(
    "الشباب والقيادة والتطوع",
    "المجتمع والشباب",
    "القيادة والتطوع",
  );
  const sizes = computeFontSizes(words, 20, 64);
  const a = layoutSpiral(words, sizes, CLOUD);
  const b = layoutSpiral(words, sizes, CLOUD);
  assert.deepEqual(
    a.map((w) => [w.text, w.x, w.y]),
    b.map((w) => [w.text, w.x, w.y]),
    "المواضع متطابقة",
  );
  // الترتيب نفسه ينتج مخرجات نفسها: لا عشوائية في أي مرحلة.
  assert.ok(a.length > 0, "وُضعت كلمات");
});

test("اللولب لا يترك تداخلاً بين الصناديق", () => {
  const words = cloudWords(
    ...Array.from({ length: 25 }, (_, i) => `الشباب${i} المجتمع القيادة التطوع`),
  );
  const sizes = computeFontSizes(words, 20, 64);
  const placed = layoutSpiral(words, sizes, { ...CLOUD, gap: 6 });

  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      const clash =
        a.x < b.x + b.boxWidth + 6 &&
        a.x + a.boxWidth + 6 > b.x &&
        a.y < b.y + b.boxHeight + 6 &&
        a.y + a.boxHeight + 6 > b.y;
      assert.ok(!clash, `تداخل بين «${a.text}» و«${b.text}»`);
    }
  }
});

test("كل كلمة داخل حدود الحاوية", () => {
  const words = cloudWords(
    ...Array.from({ length: 30 }, (_, i) => `كلمة${i} موضوع المجتمع التطوع`),
  );
  const sizes = computeFontSizes(words, 20, 64);
  const placed = layoutSpiral(words, sizes, CLOUD);
  assert.ok(placed.length > 0, "وُضعت كلمات");
  for (const w of placed) {
    assert.ok(w.x >= 0, `«${w.text}» خارج اليسار`);
    assert.ok(w.y >= 0, `«${w.text}» خارج الأعلى`);
    assert.ok(
      w.x + w.boxWidth <= CLOUD.width + 0.001,
      `«${w.text}» خارج اليمين`,
    );
    assert.ok(
      w.y + w.boxHeight <= CLOUD.height + 0.001,
      `«${w.text}» خارج الأسفل`,
    );
  }
});

test("أكبر كلمة توضع أولاً قرب المركز", () => {
  const words = cloudWords("الشباب والمجتمع والعمل والتطوع", "الشباب", "الشباب");
  const sizes = computeFontSizes(words, 20, 64);
  const placed = layoutSpiral(words, sizes, CLOUD);
  const cx = CLOUD.width / 2;
  const cy = CLOUD.height / 2;
  const dist = (w) =>
    Math.hypot(w.x + w.boxWidth / 2 - cx, w.y + w.boxHeight / 2 - cy);
  const biggest = placed.reduce((a, b) => (a.fontPx >= b.fontPx ? a : b));
  assert.equal(biggest.fontPx, Math.max(...sizes), "أكبر خط وُضع");
  for (const w of placed) {
    if (w.text === biggest.text) continue;
    assert.ok(dist(biggest) <= dist(w) + 0.001, "الأقرب للأكبر");
  }
});

test("حاوية بلا أبعاد لا تُنتج مواضع", () => {
  const words = cloudWords("الشباب");
  const sizes = computeFontSizes(words, 20, 64);
  assert.deepEqual(layoutSpiral(words, sizes, { ...CLOUD, width: 0 }), []);
  assert.deepEqual(layoutSpiral(words, sizes, { ...CLOUD, height: 0 }), []);
  assert.deepEqual(layoutSpiral([], [], CLOUD), []);
});

test("اختلاف عدد الكلمات عن الأحجام يرمي بدل أن يخطئ صامتاً", () => {
  const words = cloudWords("الشباب المجتمع");
  assert.throws(
    () => layoutSpiral(words, [30], CLOUD),
    /layoutSpiral/,
    "عدم تطابق الأطوال خطأ برمجي",
  );
});

test("السحابة لا تستعمل عشوائية ولا وقتاً", () => {
  const wc = fs.readFileSync(
    path.join(rootDir, "src/components/qa/WordCloud.tsx"),
    "utf8"
  );
  const svc = fs.readFileSync(
    path.join(rootDir, "src/lib/qa/service.ts"),
    "utf8"
  );
  // عشوائية في المكوّن أو في منطق السحابة تُسقط ضمان الحتمية.
  assert.ok(!/Math\.random/.test(wc), "لا Math.random في المكوّن");
  assert.ok(!/Date\.now|new Date/.test(wc), "لا وقت في المكوّن");
  const cloudSection = svc.slice(svc.indexOf("layoutSpiral"));
  assert.ok(
    !/Math\.random|Date\.now|new Date/.test(cloudSection),
    "لا عشوائية ولا وقت في منطق السحابة",
  );
});

test("مكوّن السحابة يملأ الحاوية ولا يحدّد ارتفاعه", () => {
  const wc = fs.readFileSync(
    path.join(rootDir, "src/components/qa/WordCloud.tsx"),
    "utf8"
  );
  // التخطيط يُقاس بـ`clientHeight`، فتجاوز المكوّن بحدّ ارتفاع من عنده
  // يجعل القياس أصغر من الرسم.
  assert.ok(/h-full/.test(wc), "يملأ ارتفاع الحاوية");
  assert.ok(/relative/.test(wc), "الحاوية مرجع للمواضع المطلقة");
  assert.ok(!/h-\[/.test(wc), "لا ارتفاع ثابت داخل المكوّن");
  // المواضع مطلقة لا flex: `flex-wrap` كان يعطي تخطيطاً يختلف بالعرض.
  assert.ok(/absolute/.test(wc), "مواضع مطلقة");
  assert.ok(!/flex-wrap/.test(wc), "لا التفاف flex");
});

/* ══════════════════════════════════════════════════════════════
   المصادقة — تنفيذ حقيقي للسلسلة (Layer 0 / S6)
   ══════════════════════════════════════════════════════════════ */

/**
 * ⚠️ تُضبط متغيّرات البيئة **قبل** الاستيراد.
 *
 * سببان مقيدان لا خياران في التصميم:
 *  - `jwt.ts` يخزّن السر المشتق في `cachedSecret` عند أول استدعاء، فقراءة
 *    `JWT_SECRET` بعده ترى القيمة القديمة.
 *  - `users.ts` يزرع مستخدمي الوضع المحلي مرّة واحدة عند أول استدعاء، فقراءة
 *    `ADMIN_PASSWORD` بعده ترى قائمة فارغة (936ms تجزئة ضائعة).
 *
 * الاختباران يغيّران البيئة عمداً (حاجز الإنتاج) لكنهما لا يعيدان بناء ذاكرة
 * الوحدة، فيكتفيان بفحص `isLocalAuthMode()` مباشرة.
 */
process.env.JWT_SECRET = "qa-unit-test-secret-not-a-real-credential";
process.env.ADMIN_PASSWORD = "unit-admin-password";
process.env.QA_LOCAL_VIEWER_PASSWORD = "unit-viewer-password";
// تأكيد صريح لتشغيل الوضع المحلي. نضعه هنا عمداً بدل الاعتماد على
// NODE_ENV المحيط: لو كان الإنتاج، يرفض الوضع المحلي بلا هذا التأكيد؛ ولو
// اعتمدنا على حالة بيئية متوارثة من اختبار آخر، لتغيّرت نتيجة اختبارات
// المصادقة بتغيّر ترتيب التنفيذ — وهو اختبار غير معزول يعمل بالمصادفة.
process.env.QA_ALLOW_LOCAL_AUTH = "true";

const { isLocalAuthMode } = await import("../src/lib/users.ts");
const { signJwt } = await import("../src/lib/jwt.ts");
const { requireAdmin, verifySession, isAdminConfigured } = await import(
  "../src/lib/admin-auth.ts"
);

/** يبني طلباً يحمل توكناً — أو بلا توكن إن مُرّر null. */
function authRequest(token) {
  return new Request("http://localhost/api/qa/admin/state", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

await testAsync("وضع المصادقة المحلي مُفعَّل، ومصدر الهوية لا Sheets", async () => {
  process.env.QA_AUTH_MODE = "local";
  assert.equal(isLocalAuthMode(), true, "الوضع المحلي يعمل");
  const { getUserByUsername } = await import("../src/lib/users.ts");
  // ⛔ هذا هوHeart of Layer 0: قبل الوضع المحلي كان هذا يرمي بلا Sheets،
  // فيصير كل طلب إداري 503 ولا يمكن تشغيل أي اختبار متصفح.
  const admin = await getUserByUsername("admin");
  assert.ok(admin, "المستخدم admin موجود بلا Google Sheets");
  assert.equal(admin.role, "admin");
  // نفس دوال التجزئة والتحقق تُستعمل في الإنتاج — الاختزال هو المصدر فقط.
  assert.ok(
    admin.passwordHash.startsWith("scrypt$"),
    "التجزئة scrypt الحقيقية، لا مقارنة نصية"
  );
});

await testAsync("وضع المصادقة المحلي يبني مستخدم viewer لاختبار الأدوار", async () => {
  const { getUserByUsername } = await import("../src/lib/users.ts");
  const viewer = await getUserByUsername("viewer");
  assert.ok(viewer, "مستخدم viewer موجود");
  assert.equal(viewer.role, "viewer");
  assert.equal(viewer.username, "viewer");
});

await testAsync("كلمة المرور تُتحقَّق عبر scrypt الحقيقي في الوضع المحلي", async () => {
  const { verifyUserPassword } = await import("../src/lib/users.ts");
  const good = await verifyUserPassword("admin", "unit-admin-password");
  assert.ok(good, "كلمة المرور الصحيحة تُقبل");
  assert.equal(good.user.username, "admin");

  const bad = await verifyUserPassword("admin", "wrong-password");
  assert.equal(bad, null, "كلمة المرور الخاطئة تُرفض — لا مسار تجاوز");

  const ghost = await verifyUserPassword("ghost", "unit-admin-password");
  assert.equal(ghost, null, "مستخدم غير موجود يُرفض");
});

await testAsync("S6a: توكن admin صالح ⇒ requireAdmin يمرّ", async () => {
  process.env.QA_AUTH_MODE = "local";
  const token = await signJwt({ sub: "admin", role: "admin", tv: 0 });
  const res = await requireAdmin(authRequest(token));
  assert.equal(res.ok, true, "الجلسة مقبولة");
  assert.equal(res.session.username, "admin");
  assert.equal(res.session.role, "admin");
});

await testAsync("S6b: توكن viewer صالح يمرّ لكن بدور viewer", async () => {
  process.env.QA_AUTH_MODE = "local";
  const token = await signJwt({ sub: "viewer", role: "viewer", tv: 0 });
  const res = await requireAdmin(authRequest(token));
  assert.equal(res.ok, true, "viewer يدخل اللوحة للقراءة");
  assert.equal(res.session.role, "viewer");
});

await testAsync("S6c: بلا توكن ⇒ 401", async () => {
  process.env.QA_AUTH_MODE = "local";
  const res = await requireAdmin(authRequest(null));
  assert.equal(res.ok, false);
  assert.equal(res.response.status, 401);
});

await testAsync("S6d: توكن بتوقيع فاسد ⇒ 401", async () => {
  process.env.QA_AUTH_MODE = "local";
  const token = await signJwt({ sub: "admin", role: "admin", tv: 0 });
  const tampered = token.slice(0, -4) + "AAAA";
  const res = await requireAdmin(authRequest(tampered));
  assert.equal(res.ok, false);
  assert.equal(res.response.status, 401);
});

await testAsync("S6e: tv لا يطابق ⇒ 401 — أي بعد تغيير كلمة المرور", async () => {
  process.env.QA_AUTH_MODE = "local";
  const stale = await signJwt({ sub: "admin", role: "admin", tv: 7 });
  const res = await requireAdmin(authRequest(stale));
  assert.equal(res.ok, false, "إبطال الجلسات القائمة يعمل");
  assert.equal(res.response.status, 401);
});

await testAsync("S6f: توكن بمستخدم غير موجود ⇒ 401 لا 503", async () => {
  process.env.QA_AUTH_MODE = "local";
  const token = await signJwt({ sub: "ghost", role: "admin", tv: 0 });
  const res = await requireAdmin(authRequest(token));
  assert.equal(res.ok, false);
  // ⛔ هذا هو الفرق الذي خلط بيننا وبين العميل: مستخدم غير موجود = 401،
  // أمّا تعذّر قراءة المصدر = 503. الخلط بينهما يجعل Prognosis خاطئاً.
  assert.equal(res.response.status, 401);
});

await testAsync("توكن منتهٍ ⇒ 401 (الصلاحية تُقرأ من ADMIN_TOKEN_TTL)", async () => {
  process.env.QA_AUTH_MODE = "local";
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const expired = await new SignJWT({ sub: "admin", role: "admin", tv: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Date.now() / 1000 - 7200)
    .setExpirationTime(Date.now() / 1000 - 3600)
    .sign(secret);
  const res = await requireAdmin(authRequest(expired));
  assert.equal(res.ok, false);
  assert.equal(res.response.status, 401);
});

await testAsync("verifySession يُرجع null بلا توكن ولا يرمي", async () => {
  process.env.QA_AUTH_MODE = "local";
  const session = await verifySession(authRequest(null));
  assert.equal(session, null, "بلا توكن ⇒ null، لا استثناء");
});

test("⛔ حاجز الإنتاج: الوضع المحلي مرفوض بلا تأكيد صريح", () => {
  process.env.QA_AUTH_MODE = "local";
  const prevNode = process.env.NODE_ENV;
  const prevAllow = process.env.QA_ALLOW_LOCAL_AUTH;
  // التحذير مقصود في الإنتاج، لكنه يُشوّش مخرجات الاختبار ويفقده PowerShell
  // كخطأ. نُسكته أثناء الفحص فقط — السلوك المُختبَر يبقى كما هو.
  const realWarn = console.warn;
  console.warn = () => {};
  try {
    process.env.NODE_ENV = "production";
    delete process.env.QA_ALLOW_LOCAL_AUTH;
    assert.equal(
      isLocalAuthMode(),
      false,
      "وضع بلا كلمة مرور فعّالة يجب ألّا يُفعّل في الإنتاج"
    );
    process.env.QA_ALLOW_LOCAL_AUTH = "true";
    assert.equal(isLocalAuthMode(), true, "التأكيد الصريح يفتح الوضع للاختبارات");
    process.env.QA_ALLOW_LOCAL_AUTH = "yes";
    assert.equal(isLocalAuthMode(), false, "القيمة لا يجب أن تُقبل بحرية");
    delete process.env.QA_AUTH_MODE;
    assert.equal(isLocalAuthMode(), false, "بلا QA_AUTH_MODE لا يعمل الوضع");
  } finally {
    console.warn = realWarn;
    if (prevNode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNode;
    if (prevAllow === undefined) delete process.env.QA_ALLOW_LOCAL_AUTH;
    else process.env.QA_ALLOW_LOCAL_AUTH = prevAllow;
    process.env.QA_AUTH_MODE = "local";
  }
});

test("وضع غير معروف (مثلاً typo) لا يُفعّل الوضع المحلي", () => {
  process.env.QA_AUTH_MODE = "locl";
  try {
    assert.equal(isLocalAuthMode(), false, "قيمة مشوهة لا تفتح باباً خلفياً");
  } finally {
    process.env.QA_AUTH_MODE = "local";
  }
});

test("isAdminConfigured يعتمد ADMIN_PASSWORD وحده", () => {
  assert.equal(isAdminConfigured(), true, "كلمة المرور موجودة ⇒ اللوحة مفعّلة");
});

test("كود الوضع المحلي لا يستدعي Sheets في مسار القراءة", () => {
  const src = fs.readFileSync(path.join(rootDir, "src/lib/users.ts"), "utf8");
  const body = stripComments(src);
  // كل نقطة تلامس الشبكة يجب أن تكون محروسة — وإلا فإن كتابة في الوضع
  // المحلي تصل إلى جدول الإنتاج، وهو أسوأ ممّا يظنّ المطوّر.
  for (const fn of ["getUsers", "addUser", "updateUserPassword", "updateLastLogin"]) {
    const start = body.indexOf(`async function ${fn}`) >= 0
      ? body.indexOf(`async function ${fn}`)
      : body.indexOf(`export async function ${fn}`);
    assert.ok(start > 0, `${fn} موجود`);
    const next = body.indexOf("await getUsersTab()", start);
    if (next === -1) continue;
    const window = body.slice(start, next);
    assert.ok(
      /isLocalAuthMode\(\)/.test(window),
      `${fn} يحرس getUsersTab() ببوابة الوضع المحلي`
    );
  }
});

/* ══════════════════════════════════════════════════════════════
   وضع الاختبار الموحّد (Layer 0 / A2)
   ══════════════════════════════════════════════════════════════ */

const {
  isTestMode,
  isTestTurnstileToken,
  TEST_TURNSTILE_TOKEN,
  TEST_SERVER_PORT,
} = await import("../src/lib/test-mode.ts");
const { verifyTurnstile } = await import("../src/lib/turnstile.ts");
const { validateOrigin } = await import("../src/lib/cors.ts");

/**
 * يعيد البيئة كما كانت مهما fell الاختبار فشل.
 *
 * ⚠️ `async` إجباري: لو لم تكن كذلك لأعادت `finally` استعادة المتغيّرات فور
 * إرجاع `fn()` الوعد — أي قبل أوّل `await` في جسم الاختبار. عندها يفحص
 * الاختبار بيئةً مختلفة عمّا ضبطه بالضبط ويمرّ أو يفشل لأسباب خاطئة. وهو
 * أسوأ من غياب الاختبار: يعطي طمأنينة زائفة.
 */
async function withEnv(vars, fn) {
  const prev = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

await testAsync("وضع الاختبار يُفعَّل في التطوير ويُرفض في الإنتاج بلا تأكيد", async () => {
  await withEnv({ QA_TEST_MODE: "1", NODE_ENV: "development", QA_ALLOW_TEST_MODE: undefined }, () => {
    assert.equal(isTestMode(), true, "يعمل في التطوير");
  });
  await withEnv({ QA_TEST_MODE: "1", NODE_ENV: "production", QA_ALLOW_TEST_MODE: undefined }, () => {
    const realErr = console.error;
    console.error = () => {};
    try {
      assert.equal(isTestMode(), false, "مرفوض في الإنتاج بلا تأكيد صريح");
    } finally {
      console.error = realErr;
    }
  });
  await withEnv({ QA_TEST_MODE: "1", NODE_ENV: "production", QA_ALLOW_TEST_MODE: "true" }, () => {
    assert.equal(isTestMode(), true, "التأكيد الصريح يفتحه على نسخة الإنتاج");
  });
  await withEnv({ QA_TEST_MODE: undefined, NODE_ENV: "development", QA_ALLOW_TEST_MODE: "true" }, () => {
    assert.equal(isTestMode(), false, "التأكيد وحده لا يكفي بلا QA_TEST_MODE");
  });
});

test("رمز تجاوز Turnstile لا يقبل إلا المطابقة التامة", () => {
  assert.equal(isTestTurnstileToken(TEST_TURNSTILE_TOKEN), true);
  // ⛔ هذه هي الحالات التي تحوّل تسهيل الاختبار إلى ثغرة: لو قبل أي قيمة
  // لأمكن لفورم حقيقي إرسال نص فارغ وتجاوز فحص البوت كلياً.
  for (const bad of [undefined, "", "anything", "QA-TEST-BYPASS", `${TEST_TURNSTILE_TOKEN} `]) {
    assert.equal(isTestTurnstileToken(bad), false, `تُرفض: ${JSON.stringify(bad)}`);
  }
});

await testAsync("Turnstile: يتجاوز وضع الاختبار بالرمز الصحيح فقط، حتى بلا مفتاح", async () => {
  const prevSecret = process.env.TURNSTILE_SECRET_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  try {
    await withEnv({ QA_TEST_MODE: "1", NODE_ENV: "production", QA_ALLOW_TEST_MODE: "true" }, async () => {
      assert.equal(await verifyTurnstile(TEST_TURNSTILE_TOKEN), true, "الرمز الصحيح يمرّ");
    });
    const realErr = console.error;
    console.error = () => {};
    try {
      await withEnv({ QA_TEST_MODE: "1", NODE_ENV: "production", QA_ALLOW_TEST_MODE: "true" }, async () => {
        // رمز خاطئ + بلا مفتاح + إنتاج ⇒ لا بدّ من الرفض. لو مرّ هنا لكان
        // التجاوز مفتوحاً على أي قيمة.
        assert.equal(await verifyTurnstile("wrong-token"), false, "رمز خاطئ يُرفض");
        assert.equal(await verifyTurnstile(undefined), false, "بلا رمز يُرفض");
        assert.equal(await verifyTurnstile(""), false, "رمز فارغ يُرفض");
      });
    } finally {
      console.error = realErr;
    }
  } finally {
    if (prevSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = prevSecret;
  }
});

await testAsync("Turnstile بلا مفتاح في الإنتاج يرفض — السلوك الصحيح لا يُلمس", async () => {
  const prevSecret = process.env.TURNSTILE_SECRET_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  const realErr = console.error;
  console.error = () => {};
  try {
    await withEnv({ QA_TEST_MODE: undefined, NODE_ENV: "production", QA_ALLOW_TEST_MODE: undefined }, async () => {
      assert.equal(await verifyTurnstile(undefined), false, "لا باب مفتوح بلا فحص بوت");
    });
    await withEnv({ QA_TEST_MODE: undefined, NODE_ENV: "development", QA_ALLOW_TEST_MODE: undefined }, async () => {
      const realWarn = console.warn;
      console.warn = () => {};
      try {
        assert.equal(await verifyTurnstile(undefined), true, "تسهيل التطوير يبقى");
      } finally {
        console.warn = realWarn;
      }
    });
  } finally {
    console.error = realErr;
    if (prevSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = prevSecret;
  }
});

test("CORS: منفذ خادم الاختبار ضمن القائمة الافتراضية", () => {
  // ⛔ هذا المنفذ كان مصدر 403 الذي أوقف الاختبارات. إدراجه افتراضياً
  // يمنع تكرار المشكلة بعد أي clean install.
  for (const port of [TEST_SERVER_PORT]) {
    const req = new Request("http://localhost/api", {
      headers: { origin: `http://localhost:${port}` },
    });
    assert.equal(validateOrigin(req), null, `المنفذ ${port} مسموح`);
  }
});

await testAsync("CORS: أصل غريب مرفوض بلا وضع اختبار، ومقبول معه", async () => {
  const req = new Request("http://localhost/api", {
    headers: { origin: "http://evil.example.com" },
  });
  await withEnv({ QA_TEST_MODE: undefined, NODE_ENV: "production", QA_ALLOW_TEST_MODE: undefined }, () => {
    const res = validateOrigin(req);
    assert.ok(res, "يُرفض الأصل الغريب في الإنتاج");
    assert.equal(res.status, 403);
  });
  await withEnv({ QA_TEST_MODE: "1", NODE_ENV: "production", QA_ALLOW_TEST_MODE: "true" }, () => {
    assert.equal(validateOrigin(req), null, "وضع الاختبار يؤسّع CORS");
  });
});

test("CORS: الطلب بلا Origin يُسمح به دائماً — لا تغيير سلوك", () => {
  const req = new Request("http://localhost/api");
  assert.equal(validateOrigin(req), null, "نفس الأصل بلا رأس Origin يمرّ");
});

/**
 * ⛔ English-first: لا نصّ إنجليزي مكتوب بالمفتاح الهارب داخل مكوّنات Q&A.
 *
 * لماذا حارس ثابت لا تنظيفاً واحداً: النصوص التي نسيهاها في `AnalyticsDashboard`
 * و`QaAdminPanel` (`"Loading..."`, `"No data"`, `"load error"`,
 * `placeholder="New session title"`) بقيت سنوات لأن لا شيء يمنع عودتها.
 * التنظيف يُنقَى مع كل مراجعة؛ الحارس يفشل عند أول سطر.
 *
 * ما يُستثنى عمداً:
 *   - نصوص التطوير: `"use client"` وعبارات الاستيراد.
 *   - أسماء المتغيّرات وخصائص `className`/`data-*` — ليست نصاً مرئياً.
 *   - النصوص التي يحملها next-intl عبر `t(...)`: المفتاح نفسه ليس نصاً.
 *   - قائمة الاستثناءات أدناه: كل سطر بسببٍ مكتوب.
 */
const I18N_ALLOWLIST = new Map([
  // اسم العلامة كعلامة تجارية، لا جملة قابلة للترجمة.
  ['SpeakerView.tsx', /"TEDxAlFalah Youth"/],
  // القيم التقنية: صفر بلا معنى رقمي، ونقاط انتظار أثناء الحفظ.
  ["LiveParticipate.tsx", /loadingText="…"/],
  ["QaAdminPanel.tsx", /loadingText="\?"/],
  ["PostEventSurvey.tsx", /loadingText=\{t\("survey\.submitting"\)\}/],
]);

/** أسطر JSX التي تحوي نصاً مترجماً أو صفة وصولية — لا يُفحص ما بعدها. */
const I18N_NEXTINTL = /\bt\(\s*["'`](qa|common)\./;

function scanHardcodedEnglish(rel, source) {
  const lines = source.split(/\r?\n/);
  const allow = I18N_ALLOWLIST.get(rel.split(/[\\/]/).pop());
  const hits = [];

  lines.forEach((raw, i) => {
    const n = i + 1;
    // ⚠️ التعليقات تُقشّر قبل الفحص: تعليق يوثّق النصّ الإنجليزي القديم
    // (`"Loading..." : "No data"`) ما زال في الملف توثيقاً، والفحص بلا
    // قشرة كان يبلّغ عن سطر قاله الكود قبل إصلاحه.
    const line = raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/, "");
    if (/^\s*("use |import |export |const |let |var |function |type |interface )/.test(line)) return;
    if (I18N_NEXTINTL.test(line)) return;
    if (allow && allow.test(raw)) return;

    // نصّ مرئي: >محتوى< داخل JSX، أو قيمة placeholder/title/aria-label.
    const jsx = />([A-Z][A-Za-z]+(?:[ \n][A-Za-z]+){0,6})</g;
    const attrs = /\b(placeholder|title|aria-label|alt)\s*=\s*"([A-Z][A-Za-z]+[^"]{2,40})"/g;
    // رسائل fallback داخل الكود: `|| "Login failed"` / `: "No data"`.
    const fallback = /[:?|]\s*"([A-Z][A-Za-z]+(?: [A-Za-z]+){1,6})"/g;

    for (const re of [jsx, attrs, fallback]) {
      let m;
      while ((m = re.exec(line)) !== null) hits.push(`L${n} ${m[1]}`);
    }
  });

  return hits;
}

test("English-first: لا نصّ إنجليزي هارب في مكوّنات Q&A", () => {
  const dir = path.join(rootDir, "src", "components", "qa");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"));

  // ⛔ القائمة صريحة لا عددٌ أدنى: لو سقط أحد الملفات من القرص صارت
  // مساحة الفحص أصغر مرّة، والفحص يمرّ على ما تبقى — فيبدو.Boolean
  //該 محمياً وهو يفتقد مكوّناً بأكمله.
  const EXPECTED = [
    "AnalyticsDashboard.tsx",
    "LiveParticipate.tsx",
    "LiveScreen.tsx",
    "PostEventSurvey.tsx",
    "QaAdminPanel.tsx",
    "SpeakerView.tsx",
    // F2: صندوق تقييم ما بعد الحدث — داخل Q&A لا في مجلّد منفصل، فهو
    // مشمول بهذا الحارس بالاسم لا بالمسار.
    "SurveyInbox.tsx",
    "WordCloud.tsx",
  ].sort();
  assert.deepEqual(files.sort(), EXPECTED, "قائمة مكوّنات Q&A تغيّرت — حدّث الحارس عمداً");

  const offenders = [];
  for (const f of files) {
    const rel = `src/components/qa/${f}`;
    const hits = scanHardcodedEnglish(rel, fs.readFileSync(path.join(dir, f), "utf8"));
    for (const h of hits) offenders.push(`${rel} ${h}`);
  }
  assert.equal(
    offenders.length,
    0,
    `نصّ إنجليزي غير مترجَم — استعمل t(...):\n    ${offenders.join("\n    ")}`
  );
});

test("English-first: كل مفتاح t(...) المستعمل في Q&A موجود في en و ar", () => {
  const dir = path.join(rootDir, "src", "components", "qa");
  const en = JSON.parse(fs.readFileSync(path.join(rootDir, "messages", "en.json"), "utf8"));
  const ar = JSON.parse(fs.readFileSync(path.join(rootDir, "messages", "ar.json"), "utf8"));
  const get = (obj, dotted) => dotted.split(".").reduce((a, k) => (a == null ? a : a[k]), obj);

  const missing = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".tsx"))) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of src.matchAll(/\bt\(\s*["'`]([\w.]+)["'`]/g)) {
      const key = m[1];
      if (!key.startsWith("qa.")) continue;
      for (const [name, msgs] of [["en", en], ["ar", ar]]) {
        if (typeof get(msgs, key) !== "string") missing.push(`${name}:qa.${key} (${f})`);
      }
    }
  }
  assert.equal(
    missing.length,
    0,
    `مفاتيح مفقودة في ملفات الرسائل:\n    ${[...new Set(missing)].join("\n    ")}`
  );
});

if (prevDataDir === undefined) delete process.env.QA_DATA_DIR;
else process.env.QA_DATA_DIR = prevDataDir;
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n${"═".repeat(60)}`);
console.log(`نجح: ${passed}   فشل: ${failures.length}`);
if (failures.length) {
  console.log("\nالإخفاقات:");
  for (const f of failures) console.log(`  • ${f.name}\n    ${f.err?.message ?? f.err}`);
  process.exit(1);
}
