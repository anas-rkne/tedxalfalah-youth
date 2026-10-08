export type QuestionStatus = "pending" | "approved" | "rejected";

/** من كتب السؤال: جمهور الحضور أم إدارة الفريق من لوحة التحكم. */
export type QaSource = "audience" | "admin";

export interface QaQuestion {
  id: string;
  author: string;
  /**
   * مَن كتب السؤال — `attendeeId` سجلّ الحضور، **أو `undefined`**.
   *
   * 🎯 لماذا هذا الحقل هو أصل فجوة F5: كان السجل غائباً، فقرار المشرف
   * (اعتماد/رفض) لا طريق عائداً إلى صاحب السؤال — لا في القرص ولا في
   * اللقطة العامة. فلم يكن ينقص «إشعار» بل كان ينقص **ربط**، وأي إشعار
   * سيبقى مستحيلاً ما دام السؤال بلا صاحب.
   *
   * ⛔ يُملأ من الخادم بعد التحقق من سجلّ الحضور، **ولا يُقرأ من جسم
   * الطلب أبداً** (انظر `POST /api/qa/question`): لولاه لكان بإمكان أي
   * زائر أن ينسب سؤالاً إلى اسم غيره ويُزيّف حالة مشرقه.
   */
  attendeeId?: string;
  text: string;
  votes: number;
  status: QuestionStatus;
  createdAt: string;
  approvedAt?: string;
  featured: boolean;
  answered?: boolean;
  anonymous?: boolean;
  sentiment?: "positive" | "negative" | "neutral";
  tag?: string;
  /** يُعرض هذا السؤال على شاشة المتحدث؟ (تحكم منفصل عن الجمهور والعرض) */
  showOnSpeaker?: boolean;
  /**
   * يُعرض هذا السؤال لأجهزة الحضور (الهواتف)؟
   *
   * ⚠️ أضيف بفصل واضح عن المشروعور. كان الحقل الوحيد `showOnLive` يسمّي
   * شيئاً لا يصفه: لم يكن «الحي» مربوطاً بحضور شيء، بل بالمشروعور وحده —
   * فإخفاؤه كان يُخفيه عن الشاشة الكبرى ويبقى ظاهراً على هواتف
   * الحضور بلا أي وسيلة لتغيير ذلك. الآن زرّان مستقلان.
   * ⚠️ الإخفاء لا يسحب السؤال من أجهزة الجمهور: يبقى يُقرأ ويُصوَّت عليه
   * هناك، لأن المقصود أن المشرف يعدّ الترتيب لا أن يلغي السؤال. ما ينقص
   * هو **الظهور** فقط.
   */
  showToAudience?: boolean;
  /**
   * يدخل هذا السؤال في مخزون العرض على **المشروعور** (وسحابة الكلمات)؟
   *
   * منفصل عن `showToAudience` عمداً: أسئلة المسرح تُرفع للمشروعور دون أن
   * تظهر على هواتف الحضور، أو تُعرض على الشاشة الكبرى مع منع بثّها على
   * الأجهزة رغم أن الحضور قد صوّتوا عليها.
   */
  showOnProjector?: boolean;
  /**
   * ⚠️ **مهجور — يُقرأ للترحيل فقط ولا يُكتب بعد الآن.**
   *
   * كان الحقل الوحيد الذي يتحكم بالمشروعور. أبقى في النوع موثّقاً
   * لسبب واحد: ملفات الإنتاج القائمة تحمله، و`normalizeData` ينسخه إلى
   * `showOnProjector` **و** `showToAudience` ليبقى سلوك الأسئلة الظاهرة
   * على الشاشة كما كان تماماً بعد الترحيل.
   *
   * أي كتابة جديدة إلى هنا تتجاهلها `normalizeScreen` لاحقاً، لذلك أي
   * مسار يضيفه في المستقبل سيراه المخفي ويظنّ أنه فعّال — وهو بالضبط
   * نوع الخطأ الصامت الذي ولّد هذه المشكلة أصلاً.
   */
  showOnLive?: boolean;
  /**
   * مصدر السؤال.
   *
   * جديد مع «سؤال على المسرح»: قبله كان **كل** سؤال في النظام يأتي من نموذج
   * الجمهور، فلم تكن الإدارة قادرة على صياغة سؤال ودفعه للشاشة مباشرة. الآن
   * يميّز بين سؤال كتبه الحضور وسؤال كتبه المشرف — فرق مهم في تشغيل
   * الحفل: سؤال الإدارة مقصود وموعد، وسؤال الجمهور متوقع أن يحتاج مراجعة.
   *
   * السجلات القديمة بلا الحقل = `audience` (السلوك السابق).
   */
  source?: QaSource;
  /** إجابات مفتوحة على هذا السؤال (انظر `QaAnswer`). */
  answers?: QaAnswer[];
}

/**
 * جواب مفتوح من الحضور على سؤال معروض.
 *
 * ⚠️ لماذا الحضور يجيب بدل أن يصوّت فقط؟
 * التصويت يجيب «كم شخص يهمّه هذا» ولا يجيب «ماذا يقول». في أسئلة الحفل
 * النموذجي، الجواب الحر يكشف ما في ذهن أصحابها بتفصيل لا يسمح به أي
 * عدّاد. لذلك أُضيف بجانب التصويت لا بدلاً منه.
 *
 * التسلسل: `pending` ← المشرف يعتمد. صاحب الجواب يرى جوابه فوراً دائماً،
 * والبقية بعد الاعتماد فقط — وهو نفس مسار الأسئلة تماماً، فلا مسار إشراف
 * جديد ولا خطر نشر فوري غير مُراجَع.
 */
export interface QaAnswer {
  id: string;
  questionId: string;
  attendeeId: string;
  author: string;
  text: string;
  status: QuestionStatus;
  createdAt: string;
  approvedAt?: string;
  source?: QaSource;
}

/**
 * ما تعرضه الشاشة الكبيرة **في هذه اللحظة**.
 *
 * ⚠️ لماذا هذا منفصل عن `status` و`showOnLive`؟
 * كانت الشاشة تستنتج المحتَى وحده: تجمع كل المعتمد وغير المخفي وتدور عليه
 * كل 7 ثوانٍ. فلم يكن ثمّة مَن يقرر ما يُعرض الآن — يظهر سؤال لم يُراجَع
 * أمام الحضور فجأة، ولا وسيلة لإبقاء سؤال معيّن على الشاشة مدة أطول.
 *
 * الآن: المخزون ≠ الشاشة. المخزون «ماذا يمكن أن يُعرض» (`status` +
 * `showOnLive`)، و`slide` هو «ماذا يُعرض الآن» بقرار صريح.
 *
 * `questionId`/`pollId` **معرّفان فقط، لا نصوص**: يبنيها `public-view` من
 * القوائم المرشَّحة، فلا يستطيع مؤشرٌ عالق أن يسرّب نصّ سؤال غير معتمد عبر
 * نقطة عامة (اختبار في `qa-suite.mjs` يغطي هذا).
 */
export type QaScreenSlide =
  | { kind: "question"; questionId: string }
  | { kind: "poll"; pollId: string }
  | { kind: "wordCloud" }
  /** بطاقة الانتظار: QR + «بانتظار المشرف». ليست خطأ. */
  | { kind: "hold" };

export interface QaScreenState {
  /**
   * `manual` يعرض `slide` وحده، `auto` يدوّر على المخزون كل 7 ثوانٍ.
   *
   * الافتراضي `manual` (بقرار صريح): عرض سؤال من الجمهور على شاشة أمام
   * مئات الناس دون مراجعة بشرية مخاطرة لا تُعوَّض. و`auto` يبقى كخيار
   * متاح لمن يريد عرضاً متواصلاً بلا لمس.
   *
   * ⚠️ التثبيت اليدوي يفوز على `auto` دائماً: إن كانت `slide` سؤالاً صريحاً
   * لا تدور الشاشة حتى في وضع `auto` — وإلا صار زر «التالي» بلا معنى.
   */
  mode: "manual" | "auto";
  slide: QaScreenSlide;
  updatedAt?: string;
}

export interface QaPoll {
  id: string;
  prompt: string;
  promptAr?: string;
  options: string[];
  optionsAr?: string[];
  tallies: number[];
  active: boolean;
  showResults: boolean;
  createdAt: string;
}

/**
 * سجل حضور موثوق الخادم.
 *
 * قبل هذا النوع كان `attendeeId` مجرد قيمة عشوائية يرسلها العميل ولا يستطيع
 * الخادم التحقق منها، وكان اسم صاحب السؤال يُؤخذ من `name` في جسم الطلب — أي أن
 * أي زائر كان يستطيع التظاهر بأنه شخص آخر بمجرد إرسال `name` مختلف. وجود هذا
 * السجل يجعل الخادم مصدر الحقيقة: يتحقق من `attendeeId` ويشتقّ الاسم منه هو.
 *
 * `name` يُخزَّن **خاماً** (بلا تهريب HTML) لأن React يهرّب النص عند العرض
 * أصلاً، والتهريب عند التخزين كان يُنتج ترميزاً مزدوجاً.
 */
export interface QaAttendee {
  id: string;
  name: string;
  sessionId: string;
  joinedAt: string;
  /**
   * سر استرداد الهوية — يثبت أن من يعود بالاسم **نفس الشخص**.
   *
   * ⚠️ بدونه كان `POST /attendee/join` يعيد `attendeeId` الموجود لأي طلب بنفس
   * الاسم، ومعرّف الحضور هو **البيانات الاعتمادية** الوحيدة للإرسال
   * والتصويت والاستبيان. أي أن معرفة اسم زائر تكفي لانتحاله.
   *
   * يُولَّد مرة واحدة عند الانضمام، ويُخزَّن في `sessionStorage` على جهاز
   * الحاضر فقط. السجلات القديمة (قبل هذا الحقل) تُعامَل كغير قابلة للاسترداد:
   * owner جديد بسجل جديد — أأمن من تسليم المعرّف القديم بلا دليل.
   */
  reclaimSecret?: string;
}

export interface QaSession {
  id: string;
  title: string;
  titleAr?: string;
  active: boolean;
  acceptingQuestions: boolean;
  /** هل تُفعَّل شاشة المتحدث لهذه الجلسة؟ (تحكم من الأدمن لكل جلسة) */
  speakerEnabled?: boolean;
  /**
   * حالة الشاشة الكبيرة: ما يُعرض الآن + الوضع.
   *
   * على مستوى **الجلسة** لا بشكل عام: قد يكون للفعالية أكثر من جلسة، ولكل
   * جلسة شاشتها ومديرها. بدون هذا الحقل كان «الشاشة» تخص آخر جلسة أُنشئت
   * تلقائياً.
   */
  screen?: QaScreenState;
  createdAt: string;
  questions: QaQuestion[];
  polls: QaPoll[];
  /** سجل الحضور الموثوق لهذه الجلسة (اختياري للتوافق مع البيانات القديمة). */
  attendees?: QaAttendee[];
  /**
   * أسماء الحاضرين (توافق معياري مع البيانات القديمة).
   * المصدر المعتمد للتحقق من الهوية هو `attendees`؛ يُبقى هذا الحقل للعدّ
   * والإحصاءات ولجلسات ما قبل السجل.
   */
  attendeeNames: string[];
}

export interface QaSettings {
  eventName: string;
  eventNameAr: string;
  active: boolean;
}

export interface QaData {
  settings: QaSettings;
  sessions: QaSession[];
  meta: {
    totalAttendees: number;
    totalQuestions: number;
    totalVotes: number;
  };
}

export interface PollVoteRecord {
  sessionId: string;
  pollId: string;
  voterId: string;
  optionIndex: number;
}

/**
 * سجل تصويت على سؤال مفتوح.
 *
 * كان `QaQuestion.votes` يبدأ دائماً عند 0 ولا توجد أي نقطة تصويت على الأسئلة،
 * فلم يكن الفرز ولا لوحة التحليلات يعملان إطلاقاً. هذا السجل هو المصدر الذي
 * يمنع التكرار، و`QaQuestion.votes` عدّاد مشتقّ يُحدَّث في نفس المعاملة الذرّية.
 */
export interface QuestionVoteRecord {
  sessionId: string;
  questionId: string;
  voterId: string;
}

/** بيانات خاصة بالتصويت تُحفظ بملف منفصل لتجنّب تضخيم الملف الرئيسي وتبسيط التحقق من عدم التكرار */
export interface QaVoteStore {
  votes: PollVoteRecord[];
  questionVotes: QuestionVoteRecord[];
}

export interface SurveyResponse {
  id: string;
  sessionId: string;
  attendeeId: string;
  nps: number;
  rating: number;
  comment?: string;
  createdAt: string;
}
