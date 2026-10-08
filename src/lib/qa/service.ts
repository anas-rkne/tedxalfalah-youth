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

/**
 * يعيد الجلسة النشطة، أو null إن لم توجد جلسة نشطة.
 *
 * ⚠️ تفترض `enforceSingleActiveSession` أن تكون قد مرّت على البيانات. نُبقي
 * `.find()` متعمّداً: بعد الفرض تكون النتيجة واحدة لا تحتمل التأويل، وأي
 * بيانات تعبر من هنا بلا تطبيع تُقرأ كما هي (سلوك قديم) لا بصمت.
 */
export function getActiveSession(data: QaData): QaSession | null {
  return data.sessions.find((s) => s.active) ?? null;
}

/**
 * يفرض **جلسة نشطة واحدة** على مستوى كل البيانات.
 *
 * ⚠️ لماذا لم يكن هذا صحيحاً من قبل؟ `active` كان خاصية يُحرّكها زر «ابدأ»
 * بلا أي قيد، بينما `GET /session/current` يقرأ `sessions.find(s => s.active)`
 * — أي **الأولى** في ترتيب الملف لا الأحدث. فكان بزر ضغطتين متتاليتين
 * ينشئ المشرف جلستين نشطتين، ويعمل «الأسئلة» على واحدة بينما «الكلمة
 * الأخيرة» على أخرى، وتقفز الشاشة إلى جلسة مختلفة في كل نداء. لا خطأ
 * يُرفع، ولا رسالة — فقط سلوك غير متوقّع أمام الحضور.
 *
 * عند التعارض نُبقي **الأحدث إنشاءً** (`createdAt`)، وعند التساوي نُبقي
 * **الأخير في ترتيب الملف**. ⚠️ هذا كسر حتمي لا يُصلح سبب جذره: التفعيل في
 * `POST /admin/session` يجب أن يطفئ البقية أصلاً (حارس 409 إن كان هناك
 * غيرها). الفرض هنا شبكة أمان أخيرة على القرص، وهو ضروري لأن الحالة
 * القائمة اليوم قد تحتوي جلستين نشطتين.
 */
export function enforceSingleActiveSession(sessions: QaSession[]): QaSession[] {
  const activeIndexes: number[] = [];
  sessions.forEach((s, i) => {
    if (s.active) activeIndexes.push(i);
  });
  if (activeIndexes.length <= 1) return sessions;

  let keep = activeIndexes[0];
  for (const i of activeIndexes.slice(1)) {
    const a = sessions[keep].createdAt ?? "";
    const b = sessions[i].createdAt ?? "";
    if (b > a) keep = i;
  }
  for (const i of activeIndexes) {
    if (i !== keep) sessions[i].active = false;
  }
  return sessions;
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
 * ترحيل حقول الظهور من `showOnLive` إلى `showToAudience` + `showOnProjector`.
 *
 * ⚠️ قاعدة الترحيل: `showOnLive` كان يتحكم بالمشروعور وحده، ولم تكن هناك
 * أي وسيلة لإخفاء سؤال عن هواتف الحضور. لذلك ننسخه إلى **الحقلين معاً** —
 * لا إلى المشروعور فقط — ليبقى السلوك كما كان بالحرف بعد الترحيل:
 *
 *   - سؤال ظاهر على الشاشة ⇒ ظاهر على المشروعور **و** على أجهزة الجمهور.
 *   - سؤال مخفي من الشاشة ⇒ مخفي من الاثنين.
 *
 * أما نسخه إلى المشروعور وحده فيُحدث انقلاباً صامتاً وواسعاً: بمجرد نشر
 * النسخة الجديدة، كل سؤال كان ظاهراً على الشاشة يختفي عن هواتف الحضور،
 * لأن `showToAudience` يبقى `undefined` فلا يُقرأ كـ«ظاهر». هذا أخطر خطأ
 * يمكن ارتكابه في ترحيل كهذا، ولذلك التكرار هنا مقصود لا زائد.
 *
 * الأولوية للنسخة الجديدة إن وُجدت: لا نطمس قراراً حديثاً بسبب حقل قديم
 * باقٍ على القرص.
 */
export function migrateQuestionVisibility(q: QaQuestion): QaQuestion {
  const legacy = q.showOnLive;
  if (typeof legacy === "boolean") {
    if (typeof q.showToAudience !== "boolean") q.showToAudience = legacy;
    if (typeof q.showOnProjector !== "boolean") q.showOnProjector = legacy;
  }
  // غائبتان = ظاهر (الافتراضي التاريخي `!== false`).
  if (typeof q.showToAudience !== "boolean") q.showToAudience = true;
  if (typeof q.showOnProjector !== "boolean") q.showOnProjector = true;
  if (typeof q.showOnSpeaker !== "boolean") q.showOnSpeaker = true;
  return q;
}

/**
 * قراءات الظهور الثلاثة — المصدر الوحيد للحقيقة.
 *
 * ⚠️ لماذا دوال بدل `q.showOnProjector !== false` مكتوباً في كل موضع؟
 * لأن الاعتماد على أن `normalizeData` «سبق تشغيله» هشّ بطبيعته. الاختبارات
 * كشفته: `screenEligibleQuestions` كانت تُقرأ حقلاً لم يُرحَّل في جلسة مُركّبة
 * مباشرة، فسؤال بـ`showOnLive: false` صار **مؤهَّلاً للعرض** — أي أن زر
 * «إخفاء من الشاشة» بدا معطوباً أو فعّالاً حسب من مرّ بالتهيئة أولاً.
 *
 * القاعدة هنا: لا بد من ترحيل، لكن القراءة لا تعتمد عليه. الأولوية للحقل
 * الجديد، ثم القديم، ثم «ظاهر» افتراضياً. هكذا لا يخطئ أي مستهلك سواء
 * مُرحَّل بياناته أم لا.
 */
export function isProjectorVisible(q: QaQuestion): boolean {
  if (typeof q.showOnProjector === "boolean") return q.showOnProjector;
  if (typeof q.showOnLive === "boolean") return q.showOnLive;
  return true;
}

export function isAudienceVisible(q: QaQuestion): boolean {
  if (typeof q.showToAudience === "boolean") return q.showToAudience;
  if (typeof q.showOnLive === "boolean") return q.showOnLive;
  return true;
}

export function isSpeakerVisible(q: QaQuestion): boolean {
  if (typeof q.showOnSpeaker === "boolean") return q.showOnSpeaker;
  return true;
}

/**
 * الأسئلة المؤهَّلة للعرض على الشاشة الكبيرة.
 *
 * ⚠️ ترتيب واحد محسوب على الخادم ومشارك مع `public-view` عبر `orderForScreen`.
 * لو حاسبه كل متصفح وحده، لاختلف زر «التالي» في اللوحة عن الشريحة المعروضة
 * على جهاز العرض — وهذا بالضبط ما نُصلحه.
 *
 * ⚠️ الشرط على `showOnProjector` لا `showToAudience`: الأول منظّم
 * المشروعور، والثاني لأجهزة الحضور. خلطهما هو ما جعل زر «إظهار/إخفاء»
 * واحداً يبدو كأنه يقرّر شيئاً لا يقرّره.
 */
export function screenEligibleQuestions(session: QaSession): QaQuestion[] {
  return session.questions
    .filter((q) => q.status === "approved" && isProjectorVisible(q) && q.answered !== true)
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
 * قراءة `patch.visibility` وتطبيقه على سؤال، مع إرجاع ما إذا سقط السؤال من
 * المشروعور (لإسقاط الشريحة المثبَّتة).
 *
 * ⚠️Rule الحاكم: `patch.legacyLive` (الحقل القديم `showOnLive`) يضبط **الوجهين
 * معاً** — هذا مسار إقلاع اللوحات التي لا تعرف الفصل بعد. الحقول الجديدة
 * منفصلة تماماً: إخفاء سؤال عن الجمهور لا يمسّ الشاشة.
 *
 * ⚠️`q.showOnLive` لا يُكتب أبداً. كتابته تجعله يبدو «حيّاً» على القرص، فينحاز
 * قارئ قديم (أو نسخة احتياطية تُرحَّل لاحقاً) إلى قيمة انحازت عن الفصل الجديد.
 * يبقى الحقل أثراً تاريخياً للترحيل فقط.
 */
export function applyVisibilityChange(
  question: QaQuestion,
  patch: { speaker?: boolean; audience?: boolean; projector?: boolean; legacyLive?: boolean }
): { droppedFromProjector: boolean } {
  let droppedFromProjector = false;

  if (typeof patch.speaker === "boolean") question.showOnSpeaker = patch.speaker;

  const audienceTarget = patch.audience ?? patch.legacyLive;
  if (typeof audienceTarget === "boolean") {
    question.showToAudience = audienceTarget;
  }

  const projectorTarget = patch.projector ?? patch.legacyLive;
  if (typeof projectorTarget === "boolean") {
    // فقط الانتقال من «ظاهر» إلى «مخفي» هو ما يُسقط الشريحة. إعادته ظاهراً
    // لا يُعيد شيئاً — الشريحة سقطت فعلاً وتحتاج `setSlide` صريحاً.
    if (isProjectorVisible(question) === true && projectorTarget === false) {
      droppedFromProjector = true;
    }
    question.showOnProjector = projectorTarget;
  }

  return { droppedFromProjector };
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

/**
 * توحيد شكل البيانات القديمة + الترحيل + فرض جلسة نشطة واحدة.
 *
 * ⚠️ `readQaData` يمرّ على **كل** قراءة عبر هذه الدالة، فأي ترحيل هنا يسري
 * تلقائياً بلا سكربت ولا خطوة يدوية. ولهذا يبقى الملف القديم على القرص كما
 * هو: الحقول الجديدة تُشتقّ في الذاكرة عند كل قراءة وتُكتب مع أول تعديل.
 * هذا يعني أن الترحيل آمن دائماً (لا نكتب للقرص إلا داخل قفل الكتابة) وأن
 * الملف الخام يبقى صالحاً للاسترجاع إن تراجعنا.
 */
export function normalizeData(data: Partial<QaData> | null | undefined): QaData {
  const base = emptyQaData();
  if (!data) return base;
  const sessions = enforceSingleActiveSession(
    Array.isArray(data.sessions)
      ? data.sessions.map((s) => {
          const session: QaSession = {
            ...s,
            speakerEnabled: s.speakerEnabled ?? true,
            questions: Array.isArray(s.questions)
              ? s.questions.map((q) => {
                  normalizeAnswers(q);
                  return migrateQuestionVisibility(q);
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
      : []
  );
  return {
    settings: {
      ...base.settings,
      ...(data.settings ?? {}),
    },
    sessions,
    meta: {
      ...base.meta,
      ...(data.meta ?? {}),
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Word Cloud — حساب خالص بلا DOM
 *
 * وضعها هنا لا في المكوّن عن قصد: تحتاج اختبار وحدة، و`service.ts` هو
 * الملف الوحيد بلا React ولا canvas، فيستطيع `qa-unit` تحميله.
 * المكوّن يمرّر دالة قياس النص، والتخطيط قطع Archimedean بصفر عشوائية.
 * ──────────────────────────────────────────────────────────────────────── */

export interface WordEntry {
  /** الكلمة كما تُعرض على الشاشة، لا كما تُطوى. */
  text: string;
  /** عدد الأسئلة التي وردت فيها، لا عدد مرات التكرار. */
  count: number;
}

/** كلمة بمفتاحَيها: مفتاح للعدّ المجمَّع، واسم للعرض. */
export interface TokenPair {
  key: string;
  display: string;
}

export interface PlacedWord extends WordEntry {
  /** حجم الخط بالبكسل كما حسبه `computeFontSizes`. */
  fontPx: number;
  /** الصندوق المطلق داخل الحاوية، بالبكسل. */
  x: number;
  y: number;
  boxWidth: number;
  boxHeight: number;
}

export interface WordCloudOptions {
  width: number;
  height: number;
  measure: (text: string, fontPx: number) => { width: number; height: number };
  /** أقل فراغ بين صندوقين، بالبكسل. */
  gap?: number;
  /** حدّ محاولات الوضع لكل كلمة. */
  maxAttempts?: number;
}

/**
 * نطاق التشكيل، **يشمل التطويل 0640**.
 *
 * ⚠️ الفجوة بين 061A و064B استثنائية: التطويل يقع داخلها، فإغفالها
 * يُبقي «مــدرسة» على حروفها المنفصلة.
 */
const TASHKEEL = /[\u0610-\u061A\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

/**
 * يفصل النص عند كل محرف ليس حرفاً ولا رقماً.
 *
 * ⚠️ المسافة محرف `\s` فلا يفصلها هذا النمط. القسمة على «غير حرف ولا رقم»
 * بالضبط هي ما يفصل عند المسافة والرمز معاً؛ وتوسيع النطاق إلى `\s`
 * يجعل السؤال كله كلمةً واحدة.
 */
const NON_WORD = /[^\p{L}\p{N}]+/u;

/**
 * طيّ صور الحروف لمطابقة الأخطاء الإملائية معاً.
 *
 * الترتيب مقصود: `NFKC` أولاً يطوي الحروف المركّبة والصيغ التقديمية،
 * ثم يُزال التشكيل، ثم الأرقام الهندية تصير لاتينية فيطابقها النطاق
 * اللاحق.
 *
 * ⚠️ هذه الدالة **لا تُستخدم للعرض**. طي التاء المربوطة يجعل «القيادة»
 * تُطبع «القياده» على الشاشة الكبرى أمام الحضور. الطي للعدّ فقط، والعرض
 * يبقى على أكثر الأشكال الأصلية وروداً.
 */
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(TASHKEEL, "")
    .replace(ARABIC_INDIC_DIGITS, (d) => {
      const code = d.charCodeAt(0);
      const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
      return String(code - base);
    })
    .replace(/[أإآٱ]/g, "\u0627")
    .replace(/\u0649/g, "\u064a")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064a")
    .replace(/\u0629/g, "\u0647");
}

/**
 * كلمات التوقف قبل التطبيع.
 *
 * ⚠️ يجب تمريرها بـ`normalizeArabic` عند البناء: «إن» تصير «ان» و«هذه»
 * تصير «هذهة» بعد الطي، ومجموعة غير مطبَّعة لا تطابق أبداً، فتبقى أكثر
 * الكلمات تكراراً في كل سحابة.
 */
const RAW_STOP_WORDS = [
  // English
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "out", "off", "over",
  "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same",
  "so", "than", "too", "very", "just", "about", "also", "what", "which",
  "who", "whom", "this", "that", "these", "those", "and", "but", "or",
  "if", "because", "while", "although", "until", "since", "i", "me",
  "my", "myself", "we", "our", "ours", "you", "your", "he", "him",
  "his", "she", "her", "it", "its", "they", "them", "their", "theirs",
  // Arabic
  "من", "في", "على", "إلى", "عن", "مع", "بين", "بعد", "قبل", "أن",
  "إن", "لا", "ما", "هل", "كيف", "لماذا", "متى", "ماذا", "أين", "هذا",
  "هذه", "ذلك", "تلك", "التي", "الذي", "الذين", "هي", "هو", "نحن", "أنت",
  "أنا", "كل", "بعض", "قد", "لم", "لن", "كان", "يكون", "كأن", "كما",
  "و", "أو", "ثم", "بل", "لكن", "حتى", "إذا", "لو", "عند", "لمّا",
  "أكثر", "أقل", "جداً", "كثير", "قليل", "يمكن", "يجب", "ضد", "شأن",
];

const STOP_WORDS = new Set(RAW_STOP_WORDS.map(normalizeArabic));

/** أقل طول كلمة مقبولة؛ يمنع تسرّب الحروف المفردة مثل «ب». */
const MIN_WORD_LENGTH = 3;

/**
 * أقصى عدد أسئلة تُحتسب لكلمة واحدة.
 *
 * بدون سقف، كلمة واحدة مكرَّرة في عشرين سؤالاً تتحوّل إلى المعنى الوحيد
 * الظاهر في السحابة. السقف يوزّع الانتباه، وأربعة أسئلة دليل كافٍ على
 * كلمة.
 */
const MAX_QUESTIONS_PER_WORD = 4;

/**
 * يحوّل نصاً إلى أزواج (مفتاح عدّ، اسم عرض).
 *
 * ⚠️ الترتيب حاسم: التشكيل يُزال **قبل** القسمة. علامات التشكيل من
 * الفئة `Mn` لا `L`، فالقسمة على «غير حرف» تمرّ عليها وتقطّع كل كلمة
 * مشكولة إلى حروفها المفردة — و«الْحياة» تصير «ال» و«حياة»، فتسقط
 * «ال» لقِصرها ويُحسب الخطأ «حياة».
 */
export function tokenizeArabic(text: string): TokenPair[] {
  const out: TokenPair[] = [];
  const cleaned = text
    .toLowerCase()
    .normalize("NFKC")
    .replace(TASHKEEL, "");

  for (const raw of cleaned.split(NON_WORD)) {
    if (!raw) continue;
    const key = normalizeArabic(raw);
    if (key.length < MIN_WORD_LENGTH) continue;
    if (STOP_WORDS.has(key)) continue;
    // `raw` هو شكل العرض: طُبِّق عليه NFKC وإزالة التشكيل، ولم يُطوَ.
    out.push({ key, display: raw });
  }
  return out;
}

/**
 * يحسب تكرار الكلمات من نصوص الأسئلة.
 *
 * ⚠️ `count` هو عدد **الأسئلة** التي وردت فيها الكلمة، لا عدد مرات
 * ورودها. تكرارها عشر مرات في سؤال واحد لا يجعلها أهم من كلمة وردت في
 * عشرة أسئلة مختلفة: الأول تكرار فرد، والثاني اتجاه جماعي. لذلك نعدّ
 * مجموعة أسئلة لكل كلمة، لا عدّاد تكرار.
 *
 * ⚠️ العدّ بالمفتاح المطوي والعرض بالأصل: «الحياة» و«الحياة» و«حَياة»
 * كلمة واحدة في العدّ، وتُعرض بصيغتها الأصلية الأكثر وروداً. لا تُطبع
 * الكلمة على الشاشة الكبرى بشكلها المطوي.
 *
 * الترتيب تنازلي ثم أبجدي صاعد، وهو حاسم لا تجميلي: لو اعتمدنا على
 * ترتيب الإدخال فقط لقفزت السحابة أمام الحضور كلما تغيّر ترتيب الأسئلة.
 */
export function calculateWordFrequency(
  texts: readonly string[],
  maxWords = 50,
): WordEntry[] {
  interface Bucket {
    questions: Set<number>;
    forms: Map<string, number>;
  }
  const buckets = new Map<string, Bucket>();

  texts.forEach((text, index) => {
    // مجموعة مفاتيح: تكرار الكلمة في السؤال نفسه لا يُنشئ سؤالاً ثانياً
    // ولا يُضاعف عدّ الشكل الأكثر وروداً.
    const seen = new Set<string>();
    for (const { key, display } of tokenizeArabic(text)) {
      if (seen.has(key)) continue;
      seen.add(key);

      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { questions: new Set<number>(), forms: new Map<string, number>() };
        buckets.set(key, bucket);
      }
      if (bucket.questions.size < MAX_QUESTIONS_PER_WORD) {
        bucket.questions.add(index);
      }
      bucket.forms.set(display, (bucket.forms.get(display) ?? 0) + 1);
    }
  });

  const entries: WordEntry[] = [];
  buckets.forEach((bucket) => {
    // أكثر الأشكال الأصلية وروداً هو ما يُعرض. التسوية أبجدية لا بترتيب
    // الإدخال، فالنتيجة لا تتغيّر بتغيّر ترتيب الأسئلة.
    let best = "";
    let bestCount = -1;
    for (const [form, n] of bucket.forms) {
      if (n > bestCount || (n === bestCount && form.localeCompare(best, "ar") < 0)) {
        best = form;
        bestCount = n;
      }
    }
    entries.push({ text: best, count: bucket.questions.size });
  });

  return entries
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, "ar"))
    .slice(0, maxWords);
}

/**
 * أحجام الخطوط بالبكسل.
 *
 * الجذر التربيعي مقصود: كلمة نسبتها 1/20 تعطي 0.22 لا 0.05، فلا تختفي
 * الكلمات النادرة خلف حدّ أدنى مسطّح.
 */
export function computeFontSizes(
  words: readonly WordEntry[],
  minPx: number,
  maxPx: number,
): number[] {
  const maxCount = words.reduce((m, w) => Math.max(m, w.count), 0);
  if (maxCount <= 0) return words.map(() => minPx);
  return words.map((w) => {
    const ratio = w.count / maxCount;
    return minPx + (maxPx - minPx) * Math.sqrt(ratio);
  });
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** هل يتقاطع صندوقان مع احترام `gap`؟ */
function overlaps(a: Box, b: Box, gap: number): boolean {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

/**
 * تخطيط لولبي قطع Archimedean على نمط Horowitz وBloom.
 *
 * الخوارزمية لا تعرف شيئاً عن Word Cloud ولا عن React: تستقبل `measure`
 * فتُختبر في Node بمقياس وهمي، وتُقاس في المتصفح بلوحة canvas.
 *
 * التفاصيل الحاسمة:
 *  1. **صفر عشوائية**: الموضع دالة في ترتيب الكلمات وفي الزاوية. لا
 *     `Math.random` ولا وقت، فإعادة القياس تُنتج السحابة نفسها بالبكسل،
 *     وهذا شرط لأن العرض يُحسب من قياس الحاوية ويعاد كل resize.
 *  2. `r = step * t` يبدأ من المركز فيُوضع أكبر خط أولاً، والزاوية
 *     تزيد ولا تعود أبداً، فلا نعيد اختبار المواضع الفاشلة.
 *  3. نكسر عند تجاوز نصف القطر الأقصى: تجاوزه يعني أن الحاوية امتلأت،
 *     فالكلمات الأصغر لن تُوضع أيضاً، فالمتابعة إضاعة وقتٍ بلا نتيجة.
 */
export function layoutSpiral(
  words: readonly WordEntry[],
  fontPx: readonly number[],
  options: WordCloudOptions,
): PlacedWord[] {
  const {
    width,
    height,
    measure,
    gap = 6,
    maxAttempts = 2200,
  } = options;

  if (words.length === 0 || width <= 0 || height <= 0) return [];
  if (words.length !== fontPx.length) {
    throw new Error(
      `layoutSpiral: عدد الكلمات ${words.length} لا يساوي عدد الأحجام ${fontPx.length}`,
    );
  }

  // القياس مرة واحدة لكل كلمة: مقياس المتصفح يستدعي canvas.
  const boxes = words.map((w, i) => {
    const m = measure(w.text, fontPx[i]);
    return {
      word: w,
      fontPx: fontPx[i],
      w: Math.max(1, m.width),
      h: Math.max(1, m.height),
    };
  });

  // الأكبر أولاً. الفاصل برقم الموضع لا بالمقارنة النصية: الترتيب
  // هنا هو ترتيب `calculateWordFrequency` وهو ثابت بالفعل.
  const order = boxes
    .map((_, i) => i)
    .sort((a, b) => boxes[b].fontPx - boxes[a].fontPx || a - b);

  const largestFont = boxes[order[0]].fontPx;
  // خطوة اللولب تتناسب مع أكبر خط: سحابة بخطوط كبيرة تحتاج مسافة أوسع
  // بين المواضع من سحابة بخطوط صغيرة بنفس عدد الكلمات.
  const step = Math.max(1, largestFont * 0.3);

  const centerX = width / 2;
  const centerY = height / 2;
  const placed: PlacedWord[] = [];
  const rects: Box[] = [];
  let angle = 0;

  for (const idx of order) {
    const box = boxes[idx];
    const halfW = box.w / 2;
    const halfH = box.h / 2;

    // الخطوة الزاوية تقفز نصف سطر، فلا نضيّع محاولات على نقاط متلاصقة.
    const dAngle = Math.max(0.05, (box.h * 0.5 + gap * 0.5) / step);

    // أقصى نصف قطر يتّسع فيه هذا الصندوق بين الحواف.
    const maxRadius = Math.max(0, Math.min(centerX - halfW, centerY - halfH));
    if (maxRadius <= 0) continue;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const radius = step * angle;
      if (radius > maxRadius) break;

      const candidate: Box = {
        x: centerX + radius * Math.cos(angle) - halfW,
        y: centerY + radius * Math.sin(angle) - halfH,
        w: box.w,
        h: box.h,
      };
      angle += dAngle;

      if (candidate.x < 0 || candidate.y < 0) continue;
      if (candidate.x + box.w > width) continue;
      if (candidate.y + box.h > height) continue;

      let clash = false;
      for (const other of rects) {
        if (overlaps(candidate, other, gap)) {
          clash = true;
          break;
        }
      }
      if (clash) continue;

      rects.push(candidate);
      placed.push({
        ...box.word,
        fontPx: box.fontPx,
        x: candidate.x,
        y: candidate.y,
        boxWidth: box.w,
        boxHeight: box.h,
      });
      break;
    }
  }

  return placed;
}
