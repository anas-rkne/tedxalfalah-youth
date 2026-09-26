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
import { attendeeCountOf, getActiveSession, normalizeData, normalizeScreen } from "./service";

/** أي شاشة تطلب اللقطة. */
export type QaView = "live" | "speaker";

export function isQaView(value: unknown): value is QaView {
  return value === "live" || value === "speaker";
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
  /** هل السؤال معروض على هذه الشاشة تحديداً (بعد تطبيق showOnLive/showOnSpeaker). */
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
    visible: view === "speaker" ? q.showOnSpeaker !== false : q.showOnLive !== false,
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
  const resultsOpen = p.showResults === true || p.active === false;
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
 * يبني اللقطة العامة من بيانات خام (غير مطبَّعة) — يتولّى `normalizeData` داخلياً
 * حتى لا يخطئ أي مستهلك ويستخدم بيانات قديمة بلا الحقول الجديدة.
 */
export function buildPublicSnapshot(raw: Partial<QaData> | null | undefined, view: QaView): PublicSnapshot {
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
    };
  }

  const questions = session.questions
    .filter((q) => q.status === "approved")
    .map((q) => toPublicQuestion(q, view))
    .sort(sortForDisplay);
  const polls = session.polls.map(toPublicPoll);

  return {
    active: true,
    settings: data.settings,
    session: toPublicSessionInfo(session),
    questions,
    polls,
    screen: resolveScreen(session, questions, polls),
  };
}
