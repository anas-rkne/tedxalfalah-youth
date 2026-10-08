"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Download,
  LogOut,
  MessageSquare,
  MonitorPlay,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AnalyticsDashboard from "@/components/qa/AnalyticsDashboard";

const TOKEN_KEY = "tedx-admin-token";
const USER_KEY = "tedx-admin-user";

interface QaQuestion {
  id: string;
  author: string;
  text: string;
  votes: number;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  answered?: boolean;
  showOnSpeaker?: boolean;
  /**
   * ⚠️ الفصل بين الوجهين. `undefined` = ظاهر (الافتراضي) — لا تعامل
   * `undefined` كـ`false` فالسؤال المُرحَّل بلا حقل يبقى ظاهراً.
   */
  showToAudience?: boolean;
  showOnProjector?: boolean;
  /**
   * حقل مهجور للترحيل فقط. **لا تُرسله** بعد Phase 3: زر واحد كان يمرّره
   * فيضبط الوجهين معاً فيُسقط شريحة المسرح عند أي إخفاء عن الجمهور.
   * يُقرأ هنا فقط توافقاً مع سؤال قديم لم تُرحَّل بياناته بعد.
   */
  showOnLive?: boolean;
  createdAt: string;
  /** `admin` = كتبه المشرف لا الجمهور — تُعرض له بشارة في اللوحة. */
  source?: "audience" | "admin";
  /** كل الإجابات بكل الحالات — المشرف هو الوحيد الذي يرى `pending`. */
  answers?: QaAnswer[];
}

interface QaAnswer {
  id: string;
  author: string;
  text: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface QaPoll {
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

interface QaSession {
  id: string;
  title: string;
  titleAr?: string;
  active: boolean;
  acceptingQuestions: boolean;
  speakerEnabled?: boolean;
  createdAt: string;
  questions: QaQuestion[];
  polls: QaPoll[];
  attendeeNames: string[];
  /** حالة الشاشة الكبيرة — تُقرأ من نفس الكتابة التي تخدم `/api/qa/session/current`. */
  screen?: { mode: "manual" | "auto"; slide: ScreenSlide };
}

type ScreenSlide =
  | { kind: "question"; questionId: string }
  | { kind: "poll"; pollId: string }
  | { kind: "wordCloud" }
  | { kind: "hold" };

interface AdminData {
  settings: { eventName: string; eventNameAr: string; active: boolean };
  meta: { totalAttendees: number; totalQuestions: number; totalVotes: number };
  sessions: QaSession[];
}

/**
 * ⛔ الجلسة التي تُفتح عند دخول المشرف (أو بعد أي `reload`).
 *
 * 🎯 الفجوة: كان الافتراض `sessions[0]` أي **أقدم** جلسة في الملف. فالمشرف
 * الذي أنهى فعالية من عشر جلسات يفتح اللوحة فيقرأ جلسة اليوم الأول: صفر
 * أسئلة، صفر ردود استبيان، صفر إجابات — فيُغلقها مظنناً «لم يحضر أحد».
 * وكان D6 ينجح معزولاً (جلسة واحدة ⇒ `sessions[0]` هي الصحيحة) ويفشل في
 * التسلسل الكامل: الاختبار كشف أن الافتيار كان عشوائياً لا مقصوداً.
 *
 * الترتيب: **الجلسة النشطة** أولاً (هي ما يُشرف عليه الآن)، ثم الأحدث
 *-createdAt بعد انتهاء الفعالية (حيث تصل ردود ما بعد الحدث)، وأخيراً
 * `null` إن لم توجد جلسات. الترتيب بـ`createdAt` لا بالترتيب في المصفوفة،
 * لأن الترتيب المحفوظ غير مضمون.
 */
function pickDefaultSessionId(sessions: QaSession[]): string | null {
  if (sessions.length === 0) return null;
  const active = sessions.find((s) => s.active);
  if (active) return active.id;
  const newest = [...sessions].sort((a, b) =>
    String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
  )[0];
  return newest?.id ?? null;
}

/**
 * 401/403 من الخادم = التوكن منتهٍ أو غير صالح أو `tokenVersion` تغيّر بعد
 * تغيير كلمة المرور.
 *
 * ⚠️ لماذا هذا الصنف موجود؟ `api()` كان يرمي `Error("Unauthorized")` عادياً،
 * فكانت `load()` تكتب النص في `error` وتبتلعه، و`setToken` لا يُستدعى أبداً
 * بـ`null` — فلا يعود نموذج الدخول، ويبقى الاستطلاع كل 5 ثوانٍ يرسل التوكن
 * الميت نفسه، فتصبح اللوحة معطوبة طوال الفعالية حتى إعادة دخول يدوية.
 * الآن يُميَّز هذا الخطأ ويُفكّ الجلسة فوراً.
 */
class AuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function isAuthError(e: unknown): e is AuthError {
  return e instanceof AuthError;
}

/**
 * 409 من `/admin/screen` = المشرف طلب عرض عنصر غير مؤهَّل (سؤال مرفوض، مجاب،
 * أو مخفي عن المشروعور). الخادم أسقط الشريحة إلى «بانتظار المشرف» **وأعاد**
 * الطلب بـ409 عمداً — لا نريد صمتاً يُوهم بأن العرض نجح.
 *
 * الرسالة الإنجليزية، فنُترجمها لأسفل. بدون هذا كان الحاضر يرى
 * «Question not found» فيتحيّر: السؤال أمامه في القائمة.
 */
class ScreenConflictError extends Error {
  readonly status: 409;
  constructor() {
    super("screen-conflict");
    this.name = "ScreenConflictError";
    this.status = 409;
  }
}

function isScreenConflict(e: unknown): e is ScreenConflictError {
  return e instanceof ScreenConflictError;
}

/** وقت انتهاء التوكن، لعرضه للمشرف قبل حدوثه لا بعده. */
function tokenExpiry(token: string): Date | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const exp = (JSON.parse(atob(b64)) as { exp?: number }).exp;
    return typeof exp === "number" ? new Date(exp * 1000) : null;
  } catch {
    return null;
  }
}

async function api<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  const text = await res.text().catch(() => "");
  let data: { error?: string };
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`HTTP ${res.status}: server returned a non-JSON response`);
  }
  // ⚠️ الفحص قبل `!res.ok` عمداً: 401 يعني "التوكن نفد" وهو مسار مختلف تماماً
  // عن أي خطأ آخر — يستدعي تفكيك الجلسة لا مجرد شريط تنبيه.
  if (res.status === 401 || res.status === 403) {
    throw new AuthError(res.status, data.error || `HTTP ${res.status}`);
  }
  // 409 من مسار الشاشة = عنصر غير مؤهَّل، لا خطأ عابر: يُعرض كرسالة إرشادية
  // لا كنص إنجليزي على شريط أحمر.
  if (res.status === 409) {
    throw new ScreenConflictError();
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (HTTP ${res.status})`);
  }
  return data as T;
}

export default function QaAdminPanel() {
  const t = useTranslations("qa.adminLive");
  const locale = useLocale();

  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // إظهار/إخفاء قسم الأسئلة المرفوضة (مطويّ افتراضياً حتى لا يزاحم المراجعة).
  const [showRejectedSection, setShowRejectedSection] = useState(false);

  // create session form
  const [newTitle, setNewTitle] = useState("");
  // poll create form
  const [pollPrompt, setPollPrompt] = useState("");
  const [pollPromptAr, setPollPromptAr] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [creatingPoll, setCreatingPoll] = useState(false);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<null | string>(null);
  /** فشل تصدير CSV — يُعرض بدل أن يمر التنزيل بصمت. */
  const [exportError, setExportError] = useState<null | string>(null);

  // login form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const selected = data?.sessions.find((s) => s.id === selectedId) ?? null;
  const activeSession = data?.sessions.find((s) => s.active) ?? null;

  /**
   * تفكيك جلسة انتهت صلاحيتها: مسح `sessionStorage` **و** `setToken(null)`.
   *
   * ⚠️ `setToken(null)` هو ما كان ناقصاً كلياً. بدونه يبقى `!token` في
   * `render` خطأً، فلا يعود نموذج الدخول، وتبقى واجهة الأدمن معطوبة أمام
   * المشرف. الرسالة تُكتب في `loginError` لأنها الوحيدة التي تُعرض داخل
   * نموذج الدخول — شريط `error` موجود داخل `{token && …}` فلا يُرى بعد
   * التفكيك.
   */
  const clearSession = useCallback((reason: string | null) => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setData(null);
    setSelectedId(null);
    setLoginError(reason);
  }, []);

  /**
   * مُثبَّت المرجع عمداً: `AnalyticsDashboard` يضع `onUnauthorized` في
   * تبعيات `useEffect`، فتمرير arrow function جديد كل render يجعله يعيد
   * طلب `/analytics` مع كل `setData` في اللوحة — أي كل 5 ثوانٍ من الاستطلاع
   * إضافة إلى النداء الأصلي.
   */
  const handleUnauthorized = useCallback(
    () => clearSession(t("sessionExpired")),
    [clearSession, t]
  );

  const load = useCallback(
    async (authToken: string, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const d = await api<AdminData>("/api/qa/admin/questions", authToken);
        setData(d);
        setSelectedId((cur) => cur ?? pickDefaultSessionId(d.sessions));
      } catch (e) {
        if (isAuthError(e)) {
          clearSession(t("sessionExpired"));
          return;
        }
        setError(e instanceof Error ? e.message : t("loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [clearSession, t]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      const stored = sessionStorage.getItem(TOKEN_KEY);
      if (cancelled || !stored) return;
      setToken(stored);
      load(stored);
    })();
    const iv = setInterval(() => {
      // ⚠️ بعد `clearSession` يصبح `getItem` فارغاً فيقف الاستطلاع بنفسه؛
      // قبل الإصلاح كان يُعيد إرسال التوكن الميت كل 5 ثوانٍ بلا نهاية.
      const tok = sessionStorage.getItem(TOKEN_KEY);
      if (tok) load(tok, true);
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [load]);

  const act = <T,>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(label);
    setError(null);
    return fn()
      .catch((e) => {
        if (isAuthError(e)) {
          clearSession(t("sessionExpired"));
          return undefined;
        }
        if (isScreenConflict(e)) {
          setError(t("screenConflict"));
          return undefined;
        }
        setError(e instanceof Error ? e.message : "error");
        return undefined;
      })
      .finally(() => setBusy(null));
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim() || loginLoading) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setLoginError(data.error || t("loginFailed"));
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      if (data.user) sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      load(data.token);
    } catch {
      setLoginError(t("networkError"));
    } finally {
      setLoginLoading(false);
    }
  };

  const session = selected ?? activeSession;

  /**
   * وقت انتهاء التوكن — يُقرأ من حمولة `exp` محلياً بلا نداء الخادم.
   * الغرض أن يرى المشرف العدّ التنازلي قبل حدوث الانقطاع لا بعده.
   */
  const expiresAt = token ? tokenExpiry(token) : null;
  const expiryLabel = expiresAt
    ? expiresAt.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const createSession = async () => {
    const title = newTitle.trim();
    if (!title || !token) return;
    await act("create", async () => {
      await api("/api/qa/admin/session", token, {
        method: "POST",
        body: JSON.stringify({ action: "create", title }),
      });
      setNewTitle("");
      await load(token);
    });
  };

  const setActive = async (sessionId: string) => {
    if (!token) return;
    await act("activate", async () => {
      await api("/api/qa/admin/session", token, {
        method: "POST",
        body: JSON.stringify({ action: "activate", sessionId }),
      });
      await load(token);
    });
  };

  const setQuestions = async (open: boolean) => {
    if (!selected || !token) return;
    await act("toggle", async () => {
      await api("/api/qa/admin/session", token, {
        method: "POST",
        body: JSON.stringify({ action: "toggle", sessionId: selected.id, acceptingQuestions: open }),
      });
      await load(token);
    });
  };

  const delSession = async (sessionId: string) => {
    if (!token || !confirm(`${t("confirmDelete")} (${sessionId})`)) return;
    await act("delete", async () => {
      await api("/api/qa/admin/session", token, {
        method: "POST",
        body: JSON.stringify({ action: "delete", sessionId }),
      });
      setSelectedId(null);
      await load(token);
    });
  };

  const moderate = async (action: "approve" | "reject" | "feature" | "answer" | "setVisibility", questionId: string, extra: Record<string, unknown> = {}) => {
    if (!session || !selected || !token) return;
    await act(action, async () => {
      await api("/api/qa/admin/moderate", token, {
        method: "POST",
        body: JSON.stringify({ action, sessionId: selected.id, questionId, ...extra }),
      });
      await load(token, true);
    });
  };

  const setSpeakerEnabled = async (enabled: boolean) => {
    if (!selected || !token) return;
    await act("setSpeaker", async () => {
      await api("/api/qa/admin/moderate", token, {
        method: "POST",
        body: JSON.stringify({ action: "setSpeaker", sessionId: selected.id, enabled }),
      });
      await load(token, true);
    });
  };

  const updatePoll = async (sessionIdValue: string, action: string, pollId?: string, extra: Record<string, unknown> = {}) => {
    if (!token) return;
    await act(action, async () => {
      await api("/api/qa/admin/poll", token, {
        method: "POST",
        body: JSON.stringify({ action, sessionId: sessionIdValue, pollId, ...extra }),
      });
      await load(token, true);
    });
  };

  /**
   * كل أزرار الشاشة الكبيرة في مكان واحد — **ولا شيء منها على شاشة العرض**.
   *
   * ⚠️ قرار تصميمي: لا نضع «تالية/سحابة/مسح» اختصارات لوحة مفاتيح في
   * `LiveScreen`. أي شخص يمرّ على غرفة التحكّم أو يتّصل بـHDMI (البلاي
   * ليست projection بلوحة مفاتيح) يستطيع عندها تبديل ما يُعرض على الحضور
   * أمام مئات الأشخاص. التحكم مكانه لوحة الإدارة المحمية فقط.
   */
  const screenAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!selected || !token) return;
    await act(`screen:${action}`, async () => {
      await api("/api/qa/admin/screen", token, {
        method: "POST",
        body: JSON.stringify({ action, sessionId: selected.id, ...extra }),
      });
      await load(token, true);
    });
  };

  /** «سؤال على المسرح»: سؤال إدارة يُكتب هنا ويظهر فوراً بلا مراجعة. */
  const [stageText, setStageText] = useState("");
  const [stagePutOnScreen, setStagePutOnScreen] = useState(true);
  const [creatingStage, setCreatingStage] = useState(false);

  const createStageQuestion = async () => {
    if (!selected || !token || !stageText.trim()) return;
    setCreatingStage(true);
    await act("screen:createQuestion", async () => {
      await api("/api/qa/admin/screen", token, {
        method: "POST",
        body: JSON.stringify({
          action: "createQuestion",
          sessionId: selected.id,
          text: stageText.trim(),
          putOnScreen: stagePutOnScreen,
        }),
      });
      setStageText("");
      await load(token, true);
    });
    setCreatingStage(false);
  };

  const createPoll = async () => {
    if (!selected || !token) return;
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollPrompt.trim() || options.length < 2) return;
    setCreatingPoll(true);
    await act("createPoll", async () => {
      await api("/api/qa/admin/poll", token, {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          sessionId: selected.id,
          prompt: pollPrompt.trim(),
          promptAr: pollPromptAr.trim() || undefined,
          options,
        }),
      });
      setPollPrompt("");
      setPollPromptAr("");
      setPollOptions(["", ""]);
      await load(token);
    });
    setCreatingPoll(false);
  };

  const allQuestions = session?.questions ?? [];
  /**
   * كل الإجابات المعلّقة في الجلسة، كقائمة واحدة في أعلى اللوحة.
   *
   * ⚠️ لماذا لا نكتفي بإظهارها تحت كل سؤال؟ لأن المراجع هنا يعمل تحت
   * ضغط الوقت أثناء حديثٍ حيّ، والمشرف يحتاج «صندوق وارد» واحداً يشتري
   * منه الوقت: كم جواباً ينتظرني الآن؟ تحت كل سؤال يضيّع الوقت بالتمرير،
   * ويخفي جواباً معلّقاً تحت سؤال لم يزره.
   */
  const pendingAnswers = allQuestions.flatMap((q) =>
    (q.answers ?? [])
      .filter((a) => a.status === "pending")
      .map((a) => ({ answer: a, question: q }))
  );
  const answerAction = async (action: "approve" | "reject", questionId: string, answerId: string) => {
    if (!selected || !token) return;
    await act(`answer:${action}`, async () => {
      await api("/api/qa/admin/answer", token, {
        method: "POST",
        body: JSON.stringify({ action, sessionId: selected.id, questionId, answerId }),
      });
      await load(token, true);
    });
  };

  const pending = allQuestions.filter((q) => q.status === "pending");
  const approved = allQuestions.filter((q) => q.status === "approved");
  // ⚠️ كان `viewQuestions = [...pending, ...approved]` فقط. فالسؤال المرفوض يختفي
  // من اللوحة نهائياً بعد الرفض: لا يمكن رؤيته ولا إعادة اعتماده ولا معرفة
  // سبب الرفض. الآن نعرضه في قسم منفصل مع زر لإعادة الاعتماد.
  const rejected = allQuestions.filter((q) => q.status === "rejected");
  const viewQuestions = [...pending, ...approved];
  const showRejected = rejected.length > 0 || showRejectedSection;

  // ── حالة الشاشة الكبيرة (كما يقرؤها الخادم، لا كما يظنّه المتصفح) ──────
  const screen = session?.screen ?? { mode: "manual" as const, slide: { kind: "hold" } as ScreenSlide };
  const screenMode = screen.mode;
  /**
   * ⚠️ الانعكاس الحرفي لـ`screenEligibleQuestions` في `service.ts` (وليس
   * لـ`public-view`): يجب أن يطابق الخادم **حرفياً** وإلا اختلف عدّاد
   * «الشريحة التالية» في اللوحة عن الشريحة على جهاز العرض — وهو نفس
   * سبب حساب `next` في الخادم لا في المتصفح.
   *
   * الفارق الجوهري: `showOnProjector` (المشروعور وحده) لا `showOnLive` ولا
   * `showToAudience`. السؤال المخفي عن الجمهور **يبقى** في الطابور:
   * إن أسقطناه منه، صار عدّاد اللوحة يقول ١ بينما الشاشة تعرضه.
   */
  const screenQueue = approved.filter(
    (q) => q.showOnProjector !== false && !q.answered && q.status === "approved"
  );
  const screenQueueLength = screenQueue.length;

  const isOnScreen = (kind: ScreenSlide["kind"], id?: string) => {
    if (screen.slide.kind !== kind) return false;
    if (kind === "question") return (screen.slide as { questionId: string }).questionId === id;
    if (kind === "poll") return (screen.slide as { pollId: string }).pollId === id;
    return true;
  };

  /**
   * وصف الشريحة الحالية بنصّ بشري.
   *
   * ⚠️ مهم: إن كانت الشريحة مثبَّتة على سؤال صار غير مؤهَّل، نكتب
   * «سؤال لم يعد متاحاً» بدل إظهار نصّه — الخادم سيعيد `hold` عند اللقطة
   * التالية، واللقطة القديمة يجب ألا تخدع المشرف.
   */
  const currentSlideLabel = (() => {
    const s = screen.slide;
    if (s.kind === "hold") return t("screenLabelHold");
    if (s.kind === "wordCloud") return t("screenLabelWordCloud");
    if (s.kind === "poll") {
      const p = session?.polls.find((x) => x.id === s.pollId);
      return p ? `${t("screenLabelPoll")}: ${p.promptAr || p.prompt}` : t("screenLabelUnavailable");
    }
    const q = screenQueue.find((x) => x.id === s.questionId);
    return q ? `${t("screenLabelQuestion")}: ${q.text}` : t("screenLabelUnavailable");
  })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-28 pb-16">

        {/* ── Login form (shown when no token) ── */}
        {!token && (
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-tedx-red mb-4" />
              <h1 className="text-3xl font-black tracking-tight">{t("title")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("loginDescription")}</p>
            </div>
            <div className="rounded-[20px] border border-border bg-card p-8">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("loginUsername")}</label>
                  <input
                    type="text"
                    value={loginUsername}
                    data-testid="qa-login-username"
                    onChange={(e) => setLoginUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    autoComplete="username"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-tedx-red focus:ring-1 focus:ring-tedx-red"
                    placeholder={t("loginUsernamePlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("loginPassword")}</label>
                  <input
                    type="password"
                    value={loginPassword}
                    data-testid="qa-login-password"
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-tedx-red focus:ring-1 focus:ring-tedx-red"
                    placeholder={t("loginPasswordPlaceholder")}
                  />
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} />
                    {loginError}
                  </div>
                )}
                <Button
                  className="w-full"
                  data-testid="qa-login-submit"
                  onClick={handleLogin}
                  loading={loginLoading}
                  loadingText={t("loggingIn")}
                >
                  {t("loginSubmit")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Admin panel (shown when logged in) ── */}
        {token && (<>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">{t("title")}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-tedx-red/30 bg-tedx-red/10 px-3 py-1 text-xs font-semibold text-tedx-red">
                <ShieldCheck className="h-3.5 w-3.5" />
                {activeSession ? activeSession.title : "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data?.settings && (
              <a
                href={`/${locale}/live/screen`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                {t("liveScreenLink")} ↗
              </a>
            )}
            {data?.settings && (
              <a
                href={`/${locale}/live/speaker`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                {t("speakerViewLink")} ↗
              </a>
            )}
            {expiresAt && (
              <span
                className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex"
                data-testid="qa-session-expiry"
              >
                <Clock className="h-3.5 w-3.5" />
                {t("sessionExpiresAt", { time: expiryLabel })}
              </span>
            )}
            {/* ⚠️ بدون هذا الزر كان المشرف بلا أي مخرج نظيف: لا مسح للتوكن،
                ولا `setToken(null)`، والإغلاق كان يخلّف جلسة ميتة. */}
            <Button
              variant="outline"
              size="sm"
              data-testid="qa-sign-out"
              onClick={() => clearSession(null)}
            >
              <LogOut className="h-4 w-4 mr-1" />
              {t("signOut")}
            </Button>
            <Button variant="outline" size="sm" data-testid="qa-refresh" onClick={() => token && load(token)} loading={loading} loadingText={t("refreshing")}>
              {t("refresh")}
            </Button>
            {selected && (
              <Button
                variant="outline"
                size="sm"
                data-testid="qa-export-csv"
                onClick={async () => {
                  if (!token || !selected) return;
                  // ⚠️ كان `window.open(...?token=...)`: الرمز في الـURL ⇒
                  // سجل متصفح + سجل خادم + Referer + يمكن نسخه. الآن نرسله
                  // في الترويسة ونحوّل الرد إلى ملف محلياً.
                  try {
                    const res = await fetch(
                      `/api/qa/admin/export?sessionId=${encodeURIComponent(selected.id)}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (!res.ok) {
                      // ⚠️ هذا المسار لا يمر عبر `api()`، فهو المسار
                      // الوحيد الذي كان سيتجاهل 401. أما 403 فتبقى "صلاحية
                      // غير كافية" كما هي، و401 فتعني جلسة منتهية.
                      if (res.status === 401) {
                        clearSession(t("sessionExpired"));
                        return;
                      }
                      setExportError(res.status === 403 ? t("exportForbidden") : t("exportFailed"));
                      return;
                    }
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `qa-${selected.id}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    // الإبطال بعد نبضتين حتى يبدأ المتصفح التنزيل فعلاً.
                    setTimeout(() => URL.revokeObjectURL(url), 2000);
                    setExportError(null);
                  } catch {
                    setExportError(t("exportFailed"));
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                {t("exportCsv")}
              </Button>
            )}
            {exportError && (
              <p role="alert" className="text-red-600 text-sm" data-testid="qa-export-error">
                {exportError}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Sessions selector + create */}
        <section className="mb-8 rounded-[20px] border border-border bg-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(data?.sessions ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    s.id === selected?.id
                      ? "border-tedx-red bg-tedx-red text-white"
                      : s.active
                      ? "border-tedx-red/50 bg-tedx-red/10 text-tedx-red"
                      : "border-zinc-300 bg-white hover:border-zinc-400"
                  }`}
                >
                  {s.title || "—"}
                  {s.active ? " •" : ""}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <input
                value={newTitle}
                data-testid="qa-session-title"
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("sessionTitlePlaceholder")}
                maxLength={80}
                className="w-64 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500"
              />
              <Button size="sm" data-testid="qa-session-create" onClick={createSession} loading={busy === "create"} loadingText="…">
                <Plus className="h-4 w-4 mr-1" />
                {t("createSession")}
              </Button>
            </div>
          </div>
        </section>

        {!session ? (
          <section className="rounded-[20px] border border-border bg-card p-16 text-center text-muted-foreground">
            {t("noSession")}
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Questions moderation */}
            <div className="lg:col-span-2 rounded-[20px] border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MessageSquare className="h-5 w-5 text-tedx-red" />
                  Questions ({viewQuestions.length})
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="qa-session-accepting"
                  aria-pressed={session.acceptingQuestions}
                  onClick={() => selected && setQuestions(!session.acceptingQuestions)}
                  loading={busy === "toggle"}
                  loadingText="…"
                >
                  {session.acceptingQuestions ? t("closeQuestions") : t("openQuestions")}
                </Button>
              </div>

              {viewQuestions.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">{t("noQuestions")}</p>
              ) : (
                <ul className="space-y-3">
                  {viewQuestions.map((q) => (
                    <li
                      key={q.id}
                      data-testid="qa-question-row"
                      data-question-id={q.id}
                      className={`rounded-2xl border p-4 ${
                        q.featured ? "border-amber-400 bg-amber-50/50" : q.answered ? "border-green-400 bg-green-50/50" : "border-border bg-background"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{q.text}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">{q.author}</span>
                        {q.source === "admin" && (
                          <span
                            className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700"
                            data-testid="qa-source-admin"
                          >
                            {t("sourceAdmin")}
                          </span>
                        )}
                        {q.status === "pending" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {t("questionStatus.pending")}
                          </span>
                        )}
                        {q.featured && <Star className="h-4 w-4 text-amber-500" />}
                        <div className="ms-auto flex gap-2">
                          {q.status === "pending" && (
                            <Button size="sm" data-testid="qa-approve" onClick={() => moderate("approve", q.id)} disabled={busy !== null}>
                              <Check className="h-4 w-4 mr-1" />
                              {t("approve")}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            data-testid="qa-feature"
                            variant="outline"
                            onClick={() => moderate("feature", q.id, { featured: !q.featured })}
                            disabled={busy !== null}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            {q.featured ? t("unfeature") : t("feature")}
                          </Button>
                          <Button
                            size="sm"
                            data-testid="qa-toggle-speaker"
                            variant={q.showOnSpeaker === false ? "outline" : undefined}
                            onClick={() => moderate("setVisibility", q.id, { showOnSpeaker: q.showOnSpeaker === false })}
                            disabled={busy !== null}
                            className={q.showOnSpeaker !== false ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {q.showOnSpeaker === false ? t("speakerHidden") : t("speakerVisible")}
                          </Button>
                          {/*
                            * ⚠️Facing منفصلان، وزرّان لا زر.
                            *
                            * `showToAudience`: هل يراه الحاضر على هاتفه ضمن
                            * «أسئلتي المعروضة»؟ إخفاءه هنا **لا** يمنع عنه
                            * التصويت ولا الإجابة إن كان معرّفه معروفاً، ولا يمسّ
                            * الشاشة.
                            *
                            * `showOnProjector`: هل يخرج على الشاشة الكبرى وشاشة
                            * المتحدث؟ إخفاءه هنا يُسقط الشريحة المثبَّتة فوراً،
                            * ويمنع زر «على الشاشة» أدناه.
                            *
                            * زر واحد كان يفعل الاثنين معاً: فإخفاء سؤال عن
                            * سيارات الحضور كان يجرّ معه شريحة المتحدث من
                            * المسرح بلا رجعة، ولا طريقة لإرجاعه من هنا.
                            */}
                          <Button
                            size="sm"
                            data-testid="qa-toggle-audience"
                            variant={q.showToAudience === false ? "outline" : undefined}
                            onClick={() => moderate("setVisibility", q.id, { showToAudience: q.showToAudience === false })}
                            disabled={busy !== null}
                            className={q.showToAudience !== false ? "bg-sky-600 hover:bg-sky-700 text-white" : ""}
                            title={t("audienceFacingHint")}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            {q.showToAudience === false ? t("audienceHidden") : t("audienceVisible")}
                          </Button>
                          <Button
                            size="sm"
                            data-testid="qa-toggle-projector"
                            variant={q.showOnProjector === false ? "outline" : undefined}
                            onClick={() => moderate("setVisibility", q.id, { showOnProjector: q.showOnProjector === false })}
                            disabled={busy !== null}
                            className={q.showOnProjector !== false ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
                            title={t("projectorFacingHint")}
                          >
                            <MonitorPlay className="h-4 w-4 mr-1" />
                            {q.showOnProjector === false ? t("projectorHidden") : t("projectorVisible")}
                          </Button>
                          {q.status === "approved" && (
                            <Button
                              size="sm"
                              data-testid="qa-answer"
                              variant={q.answered ? undefined : "outline"}
                              onClick={() => moderate("answer", q.id, { answered: !q.answered })}
                              disabled={busy !== null}
                              className={q.answered ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {q.answered ? t("answered") : t("markAnswered")}
                            </Button>
                          )}
                          {/*
                            * الرفض متاح لأي حالة غير مرفوضة — لا للـ pending
                            * فقط. كان الشرط `status === "pending"` يمنع سحب
                            * سؤال اعتُمد بالخطأ من الجمهور؛ وواجهة `/moderate`
                            * تقبل الرفض في أي حالة أصلاً.
                            */}
                          {q.status !== "rejected" && (
                            <Button
                              size="sm"
                              data-testid="qa-reject"
                              variant="outline"
                              onClick={() => moderate("reject", q.id)}
                              disabled={busy !== null}
                            >
                              <X className="h-4 w-4 mr-1" />
                              {t("reject")}
                            </Button>
                          )}
                          {/*
                            * «على الشاشة الآن» — مقصود أنه **لا يستدعي
                            * `markAnswered` ولا يغيّر الحالة**؛ فالمخزون
                            * والشريحة شيئان منفصلان (شاشة ≠ أرشيف). تكرار
                            * الضغط idempotent على الخادم.
                            */}
                          {/*
                           * «على الشاشة الآن» — التعطيل يقرأ **المشروعور** لا
                           * الجمهور: سؤال مخفي عن الحضور يبقى قابلاً للعرض على
                           * المسرح، وهذا مقصود — قد يُعرض على المتحدث والشاشة
                           * الكبرى دون أن يظهر ضمن قائمة الحضور.
                           * (كان يقرأ `showOnLive` أي الوجهين معاً.)
                           */}
                          {q.status === "approved" && (
                            <Button
                              size="sm"
                              data-testid="qa-put-on-screen"
                              variant={isOnScreen("question", q.id) ? undefined : "outline"}
                              onClick={() => screenAction("setSlide", { slide: { kind: "question", questionId: q.id } })}
                              disabled={busy !== null || q.showOnProjector === false || q.answered}
                              className={isOnScreen("question", q.id) ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                              title={q.showOnProjector === false || q.answered ? t("putOnScreenBlocked") : undefined}
                            >
                              <MonitorPlay className="h-4 w-4 mr-1" />
                              {isOnScreen("question", q.id) ? t("onScreenNow") : t("putOnScreen")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Rejected questions — ظاهر بعد الرفض مع إمكانية إعادة الاعتماد */}
              {showRejected && (
                <div className="mt-6 border-t border-border pt-4">
                  <button
                    type="button"
                    data-testid="qa-rejected-toggle"
                    onClick={() => setShowRejectedSection((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span>
                      {t("rejectedQuestions", { count: rejected.length })}
                    </span>
                    <span aria-hidden="true">{showRejectedSection ? "▲" : "▼"}</span>
                  </button>

                  {showRejectedSection && (
                    rejected.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {t("noRejectedQuestions")}
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {rejected.map((q) => (
                          <li
                            key={q.id}
                            data-testid="qa-rejected-row"
                            data-question-id={q.id}
                            className="rounded-2xl border border-red-200 bg-red-50/40 p-3"
                          >
                            <p className="text-sm leading-relaxed text-muted-foreground line-through">
                              {q.text}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">{q.author}</span>
                              <span className="ms-auto flex gap-2">
                                <Button
                                  size="sm"
                                  data-testid="qa-reapprove"
                                  onClick={() => moderate("approve", q.id)}
                                  disabled={busy !== null}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  {t("reapprove")}
                                </Button>
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              )}

              {/* ── Inbox: الإجابات المفتوحة المنتظرة ────────────────── */}
              {pendingAnswers.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/40 p-4" data-testid="qa-answer-inbox">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-amber-600" />
                    {t("answerInbox", { count: pendingAnswers.length })}
                  </h3>
                  <ul className="space-y-3">
                    {pendingAnswers.map(({ answer, question }) => (
                      <li
                        key={answer.id}
                        data-testid="qa-pending-answer"
                        data-answer-id={answer.id}
                        className="rounded-xl border border-border bg-background p-3"
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("answerTo", { text: question.text.slice(0, 80) })}
                        </p>
                        <p className="text-sm leading-relaxed">{answer.text}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{answer.author}</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              data-testid="qa-answer-approve"
                              onClick={() => answerAction("approve", question.id, answer.id)}
                              disabled={busy !== null}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {t("approveAnswer")}
                            </Button>
                            <Button
                              size="sm"
                              data-testid="qa-answer-reject"
                              variant="outline"
                              onClick={() => answerAction("reject", question.id, answer.id)}
                              disabled={busy !== null}
                            >
                              <X className="h-4 w-4 mr-1" />
                              {t("rejectAnswer")}
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Screen control bar ─────────────────────────────────── */}
              {/*
                ⚠️ الترتيب مقصود: شريط التحكّم **فوق** قائمة الأسئلة. المشرف
                يحتاج «ضع هذا على الشاشة» أمام عينه، لا في ذيل الصفحة تحت
                عشرات الأسئلة.
              */}
              <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4" data-testid="qa-screen-bar">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold">{t("screenBar")}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        screenMode === "auto" ? "bg-amber-500/15 text-amber-600" : "bg-zinc-500/15 text-muted-foreground"
                      }`}
                      data-testid="qa-screen-mode"
                    >
                      {screenMode === "auto" ? t("screenModeAuto") : t("screenModeManual")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={screenMode === "manual" ? undefined : "outline"}
                      data-testid="qa-screen-manual"
                      onClick={() => screenAction("setMode", { mode: "manual" })}
                      disabled={busy !== null || screenMode === "manual"}
                    >
                      {t("screenModeManual")}
                    </Button>
                    <Button
                      size="sm"
                      variant={screenMode === "auto" ? undefined : "outline"}
                      data-testid="qa-screen-auto"
                      onClick={() => screenAction("setMode", { mode: "auto" })}
                      disabled={busy !== null || screenMode === "auto"}
                    >
                      {t("screenModeAuto")}
                    </Button>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground" data-testid="qa-screen-current">
                  <span className="font-medium">{t("screenNow")}: </span>
                  {currentSlideLabel}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    data-testid="qa-screen-next"
                    onClick={() => screenAction("next")}
                    disabled={busy !== null || screenQueueLength === 0}
                    title={screenQueueLength === 0 ? t("screenQueueEmpty") : undefined}
                  >
                    <ChevronRight className="h-4 w-4 mr-1" />
                    {t("screenNext")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="qa-screen-wordcloud"
                    onClick={() => screenAction("setSlide", { slide: { kind: "wordCloud" } })}
                    disabled={busy !== null || isOnScreen("wordCloud")}
                  >
                    {t("screenWordCloud")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="qa-screen-hold"
                    onClick={() => screenAction("clear")}
                    disabled={busy !== null || isOnScreen("hold")}
                  >
                    {t("screenHold")}
                  </Button>
                </div>
              </div>

              {/* «سؤال على المسرح» — يكتبه المشرف ويظهر مباشرة */}
              <div className="mt-4 rounded-2xl border border-border bg-background/60 p-4" data-testid="qa-stage-box">
                <h3 className="text-sm font-semibold mb-1">{t("stageTitle")}</h3>
                <p className="text-xs text-muted-foreground mb-3">{t("stageHint")}</p>
                <textarea
                  value={stageText}
                  onChange={(e) => setStageText(e.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder={t("stagePlaceholder")}
                  data-testid="qa-stage-input"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-red-500 resize-y"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={stagePutOnScreen}
                      onChange={(e) => setStagePutOnScreen(e.target.checked)}
                      data-testid="qa-stage-putonscreen"
                    />
                    {t("stagePutOnScreen")}
                  </label>
                  <Button
                    size="sm"
                    data-testid="qa-stage-submit"
                    onClick={createStageQuestion}
                    loading={creatingStage}
                    loadingText="…"
                    disabled={busy !== null || stageText.trim().length < 2}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("stageSubmit")}
                  </Button>
                </div>
              </div>

              {/* Session controls */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {t("totalAttendees", { count: session.attendeeNames.length })}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={session.speakerEnabled === false ? "outline" : undefined}
                    onClick={() => setSpeakerEnabled(session.speakerEnabled === false)}
                    disabled={busy !== null}
                    loading={busy === "setSpeaker"}
                    loadingText="…"
                    className={session.speakerEnabled !== false ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
                  >
                    {session.speakerEnabled === false ? t("speakerEnabledOn") : t("speakerEnabledOff")}
                  </Button>
                  {!session.active && (
                    <Button size="sm" data-testid="qa-session-activate" onClick={() => session && setActive(session.id)} loading={busy === "activate"} loadingText="…">
                      {t("activateButton")}
                    </Button>
                  )}
                  {selected && (
                    <Button size="sm" variant="outline" data-testid="qa-session-delete" onClick={() => delSession(selected.id)} disabled={busy !== null}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("deleteSession")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Polls */}
            <div className="rounded-[20px] border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold mb-4">{t("polls")}</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createPoll();
                }}
                className="space-y-2 mb-6"
              >
                <input
                  value={pollPrompt}
                  data-testid="qa-poll-prompt"
                  onChange={(e) => setPollPrompt(e.target.value)}
                  placeholder={t("newPollPrompt")}
                  maxLength={200}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500"
                />
                <input
                  value={pollPromptAr}
                  onChange={(e) => setPollPromptAr(e.target.value)}
                  placeholder={t("pollPromptPlaceholder")}
                  maxLength={200}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500"
                />
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    data-testid="qa-poll-option-input"
                    data-option-index={i}
                    value={opt}
                    onChange={(e) =>
                      setPollOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))
                    }
                    placeholder={t("newPollOptionPlaceholder", { n: i + 1 })}
                    maxLength={120}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500"
                  />
                ))}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPollOptions((prev) => (prev.length < 6 ? [...prev, ""] : prev))}
                    disabled={pollOptions.length >= 6}
                  >
                    {t("addOption")}
                  </Button>
                  <Button type="submit" size="sm" data-testid="qa-poll-create" loading={creatingPoll} loadingText="…">
                    {t("startPoll")}
                  </Button>
                </div>
              </form>

              {session.polls.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{t("noPollsYet")}</p>
              ) : (
                <ul className="space-y-3">
                  {session.polls.map((p) => (
                    <li key={p.id} data-testid="qa-admin-poll" data-poll-id={p.id} className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-sm font-semibold">{p.promptAr || p.prompt}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.options.map((o, i) => `${i + 1}. ${o} (${p.tallies[i] ?? 0})`).join("  ·  ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!p.active ? (
                          <Button size="sm" data-testid="qa-poll-start" onClick={() => updatePoll(session.id, "start", p.id)} disabled={busy !== null}>
                            {t("startPoll")}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" data-testid="qa-poll-stop" onClick={() => updatePoll(session.id, "stop", p.id)} disabled={busy !== null}>
                            {t("stopPoll")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          data-testid="qa-poll-results"
                          variant="outline"
                          onClick={() => updatePoll(session.id, "showResults", p.id, { show: !p.showResults })}
                          disabled={busy !== null}
                        >
                          {p.showResults ? t("hideResults") : t("showResults")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => session && updatePoll(session.id, "delete", p.id)}
                          disabled={busy !== null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          data-testid="qa-poll-put-on-screen"
                          variant={isOnScreen("poll", p.id) ? undefined : "outline"}
                          className={isOnScreen("poll", p.id) ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                          onClick={() => screenAction("setSlide", { slide: { kind: "poll", pollId: p.id } })}
                          disabled={busy !== null}
                        >
                          <MonitorPlay className="h-4 w-4 mr-1" />
                          {isOnScreen("poll", p.id) ? t("onScreenNow") : t("putOnScreen")}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        </>)}

        {/* Analytics Dashboard */}
        {token && (
          <div className="mt-8 border-t border-border pt-6">
            <AnalyticsDashboard
              token={token}
              sessionId={selected?.id}
              onUnauthorized={handleUnauthorized}
            />
          </div>
        )}
      </main>
    </div>
  );
}
