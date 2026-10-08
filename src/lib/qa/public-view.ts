/**
 * بناء "لقطة العرض العام" لنظام جدار الأسئلة الحية.
 *
 * ⚠️ لماذا هذا الملف منفصل؟
 * نقطة `/api/qa/session/current` ونقطة البث `/api/qa/stream` ترسلان **نفس**
 * البيانات إلى نفس المستهلكين (شاشة العرض، شاشة المتحدث). حين كانت كل منهما
 * تبني استجابتها بنفسها، انحرف شكل البث عن الشكل الذي تنتظره الواجهة فصارت
 * شاشة العرض تعلق على حالة "استعدوا..." ما دام البث متصلاً — إضافةً إلى أن البث
 * المكشوف كان يسرّب الأسئلة المعلّقة والمرفوضة بكل الجلسات.
 *
 * الآن صار هناك **بائع واحد** للصورة العامة، فيستحيل أن ينحرف الشكل بين النقطتين
 * مهما أُضيفت حقول لاحقاً.
 *
 * القاعدة الذهبية: كل شيء يُعرض للعموم يمرّ من هنا. لا حقل إداري (status, tag,
 * sentiment, attendeeNames) يتسرّب إلى العامة.
 */
import type { QaData, QaPoll, QaQuestion, QaScreenSlide, QaSession, QaSettings } from "./types";
import {
  attendeeCountOf,
  findAttendee,
  getActiveSession,
  isAudienceVisible,
  isProjectorVisible,
  isSpeakerVisible,
  normalizeData,
  normalizeScreen,
} from "./service";

/**
 * أي شاشة تطلب اللقطة.
 *
 * ⚠️ `audience` جهاز الحاضر (هاتفه). كان الحضور والعرض يقرآن الحقل نفسه
 * (`showOnLive`) — وهو ما جعل المشروعور يحكم على الهواتف: زر واحد يقرّر
 * شيئاً لا يقرّره. الآن لكل وجه حقله:
 *
 *   - `speaker`   → `showOnSpeaker`   (شاشة المتحدث)
 *   - `live`      → `showOnProjector` (المشروعور)
 *   - `audience`  → `showToAudience`  (أجهزة الحضور)
 */
export type QaView = "live" | "speaker" | "audience";

export function isQaView(value: unknown): value is QaView {
  return value === "live" || value === "speaker" || value === "audience";
}

/**
 * هل السؤال يظهر على هذه الشاشة؟
 *
 * ⚠️ يقود دائماً إلى قراءات `service` (مع مراعاة الحقل القديم) بدل مقارنة
 * حقل مباشرة. لو قُرئ `q.showOnProjector !== false` هنا لأخفى الترحيلُ
 * غيرُ المُرحَّل كل سؤال قديم، بينما لو قُرئ `!== false` وحده لَأظهر
 * أولُ غيرِ المُرحَّل سؤالاً مخفياً. القيم الثلاث في مكان واحد تمنع هذا
 * التناقض نهائياً.
 */
function visibleFor(q: QaQuestion, view: QaView): boolean {
  if (view === "speaker") return isSpeakerVisible(q);
  if (view === "audience") return isAudienceVisible(q);
  return isProjectorVisible(q);
}

export interface PublicAnswer {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface PublicQuestion {
  id: string;
  author: string;
  text: string;
  votes: number;
  featured: boolean;
  answered: boolean;
  /**
   * هل السؤال معروض على هذه الشاشة تحديداً (بعد تطبيق حقل وجهها: أحد
   * `showOnSpeaker` / `showOnProjector` / `showToAudience`).
   */
  visible: boolean;
  /**
   * الإجابات **المعتمدة فقط** لهذا السؤال.
   *
   * ⚠️ `pending` و`rejected` لا يخرجان من هنا أبداً: صاحب الجواب يرى
   * نسخته المعلّقة محلياً على جهازه (من ردّ نقطة الإضافة)، وبقيّة الحضور
   * والمتحدث لا يرونها حتى يعتمدها المشرف. كما لا نكشف `attendeeId` —
   * لا يحتاجه أي مستهلك عام، وإطلاقه يربط الجواب بهويّة قابلة للتتبّع.
   */
  answers: PublicAnswer[];
}

export interface PublicPoll {
  id: string;
  prompt: string;
  promptAr?: string;
  options: string[];
  optionsAr?: string[];
  active: boolean;
  showResults: boolean;
  /** null = النتائج محجوبة أثناء التصويت (منع التأثير على الحضور). */
  tallies: number[] | null;
  totalVotes: number | null;
}

export interface PublicSessionInfo {
  id: string;
  title: string;
  titleAr?: string;
  acceptingQuestions: boolean;
  speakerEnabled: boolean;
  attendeeCount: number;
}

/**
 * سؤال **صاحبه** فقط: `{ id, status, text }`.
 *
 * 🎯 هذا ما كان ناقصاً ليعرف الحاضر مصير سؤاله (فجوة F5): رُفض أو اعتُمد
 * أو بقي معلّقاً — والحاضر كان يراه «أُرسل» إلى الأبد، وهو أطول انتظار
 * بلا معلومة في أي واجهة submitting.
 *
 * ⛔ النطاق مقصور على `attendeeId` المطلوب **ومتحقَّق منه**: الحقل موجود
 * داخل اللقطة العامة، فلو أُعيد كل ما يحمل `attendeeId` لقرأ أي زائر
 * الأسئلة المعلّقة والمرفوضة للجميع — وهو التسريب الذي يمنع هذا الملف
 * أصلاً. الحقل اختياري في اللقطة: بلا `attendeeId` ⇒ لا `myQuestions` إطلاقاً،
 * فيبقى مشروعور العرض وشاشة المتحدث بلا أثر.
 */
export interface MyQuestion {
  id: string;
  status: "pending" | "approved" | "rejected";
  text: string;
}

/**
 * إجابة **صاحبها** فقط — نظير `MyQuestion` للإجابات.
 *
 * 🎯 `QaAnswer.attendeeId` كان موجوداً منذ الأصل (بخلاف السؤال الذي كان
 * ينقصه `attendeeId`)، فكان ينقص فقط الطريق: قراءة الحالة. فرفض الإجابة
 * كان يرفعها عن الجمهور بصمت — يبقى نصّها «أُرسل» عند كاتبها إلى الأبد.
 *
 * ⛔ نفس قواعد النطاق: صاحبة المعرّف فقط، و`[]` إن كان المعرّف مجهولاً.
 */
export interface MyAnswer {
  id: string;
  /**
   * معرّف السؤال الحاضِر — لا معرّف الإجابة وحده.
   *
   * 🎯 `LiveParticipate` يربط «إجابتي المعلّقة» بـ`questionId` (لأن البطاقة
   * تُعرض داخل السؤال نفسه)، فبلا هذا الحقل لا يطابق حالة الإجابة بسؤالها.
   */
  questionId: string;
  status: "pending" | "approved" | "rejected";
  text: string;
}

export interface PublicScreen {
  mode: "manual" | "auto";
  /**
   * ما يُعرض الآن — **معرّف فقط**.
   *
   * ⚠️ لا نرسل `slide` كما هو دون ترشيح: لو أرسلنا `{kind:"question",
   * questionId}` لسؤال `pending` أو `rejected`، لبقي المعرّف في لقطة عامة
   * فيكشف وجود سؤال لم يُعتمد — تسريب صامت، رغم أن نصّه غير مقروء. لذلك
   * `resolveScreen` هنا يرجّع `hold` إن لم يكن المؤهَّل ضمن القائمة
   * المرشَّحة، فيبقى المرشِّح مصدر الحقيقة الوحيد.
   */
  slide: QaScreenSlide;
}

export interface PublicSnapshot {
  active: boolean;
  settings: QaSettings;
  session: PublicSessionInfo | null;
  questions: PublicQuestion[];
  polls: PublicPoll[];
  screen: PublicScreen;
  /**
   * أسئلة الحاضر نفسه، إن طُلب `attendeeId` وصاحبُه مسجَّل في الجلسة.
   *
   * ⛔ غائب تماماً (لا مصفوفة فارغة) بلا معرّف: يجب ألّا يبنوا
   * «لم تُقبل أسئلتك» من غياب حقل، بل من `myQuestions === undefined`.
   */
  myQuestions?: MyQuestion[];
  /** نظيرها للإجابات — انظر `MyAnswer`. */
  myAnswers?: MyAnswer[];
}

/**
 * يحوّل `screen` الخام إلى شريحة **محسومة** للعرض العام.
 *
 * ⚠️ القاعدة: لا نثق بـ`slide` الواردة من القرص ولا من المشرف. المؤشر يُقبل
 * فقط إن كان يشير إلى عضو في القائمة المرشَّحة التي بُنيت للتو:
 *  - سؤال يجب أن يكون `approved` وغير مخفي وغير «تم الإجابة»؛
 *  - استطلاع يجب أن يكون موجوداً في الجلسة.
 * وكل ما عداه → `hold`. فالقاعدة الواحدة: **العام لا يرى إلا ما استُحقّ**.
 */
function resolveScreen(
  session: QaSession,
  visible: PublicQuestion[],
  polls: PublicPoll[]
): PublicScreen {
  const screen = normalizeScreen(session);
  const slide = screen.slide;

  if (slide.kind === "question") {
    // ⚠️ `visible` و`answered` شرطان لا مجرّد تسمية:
    //  - السؤال المخفي يبقى في المصفوفة (الجمهور يقرأه ويسوّي عليه)، فلو
    //    اكتفينا بمطابقة المعرّف لَظَهَرَ بعد إخفائه بزر «مخفي من الشاشة».
    //  - السؤال «تم الإجابة عنه» يبقى معتمداً في القائمة، لكن `service`
    //    يستبعده من ترتيب الشاشة — ولو اختلفت القاعدتان لأمكن أن تعرض
    //    الشاشة سؤالاً يرفض `/admin/screen` تثبيته.
    const ok = visible.some((qq) => qq.id === slide.questionId && qq.visible && !qq.answered);
    return { mode: screen.mode, slide: ok ? { kind: "question", questionId: slide.questionId } : { kind: "hold" } };
  }
  if (slide.kind === "poll") {
    const ok = polls.some((p) => p.id === slide.pollId);
    return { mode: screen.mode, slide: ok ? { kind: "poll", pollId: slide.pollId } : { kind: "hold" } };
  }
  return { mode: screen.mode, slide: slide.kind === "wordCloud" ? { kind: "wordCloud" } : { kind: "hold" } };
}

function toPublicQuestion(q: QaQuestion, view: QaView): PublicQuestion {
  return {
    id: q.id,
    author: q.author,
    text: q.text,
    votes: q.votes,
    featured: q.featured,
    answered: q.answered === true,
    visible: visibleFor(q, view),
    // الترتيب: الأقدم أولاً — يهمّ من قال ذلك أولاً لا من كتب أكثر،
    // و`localeCompare` على ISO-8601 ترتيب ثابت لا يتغيّر مع كل لقطة.
    answers: (q.answers ?? [])
      .filter((a) => a.status === "approved")
      .map((a) => ({ id: a.id, author: a.author, text: a.text, createdAt: a.createdAt }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

/** الترتيب: المميّز أولاً، ثم الأعلى تصويتاً، ثم الأقدم. */
function sortForDisplay(a: PublicQuestion, b: PublicQuestion): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.votes !== b.votes) return b.votes - a.votes;
  return 0;
}

function toPublicPoll(p: QaPoll): PublicPoll {
  /**
   * ⛔ `showResults` وحده هو مصدر الحقيقة: **هل طُلب عرض النتائج؟**
   *
   * الفجوة (F1): كان الشرط `showResults || !active`، فأي استطلاع مُنشأ
   * حديثاً — `active: false, showResults: false` — خرج كأنّه **منتهٍ
   * بأصفار**: أرقام مئوية على الشاشة الكبرى قبل أن يُسأل السؤال أصلاً.
   * والأسوأ: الإخفاء المقصود (`showResults: false` على استطلاع جرى) كان
   * يُغلق بنفس الجملة، فلا أثر له.
   *
   * أما إيقاف التصويت (`stop`) فقد يكتب `showResults: true` أصلاً،
   * فيظهر ما يجب دون `||` إطلاقاً. والاستطلاع النشط محجوب دائماً.
   */
  const resultsOpen = p.showResults === true && p.active !== true;
  return {
    id: p.id,
    prompt: p.prompt,
    promptAr: p.promptAr,
    options: p.options,
    optionsAr: p.optionsAr,
    active: p.active === true,
    showResults: p.showResults === true,
    // أثناء التصويت النشط تكون النتائج محجوبة، وبعد الإيقاف تُعرض.
    tallies: resultsOpen ? p.tallies : null,
    totalVotes: resultsOpen ? p.tallies.reduce((a, b) => a + b, 0) : null,
  };
}

function toPublicSessionInfo(s: QaSession): PublicSessionInfo {
  return {
    id: s.id,
    title: s.title,
    titleAr: s.titleAr,
    acceptingQuestions: s.acceptingQuestions === true,
    speakerEnabled: s.speakerEnabled !== false,
    attendeeCount: attendeeCountOf(s),
  };
}

/**
 * أسئلة الحاضر المطلوب — مصفوفة فارغة إن لم يُعثر عليه.
 *
 * 🎯 الفراغ مقصود: `attendeeId` مُختلق أو من جلسة أخرى ⇒ `[]` لا 404،
 * فلا يميّز المهاجم بين الحالتين. والحالة `undefined` (لا حقل) تُبقي
 * المشروعور والمتحدث بلا المعلومة أصلاً.
 */
function toMyQuestions(session: QaSession, attendeeId: string | undefined): MyQuestion[] {
  if (!attendeeId) return [];
  if (!findAttendee(session, attendeeId)) return [];
  return session.questions
    .filter((q) => q.attendeeId === attendeeId)
    .map((q) => ({ id: q.id, status: q.status, text: q.text }));
}

/** إجابات الحاضر نفسه بحالاتها — انظر `MyAnswer`. */
function toMyAnswers(session: QaSession, attendeeId: string | undefined): MyAnswer[] {
  if (!attendeeId) return [];
  if (!findAttendee(session, attendeeId)) return [];
  return session.questions
    .flatMap((q) => (q.answers ?? []).map((answer) => ({ answer, questionId: q.id })))
    .filter(({ answer }) => answer.attendeeId === attendeeId)
    .map(({ answer, questionId }) => ({
      id: answer.id,
      questionId,
      status: answer.status,
      text: answer.text,
    }));
}

/**
 * يبني اللقطة العامة من بيانات خام (غير مطبَّعة) — يتولّى `normalizeData` داخلياً
 * حتى لا يخطئ أي مستهلك ويستخدم بيانات قديمة بلا الحقول الجديدة.
 */
export function buildPublicSnapshot(
  raw: Partial<QaData> | null | undefined,
  view: QaView,
  attendeeId?: string
): PublicSnapshot {
  const data = normalizeData(raw);
  const session = getActiveSession(data);

  if (!session) {
    return {
      active: false,
      settings: data.settings,
      session: null,
      questions: [],
      polls: [],
      // بلا جلسة نشطة: لا شيء يُعرض. `manual` صراحةً حتى لا يبدأ العميل
      // تدويراً على قائمة فارغة ويومض بين «بانتظار» و«لا نتائج».
      screen: { mode: "manual", slide: { kind: "hold" } },
      // ⛔ لا `myQuestions` هنا: لا جلسة ⇒ لا صاحب أسئلة، وإرجاع `[]`
      // سيقرأ العميل «أسئلتي غير مقبولة» بدل «لا جلسة أصلاً».
    };
  }

  const polls = session.polls.map(toPublicPoll);
  const approved = session.questions.filter((q) => q.status === "approved");

  /**
   * قائمة المشروعور تُبنى دائماً بـ`"live"`، أي حقل `showOnProjector`.
   *
   * ⚠️ ليست تفصيلاً: `screen` يصف **الشاشة الكبيرة** مهما كان الطالب. لو
   * حُلّت مع لقطة `audience` التي رُشِّح أسئلتها بـ`showToAudience`، لأمكن
   * أن يرد على هاتف الحاضر «الشاشة على hold» بينما هي تعرض سؤالاً أمام
   * المئات — تناقض في اللقطة نفسها.
   */
  const projectorQuestions = approved.map((q) => toPublicQuestion(q, "live")).sort(sortForDisplay);

  /**
   * وجه الجمهور: يُحذف المخفي **من المصفوفة**، لا يُرسَل بـ`visible: false`.
   *
   * ⚠️ قرار متّفق عليه: السؤال المخفي عن الحضور لا يظهر على أجهزتهم ولا
   * يظهر في طابور «المعروض الآن». إبقاؤه في المصفوفة مع `visible: false`
   * يجعل كل عميل مضطراً لتطبيق الفلتر بنفسه، وأي عميل جديد ينساه يعرض
   * سؤالاً قُرّر إخفاؤه. الحذف في الخادم يجعل القاعدة غير قابلة للتجاوز.
   *
   * ⚠️ ولهذا تُبنى من `approved` لا من `projectorQuestions`: تصفية
   * `projectorQuestions` بـ`visible` كانت ستفلتر على **ظهور المشروعور** لا
   * الجمهور — فسؤال ظاهر على الشاشة ومخفي عن الحضور يبقى في هاتفه.
   *
   * ملاحظة: الإخفاء يخرج السؤال من **العرض** فقط. التصويت عليه يبقى ممكناً
   * إن كان معرّفه معروفاً — وهو سلوك مقصود (المشرف يعدّ الترتيب، لا
   * يلغي الأسئلة).
   */
  const questions =
    view === "audience"
      ? approved
          .filter((q) => isAudienceVisible(q))
          .map((q) => toPublicQuestion(q, "audience"))
          .sort(sortForDisplay)
      : approved.map((q) => toPublicQuestion(q, view)).sort(sortForDisplay);

  return {
    active: true,
    settings: data.settings,
    session: toPublicSessionInfo(session),
    questions,
    polls,
    screen: resolveScreen(session, projectorQuestions, polls),
    // ⛔ الحقل يُضاف بـ`attendeeId` فقط — الشرط الوحيد الذي لا يُمرَّر فيه
    // أي معرّف هو الشرط الوحيد الذي لا يحمل أسئلة أحد.
    ...(attendeeId
      ? {
          myQuestions: toMyQuestions(session, attendeeId),
          myAnswers: toMyAnswers(session, attendeeId),
        }
      : {}),
  };
}
