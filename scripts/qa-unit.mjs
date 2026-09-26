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

/**
 * مصغّر الاستيراد: شيفرة المشروع تستورد بمسارات نسبية بلا امتداد
 * (`./service` ← `service.ts`) وهو ما يدعمه مُجمِّع Next، لكنه يرفضه محلّل ESM
 * في Node. نضيف امتداد `.ts` تلقائياً فيفحص نفس الملفات التي يفحصها البناء —
 * دون step ترجمة إضافية.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
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
  countAnswersBy,
  upsertAnswer,
  MAX_ANSWERS_PER_ATTENDEE,
} = await import("../src/lib/qa/service.ts");

let passed = 0;
const failures = [];

function test(name, fn) {
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

  raw.sessions[0].polls[0].active = false;
  const closed = buildPublicSnapshot(raw, "live").polls[0];
  assert.deepEqual(closed.tallies, [3, 2]);
  assert.equal(closed.totalVotes, 5);
});

test("isQaView يقبل viewKNOWN فقط", () => {
  assert.equal(isQaView("live"), true);
  assert.equal(isQaView("speaker"), true);
  assert.equal(isQaView("admin"), false);
  assert.equal(isQaView(undefined), false);
  assert.equal(isQaView("../etc/passwd"), false);
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
  assert.equal(q.showOnLive, true, "تظهر للجمهور");
  // الحقولان يُقرآن بمقارنة `=== true` في الإسقاط، فغيابهما يعني false
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
