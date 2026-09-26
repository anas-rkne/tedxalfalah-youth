import { randomBytes } from "crypto";
import type {
  QaAnswer,
  QaAttendee,
  QaData,
  QaQuestion,
  QaScreenSlide,
  QaScreenState,
  QaSession,
  QaVoteStore,
} from "./types";
import { emptyQaData } from "./defaults";

/** يبني معرّفًا عشوائيًا قصيرًا آمنًا (لا يحتاج فك تشفير). */
export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

/** يعيد الجلسة النشطة، أو null إن لم توجد جلسة نشطة. */
export function getActiveSession(data: QaData): QaSession | null {
  return data.sessions.find((s) => s.active) ?? null;
}

/** يعيد جلسة بمعرّفها، أو null. */
export function getSessionById(data: QaData, id: string): QaSession | null {
  return data.sessions.find((s) => s.id === id) ?? null;
}

/** يضمن وجود مصفوفة الحضور على الجلسة (ويصلح البيانات القديمة). */
export function normalizeAttendees(session: QaSession): QaAttendee[] {
  if (!Array.isArray(session.attendees)) session.attendees = [];
  return session.attendees;
}

/**
 * يبحث عن سجل حضور داخل جلسة بمعرّفه.
 *
 * ⚠️ البحث **محصور بالجلسة** عمداً: معرّف حضور من جلسة أخرى يجب ألا يُقبل
 * هنا، وإلا استطاع زائر إعادة استخدام معرّفه في جلسات مختلفة.
 */
export function findAttendee(session: QaSession, attendeeId: string): QaAttendee | null {
  if (!attendeeId) return null;
  return normalizeAttendees(session).find((a) => a.id === attendeeId) ?? null;
}

/**
 * عدد الحاضرين الفعلي.
 * يفضّل سجل الحضور، ويسقط إلى `attendeeNames` للجلسات القديمة التي لا تملك سجلاً.
 */
export function attendeeCountOf(session: QaSession): number {
  const registry = normalizeAttendees(session);
  if (registry.length > 0) return registry.length;
  return Array.isArray(session.attendeeNames) ? session.attendeeNames.length : 0;
}

/**
 * يعيد حساب `data.meta` من محتوى البيانات الحقيقي بدل زيادته تدريجياً.
 *
 * ⚠️ لماذا؟ كان `meta` يُحدَّث عند كل إضافة فقط، فلا يعود صحيحاً بعد **حذف**
 * جلسة أو استفتاء: العدّاد يبقى عالقاً على الرقم القديم ويظهر في لوحة التحليلات
 * أكبر بكثير من الواقع. إعادة الحساب من المصدر تُبقي `meta` صحيحاً مهما كان
 * نوع العملية.
 *
 * `totalVotes` = أصوات الاستفتاءات (من `tallies`) + أصوات الأسئلة المفتوحة.
 */
export function recomputeMeta(data: QaData, votes?: QaVoteStore): QaData["meta"] {
  let totalAttendees = 0;
  let totalQuestions = 0;
  let pollVotes = 0;

  for (const session of data.sessions) {
    totalAttendees += attendeeCountOf(session);
    totalQuestions += session.questions.length;
    for (const poll of session.polls) {
      for (const n of poll.tallies) pollVotes += Number(n) || 0;
    }
  }

  // أصوات الأسئلة: نعدّ سجلات التصويت لا العدّاد المشتقّ، فهو يلتقط أي حذف.
  // `?.` احتياط: أي متصل يمرّر كائن أصوات قديماً بلا `questionVotes` لا يسقط.
  const questionVotes = votes
    ? votes.questionVotes?.length ?? 0
    : data.sessions.reduce((sum, s) => sum + s.questions.reduce((a, q) => a + (q.votes || 0), 0), 0);

  return {
    totalAttendees,
    totalQuestions,
    totalVotes: pollVotes + questionVotes,
  };
}

/** يبني نسخة من البيانات تضمن وجود الحقول الأساسية (درع للبيانات القديمة). */
/**
 * حالة الشاشة الافتراضية لجلسة لا تملك `screen` (جلسة قديمة أو جديدة).
 *
 * ⚠️ `manual` + `hold` قرار متّفق عليه: كانت الشاشة تدور تلقائياً على كل
 * المعتمد، فسؤال جمهور كان يظهر أمام الحضور بلا مراجعة بشرية. الآن لا يعرض
 * شيء حتى يضغط المشرف — مع بطاقة «بانتظار المشرف» ولافتة في اللوحة، حتى لا
 * يبدو التوقف عطلاً.
 */
export function defaultScreenState(): QaScreenState {
  return { mode: "manual", slide: { kind: "hold" } };
}

/**
 * يضمن وجود `screen` صالحة على الجلسة (ويصلح البيانات القديمة).
 *
 * ⚠️ لا ثق بحقل `slide` القادم من القرص: قد يكون `null` أو `{}` أو نوعاً
 * مجهولاً (نسخة أقدم من الملف، أو تعديل يدوي). أي قيمة لا تطابق الأنواع
 * المعروفة تسقط إلى `hold` — قيمة مشوّهة أسوأ من شاشة انتظار.
 */
export function normalizeScreen(session: QaSession): QaScreenState {
  const raw = session.screen as Partial<QaScreenState> | undefined | null;
  const mode: QaScreenState["mode"] = raw?.mode === "auto" ? "auto" : "manual";
  const slide = normalizeSlide(raw?.slide);
  if (
    !session.screen ||
    session.screen.mode !== mode ||
    !session.screen.slide ||
    session.screen.slide.kind !== slide.kind
  ) {
    session.screen = { mode, slide, updatedAt: raw?.updatedAt };
  }
  return session.screen;
}

function normalizeSlide(raw: unknown): QaScreenSlide {
  const s = raw as { kind?: unknown; questionId?: unknown; pollId?: unknown } | null | undefined;
  if (!s || typeof s !== "object") return { kind: "hold" };
  if (s.kind === "wordCloud") return { kind: "wordCloud" };
  if (s.kind === "question" && typeof s.questionId === "string" && s.questionId) {
    return { kind: "question", questionId: s.questionId };
  }
  if (s.kind === "poll" && typeof s.pollId === "string" && s.pollId) {
    return { kind: "poll", pollId: s.pollId };
  }
  return { kind: "hold" };
}

/**
 * الأسئلة المؤهَّلة للعرض على الشاشة الكبيرة.
 *
 * ⚠️ ترتيب واحد محسوب على الخادم ومشارك مع `public-view` عبر `orderForScreen`.
 * لو حاسبه كل متصفح وحده، لاختلف زر «التالي» في اللوحة عن الشريحة المعروضة
 * على جهاز العرض — وهذا بالضبط ما نُصلحه.
 */
export function screenEligibleQuestions(session: QaSession): QaQuestion[] {
  return session.questions
    .filter((q) => q.status === "approved" && q.showOnLive !== false && q.answered !== true)
    .sort(orderForScreen);
}

/** الترتيب: المميّز أولاً، ثم الأعلى تصويتاً، ثم الأقدم (ترتيب مستقر). */
export function orderForScreen(a: QaQuestion, b: QaQuestion): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.votes !== b.votes) return b.votes - a.votes;
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

/**
 * يختار الشريحة التالية منطقياً بعد الحالي.
 *
 * يبدأ بعد الشريحة المثبَّتة إن وُجدت مع التفاف إلى الأول عند النهاية، وإلا
 * بدأ من أول سؤال مؤهَّل. ويعيد `hold` إن لم يبقَ شيء يُعرض — حتى لا يبقى
 * المؤشر على سؤال صار مخفياً أو محذوفاً.
 */
export function nextScreenSlide(session: QaSession, current: QaScreenSlide | undefined): QaScreenSlide {
  const pool = screenEligibleQuestions(session);
  if (pool.length === 0) return { kind: "hold" };
  let start = 0;
  if (current?.kind === "question") {
    const i = pool.findIndex((q) => q.id === current.questionId);
    if (i >= 0) start = (i + 1) % pool.length;
  }
  return { kind: "question", questionId: pool[start].id };
}

/**
 * يُسقط الشريحة المثبَّتة إن لم يعد سؤالها مؤهَّلاً للعرض.
 *
 * ⚠️ عند رفض سؤال أو تعليمه «تم الإجابة» أو إخفاؤه من الشاشة، كان المؤشر
 * يبقى عليه: projector يسقطه بصرياً إلى `hold` عبر `resolveScreen` (دفاع
 * في العمق)، لكن اللوحة كانت تستمر بكتابة «المعروض الآن: السؤال X» بعد أن
 * يضغط المشرف «مخفي من الشاشة» — فيُظنّ أن الزر لم يعمل، أو أسوأ: يظنّ أن
 * الشاشة تعرض سؤالاً لا يعرضه شيء. الحقيقة الوحيد: الحالة المخزَّنة يجب أن
 * تُصفَّر في الخادم عند كل تغيير يجعل السؤال غير مؤهَّل.
 *
 * الملاحظة: في الوضع `auto` نُبقي `hold` ولا نُقدّم الشريحة تلقائياً؛ «التالي»
 * قرار المشرف، والدفع التلقائي هنا كان سيخفي عن المشرف ما الذي ظهر فجأة.
 */
export function reconcileScreenSlide(session: QaSession): void {
  const slide = session.screen?.slide;
  if (slide?.kind !== "question") return;
  const stillEligible = screenEligibleQuestions(session).some((q) => q.id === slide.questionId);
  if (!stillEligible) {
    session.screen = { mode: session.screen?.mode ?? "manual", slide: { kind: "hold" } };
  }
}

/**
 * يضمن وجود مصفوفة إجابات على السؤال (ويصلح البيانات القديمة).
 *
 * ⚠️ يمرّر `source` إلى `audience` على السجلات القديمة صراحةً بدل تركه
 * `undefined`، لأن كل فروع العرض تستعمل `q.source === "admin"`، فتلتقط
 * `undefined` falsy وتعرض شارة «جمهور» على سؤال كتبته الإدارة.
 */
export function normalizeAnswers(question: QaQuestion): QaAnswer[] {
  if (!Array.isArray(question.answers)) question.answers = [];
  if (!question.source) question.source = "audience";
  return question.answers;
}

/**
 * حصّة الحاضر الواحد من الإجابات في الجلسة كلها.
 *
 * ⚠️ الرقم ليس عشوائياً: كل إجابة تحتاج **قراراً إنسانياً** من المشرف. 12
 * سؤالاً في جلسة قصيرة تعني 12 قراراً إضافياً فوق أسئلة المراجعة نفسها،
 * فيتأخّر الحديث. من يريد أن يقول أكثر يكتب جواباً واحداً غنياً ويكتمل الردّ
 * بدل أن ينتظر دوره سبع مرات.
 */
export const MAX_ANSWERS_PER_ATTENDEE = 12;

/** 500 محرف: أطول من السؤال (300) لأن الجواب شرح، لكن ليس مقالاً. */
export const MAX_ANSWER_LENGTH = 500;

/** عدد إجابات حاضر معيّن في كل أسئلة الجلسة (لا في سؤال واحد). */
export function countAnswersBy(session: QaSession, attendeeId: string): number {
  let n = 0;
  for (const q of session.questions) {
    for (const a of q.answers ?? []) if (a.attendeeId === attendeeId) n++;
  }
  return n;
}

/**
 * يضيف جواباً مفتوحاً، أو يستبدل جواب الحاضر على نفس السؤال.
 *
 * ⚠️ لماذا «يستبدل» بدل «يضيف»؟ جواب واحد لكل (حاضر × سؤال): بلا ذلك
 * يستطيع حاضر واحد أن يبني جداراً من 20 إجابة على سؤال واحد، فيغرق صندوق
 * المراجعة ويتأخّر سؤالٌ آخر أهمّ. والاستبدال يعطي التصحيح بلا
 * تكلفة: تصحيح خطأ مطبعي.
 *
 * ⚠️ لماذا `pending` عند التعديل رغم أن الجواب كان معتمداً؟ لأن النصّ
 * الجديد لم يره أحد. إبقاء الحالة `approved` يسمح بتعديل نصّ معروض على
 * المتحدث دون مراجعة أخرى — ثغرة إشراف لا واجهة.
 *
 * @throws "answer-quota-reached" عند تجاوز الحصة (عدم التعديل الباطل).
 */
export function upsertAnswer(
  session: QaSession,
  question: QaQuestion,
  attendee: { id: string; name: string },
  text: string,
  now: string
): { answer: QaAnswer; replaced: boolean } {
  const answers = normalizeAnswers(question);
  const existing = answers.find((a) => a.attendeeId === attendee.id);
  if (existing) {
    existing.text = text;
    existing.status = "pending";
    existing.approvedAt = undefined;
    return { answer: existing, replaced: true };
  }
  if (countAnswersBy(session, attendee.id) >= MAX_ANSWERS_PER_ATTENDEE) {
    throw new Error("answer-quota-reached");
  }
  const answer: QaAnswer = {
    id: newId("a"),
    questionId: question.id,
    attendeeId: attendee.id,
    author: attendee.name,
    text,
    status: "pending",
    createdAt: now,
    source: "audience",
  };
  answers.push(answer);
  return { answer, replaced: false };
}

export function normalizeData(data: Partial<QaData> | null | undefined): QaData {
  const base = emptyQaData();
  if (!data) return base;
  return {
    settings: {
      ...base.settings,
      ...(data.settings ?? {}),
    },
    sessions: Array.isArray(data.sessions)
      ? data.sessions.map((s) => {
          const session: QaSession = {
            ...s,
            speakerEnabled: s.speakerEnabled ?? true,
            questions: Array.isArray(s.questions)
              ? s.questions.map((q) => {
                  normalizeAnswers(q);
                  return {
                    ...q,
                    showOnSpeaker: q.showOnSpeaker ?? true,
                    showOnLive: q.showOnLive ?? true,
                  };
                })
              : [],
            polls: Array.isArray(s.polls) ? s.polls : [],
            attendees: Array.isArray(s.attendees) ? s.attendees : [],
            attendeeNames: Array.isArray(s.attendeeNames) ? s.attendeeNames : [],
          };
          // ترحيل حالة الشاشة: جلسة بلا `screen` (كل الجلسات القائمة) تصبح
          // يدوية على «بانتظار المشرف» — قرار متّفق عليه، لا تغيير صامت.
          normalizeScreen(session);
          return session;
        })
      : [],
    meta: {
      ...base.meta,
      ...(data.meta ?? {}),
    },
  };
}
