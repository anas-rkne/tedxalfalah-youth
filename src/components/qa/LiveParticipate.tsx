"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, Send, ThumbsUp, Vote } from "lucide-react";
import Button from "@/components/ui/Button";
import TurnstileWidget, { TURNSTILE_ENABLED } from "@/components/ui/TurnstileWidget";

interface SessionInfo {
  id: string;
  title: string;
  titleAr?: string;
  acceptingQuestions: boolean;
  attendeeCount: number;
}

interface PollView {
  id: string;
  prompt: string;
  promptAr?: string;
  options: string[];
  optionsAr?: string[];
  active: boolean;
  showResults: boolean;
  tallies: number[] | null;
  totalVotes: number | null;
}

/** سؤال معروض للحضور (من اللقطة العامة — بلا حقول إدارية). */
interface AnswerView {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface QuestionView {
  id: string;
  author: string;
  text: string;
  votes: number;
  featured: boolean;
  answered: boolean;
  /** المعتمدة فقط؛ المعلّقة يرى صاحبها نسخته محلياً (انظر `myAnswers`). */
  answers?: AnswerView[];
}

const STORAGE = "tedx-qa-attendee";
/** أصوات الأسئلة محفوظة محلياً للحاضر: بدونها لا يستطيع سحب التصويت بعد التحديث. */
const VOTE_STORAGE = "tedx-qa-question-votes";
/**
 * معرّفات إجاباتي المعلّقة.
 *
 * ⚠️ لماذا نحفظها هنا بدل أن يرجعها الخادم في اللقطة العامة؟ لأن اللقطة
 * عامة ولا تعرف من يقرأها. فبلا هذا الحفظ، تحديث الصفحة بعد كتابة جواب
 * كان سَيُخفي جوابه عن صاحبه حتى يعتمدها المشرف — وهو أسوأ شعور ممكن
 * لمن يكتب ثم يظنّ أن جوابه اختفى. نخزّن **معرّفات** فقط لا نصوص.
 */
const MY_ANSWERS_STORAGE = "tedx-qa-my-answers";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const text = await res.text().catch(() => "");
  let data: { error?: string };
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`HTTP ${res.status}: server returned a non-JSON response`);
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (HTTP ${res.status})`);
  }
  return data as T;
}

/**
 * يقرأ `?session=` من الرابط دون Suspense.
 *
 * ⚠️ لماذا لا `useSearchParams()`؟ hook الاستعلامات يخلي الصفحة كاملة
 * `Suspense`/CSR bailout في Next، و`LiveParticipate` يُستخدم في اختبار
 * E2E والمتصفح معاً. القراءة المباشرة من `location` في جسم المكوّن آمنة
 * هنا (المكوّن `\"use client\"` لا يُصيَّر على الخادم لهذا الفرع) وتتجنّب
 * ترويسة CSR غير قابلة للاختبار.
 *
 * نتحقق بـ`URLSearchParams` بدل التجميع النصّي: فالمعرّف قد يحتوي `&` و`#`.
 */
function qrParamFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("session");
  if (!raw) return null;
  const id = raw.trim();
  if (!id || id.length > 200) return null;
  return id;
}

export default function LiveParticipate() {
  const t = useTranslations("qa");
  const attendeeRef = useRef<{ id: string; name: string; reclaimSecret?: string } | null>(null);
  const [attendee, setAttendee] = useState<{ id: string; name: string; reclaimSecret?: string } | null>(null);

  // Join state
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joinReset, setJoinReset] = useState(0);
  const [joinError, setJoinError] = useState<null | string>(null);

  // Session/question state
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [active, setActive] = useState(false);
  const [question, setQuestion] = useState("");
  const [sendingQ, setSendingQ] = useState(false);
  const [qToken, setQToken] = useState("");
  const [qMsg, setQMsg] = useState<null | { type: "ok" | "err"; text: string }>(null);
  const [qReset, setQReset] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [tag, setTag] = useState("");

  // Poll state
  const [polls, setPolls] = useState<PollView[]>([]);
  const [votingPoll, setVotingPoll] = useState<null | string>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({});
  const [pollError, setPollError] = useState<null | string>(null);
  // ⚠️ رموز Turnstile أحادية الاستخدام، والتصويت على الاستبيان يمرّ من نفس
  // المسار المحمي بها. بدون رمز كان كل تصويت يفشل بـ403 في الإنتاج، وبدون
  // إعادة الضبط كان يفشل الرّمز الثاني فما بعده.
  const [pollToken, setPollToken] = useState("");
  const [pollReset, setPollReset] = useState(0);

  // Question-vote state
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  /** معرّف السؤال الذي طلب جارٍ — يمنع الضغط المزدوج أثناء الطلب. */
  const [votingQuestion, setVotingQuestion] = useState<null | string>(null);
  /** الأسئلة التي صوّت عليها هذا الحاضر (يُحفظ محلياً للحضور). */
  const [myQuestionVotes, setMyQuestionVotes] = useState<Record<string, boolean>>({});
  const [questionVoteError, setQuestionVoteError] = useState<null | string>(null);

  // ── الإجابات المفتوحة ────────────────────────────────────────────────
  /** السؤال الذي صندوق إجابته مفتوح (واحد فقط: حقول كثيرة على الهاتف). */
  const [openAnswerFor, setOpenAnswerFor] = useState<null | string>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [sendingAnswer, setSendingAnswer] = useState<null | string>(null);
  const [answerMsg, setAnswerMsg] = useState<Record<string, { type: "ok" | "err"; text: string }>>({});
  const [answerToken, setAnswerToken] = useState("");
  const [answerReset, setAnswerReset] = useState(0);
  const [answerStalled, setAnswerStalled] = useState(false);
  /** إجاباتي المعلّقة: معرّف الجواب ← نصّه (لعرضه بعد التحديث). */
  const [myAnswers, setMyAnswers] = useState<Record<string, string>>({});
  /** فشل مؤقت في جلب اللقطة (شبكة/429) — لا يعني انتهاء الجلسة. */
  const [connectionIssue, setConnectionIssue] = useState(false);
  /**
   * هل نجحنا يوماً في جلب لقطة؟
   *
   * ⚠️ بدونه، أول فشل في الشبكة كان الواجهة تُظهر "There is no active session
   * right now" مع زر "Welcome back!" الذي **يمسح sessionStorage** — أي أن
   * عطلاً مؤقتاً في الثواني الأولى كان يطلب من الحاضر التخلي عن هويته
   * وصوته. الآن: ما لم تنجح لقطة واحدة بعد، نعرض "جارٍ المحاولة" بدل حالة
   * "لا جلسة".
   */
  const [hasSnapshot, setHasSnapshot] = useState(false);
  /** أول تحميل لم يكتمل بعد (فصل عن "فشل متكرر" و"لا جلسة فعلاً"). */
  const [initialLoading, setInitialLoading] = useState(true);
  /**
   * تعذّر الوصول إلى تحدّي Turnstile (سكربت محجوب/منقطع).
   *
   * ⚠️ الحالة الحرجة: بدونها يكون تعذّر تحميل سكربت Cloudflare زر إرسال
   * معطّلاً إلى الأبد، فلا يستطيع أحد الانضمام أو التصويت — انقطاع شبكة
   * واحد يوقف الحفل. عند التعذّر نلغي المنع ونترك الخادم يحسم (وهو
   * fail-closed في الإنتاج)، مع تنبيه صريح للمستخدم.
   */
  const [joinStalled, setJoinStalled] = useState(false);
  const [qStalled, setQStalled] = useState(false);
  const [pollStalled, setPollStalled] = useState(false);

  const loadCurrent = useCallback(async () => {
    try {
      const data = await api<{
        active: boolean;
        session: SessionInfo | null;
        polls: PollView[];
        questions?: QuestionView[];
      }>("/api/qa/session/current");
      setConnectionIssue(false);
      setActive(data.active);
      setSession(data.session);
      setPolls(data.polls ?? []);
      setQuestions(data.questions ?? []);
      setHasSnapshot(true);
    } catch {
      // ⚠️ الفشل المؤقت (شبكة، 429، إعادة تشغيل الخادم) لا يعني انتهاء
      // الجلسة. لا نمسح `active` إطلاقاً، فنُبقي آخر لقطة ناجحة على الشاشة
      // ونكتفي بتنبيه الاتصال. فشل التحميل الأول يبقى `initialLoading`
      // فيُعرض "جارٍ المحاولة" بدل طيّ الواجهة إلى "لا توجد جلسة".
      setConnectionIssue(true);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  /**
   * `?session=` في رابط الـQR — أي «الرمز الذي يمسحه الحاضر على الشريحة».
   *
   * ⚠️ لماذا هذا الفحص حاسم؟ الرمز يُطبع عادةً على مطويّعات ولافتات، أي أنه
   * يعيش **أطول من الجلسة نفسها**. بدون هذا الفحص كان قارئُ رمز قديم يُدخل
   * فوراً في جلسة أخرى جارية، فيصوّت لسؤال لا يعرف سياقه. الآن:
   * تطابق = تدفق طبيعي، عدم تطابق = رسالة صريحة قبل أي انضمام.
   *
   * `null` = لا يوجد بارامتر (رابط مباشر) ⇒ لا تحقق، سلوك قديم.
   */
  const qrSessionId = qrParamFromUrl();

  /** غير متطابق/منتهٍ — نمنع الانضمام ونعرض رسالة بدل silent redirect. */
  const sessionMismatch =
    qrSessionId != null && hasSnapshot && (!active || session?.id !== qrSessionId);

  /** ينسخ خريطة أصوات الأسئلة إلى sessionStorage (تلقائياً عند كل تغيير). */
  useEffect(() => {
    if (!attendee) return;
    try {
      sessionStorage.setItem(
        `${VOTE_STORAGE}:${attendee.id}`,
        JSON.stringify(myQuestionVotes)
      );
    } catch {
      /* الوضع الخاص قد يمنع التخزين — غير حرج */
    }
  }, [attendee, myQuestionVotes]);

  /** يحفظ إجاباتي المعلّقة محلياً — انظر `MY_ANSWERS_STORAGE`. */
  useEffect(() => {
    if (!attendee) return;
    try {
      sessionStorage.setItem(
        `${MY_ANSWERS_STORAGE}:${attendee.id}`,
        JSON.stringify(myAnswers)
      );
    } catch {
      /* الوضع الخاص قد يمنع التخزين — غير حرج */
    }
  }, [attendee, myAnswers]);

  useEffect(() => {
    // نؤجّل الاستعادة خطوة microtask: setState المتزامن داخل جسم التأثير
    // يُطلق re-render متتالياً (قاعدة react-hooks). نفس النمط المستخدم في
    // SpeakerView و QaAdminPanel.
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      const stored = sessionStorage.getItem(STORAGE);
      if (stored) {
        try {
          // `reclaimSecret` اختياري: سجلات ما قبل هذا الحقل ستنشئ هوية جديدة
          // عند إعادة الانضمام (أأمن من تسليم معرّف بلا دليل ملكية).
          const rec = JSON.parse(stored) as { id: string; name: string; reclaimSecret?: string };
          attendeeRef.current = rec;
          setAttendee(rec);
          // استرجاع أصوات هذا الحاضر: بدونه يختفي تمييز "صوّت" بعد التحديث
          // فيضغط المستخدم فيصطدم بـ"already voted" ولا يستطيع السحب.
          try {
            const votesRaw = sessionStorage.getItem(`${VOTE_STORAGE}:${rec.id}`);
            if (votesRaw) setMyQuestionVotes(JSON.parse(votesRaw) as Record<string, boolean>);
          } catch {
            /* تجاهل */
          }
          // استرجاع إجاباتي المعلّقة (نصّها محلياً): بدونه يظن صاحب الجواب
          // أنه لم يكتب شيئاً بعد أن يُحدِّث الصفحة فيكتبه مرّة ثانية.
          try {
            const answersRaw = sessionStorage.getItem(`${MY_ANSWERS_STORAGE}:${rec.id}`);
            if (answersRaw) setMyAnswers(JSON.parse(answersRaw) as Record<string, string>);
          } catch {
            /* تجاهل */
          }
        } catch {
          attendeeRef.current = null;
        }
      }
      if (!cancelled) await loadCurrent();
    })();
    const iv = setInterval(() => void loadCurrent(), 4000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [loadCurrent]);

  const handleJoin = async () => {
    const name = joinName.trim();
    if (!name) {
      setJoinError(t("join.required"));
      return;
    }
    // ⛔ مع التحقق البصري مفعّل، الضغط قبل حل التحدي كان يرسل بلا رمز فيُردّ
    // الخادم 403 برسالة "verification failed" غامضة. نمنع الطلب ونقول السبب.
    if (TURNSTILE_ENABLED && !joinToken && !joinStalled) {
      setJoinError(t("participate.verifyFirst"));
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const res = await api<{ ok: boolean; attendeeId: string; reclaimSecret?: string }>(
        "/api/qa/attendee/join",
        {
          method: "POST",
          // ⚠️ نرسل السر المحفوظ: به وحده يعيد الخادم المعرّف نفسه عند
          // العودة. بدونه يُنشأ سجل جديد، فيُحتسب الحاضر مرتين.
          body: JSON.stringify({
            name,
            turnstileToken: joinToken,
            reclaimSecret: attendeeRef.current?.name === name ? attendeeRef.current.reclaimSecret : undefined,
          }),
        }
      );
      const rec = { id: res.attendeeId, name, reclaimSecret: res.reclaimSecret };
      attendeeRef.current = rec;
      sessionStorage.setItem(STORAGE, JSON.stringify(rec));
      setAttendee(rec);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : t("join.noSession"));
      // الرمز قد يُستهلك أثناء التحقق الفاشل، فنطلب تحدياً جديداً حتى لا
      // يعلق المستخدم بإعادة المحاولة بنفس الرمز الباطل.
      setJoinToken("");
      setJoinReset((n) => n + 1);
    } finally {
      setJoining(false);
    }
  };

  const submitQuestion = async () => {
    const text = question.trim();
    if (!text || !attendee) return;
    if (TURNSTILE_ENABLED && !qToken && !qStalled) {
      setQMsg({ type: "err", text: t("participate.verifyFirst") });
      return;
    }
    setSendingQ(true);
    setQMsg(null);
    try {
      const res = await api<{ ok: boolean; duplicate?: boolean; duplicateOf?: string }>("/api/qa/question", {
        method: "POST",
        body: JSON.stringify({ attendeeId: attendee.id, name: attendee.name, text, anonymous, tag: tag || undefined, turnstileToken: qToken }),
      });
      // ⚠️ الخادم يستهلك الرمز في كل طلب يصله، حتى لو ردّ duplicate.
      // لذلك يجب إعادة ضبط الرمز بعد **كل** استجابة ناجحة، لا في فرع
      // `else` فقط: كان السؤال الثاني لنفس الحاضر يفشل بـ403 لأن الرمز
      // المستهلَك بقي دون تجديد.
      if (res.duplicate) {
        setQMsg({ type: "ok", text: t("participate.duplicate") });
      } else {
        setQuestion("");
        setQMsg({ type: "ok", text: t("participate.sent") });
      }
      setQToken("");
      setQReset((n) => n + 1);
    } catch (e) {
      setQMsg({ type: "err", text: e instanceof Error ? e.message : t("participate.sentError") });
      setQToken("");
      setQReset((n) => n + 1);
    } finally {
      setSendingQ(false);
    }
  };

  const submitAnswer = async (questionId: string) => {
    const text = (answerDrafts[questionId] ?? "").trim();
    if (!text || !attendee) return;
    if (TURNSTILE_ENABLED && !answerToken && !answerStalled) {
      setAnswerMsg((m) => ({ ...m, [questionId]: { type: "err", text: t("participate.verifyFirst") } }));
      return;
    }
    setSendingAnswer(questionId);
    setAnswerMsg((m) => ({ ...m, [questionId]: { type: "ok" as const, text: t("participate.answerSending") } }));
    try {
      await api("/api/qa/question/answer", {
        method: "POST",
        body: JSON.stringify({ questionId, attendeeId: attendee.id, text, turnstileToken: answerToken }),
      });
      // نحفظ نسخة صاحبها في الحالة + التخزين المحلي: يحفظها الخادم بلا
      // مراجع، فلا تصلها من اللقطة العامة إلا بعد اعتماد المشرف.
      setMyAnswers((m) => ({ ...m, [questionId]: text }));
      setAnswerDrafts((d) => ({ ...d, [questionId]: "" }));
      setOpenAnswerFor(null);
      setAnswerMsg((m) => ({ ...m, [questionId]: { type: "ok", text: t("participate.answerSent") } }));
      setAnswerToken("");
      setAnswerReset((n) => n + 1);
    } catch (e) {
      setAnswerMsg((m) => ({
        ...m,
        [questionId]: { type: "err", text: e instanceof Error ? e.message : t("participate.answerError") },
      }));
      setAnswerToken("");
      setAnswerReset((n) => n + 1);
    } finally {
      setSendingAnswer(null);
    }
  };

  const vote = async (pollId: string, optionIndex: number) => {
    if (!attendee || !attendee.id) return;
    // نفس قاعدة السؤال: لا نرسل بلا رمز بعدُ، بل نُبلغ المستخدم بالسبب.
    if (TURNSTILE_ENABLED && !pollToken && !pollStalled) {
      setPollError(t("participate.verifyFirst"));
      return;
    }
    setVotingPoll(pollId);
    setPollError(null);
    try {
      // ⚠️ كان الرمز غائباً تماماً: المسار يشترط Turnstile في الإنتاج، فكان
      // كل تصويت على الاستبيان يفشل بـ403 "Verification failed" بمجرد ضبط
      // مفاتيح Cloudflare.
      await api("/api/qa/poll/vote", {
        method: "POST",
        body: JSON.stringify({
          attendeeId: attendee.id,
          pollId,
          optionIndex,
          turnstileToken: pollToken,
        }),
      });
      setPollVotes((v) => ({ ...v, [pollId]: optionIndex }));
      setPollToken("");
      setPollReset((n) => n + 1);
    } catch (e) {
      // ⚠️ كان يعرض الاختيار محلياً حتى عند فشل الطلب (مثل تصويت مكرر من
      // متصفح آخر) فيوحي للمستخدم بأن صوته سُجّل وهو لم يُسجَّل. الآن نُبلغه
      // ونُبقي الحالة كما هي على الخادم.
      setPollError(e instanceof Error ? e.message : t("participate.voteFailed"));
      setPollToken("");
      setPollReset((n) => n + 1);
    } finally {
      setVotingPoll(null);
    }
  };

  /**
   * التصويت على سؤال (أو التراجع عنه).
   *
   * ⚠️ لا يوجد تحديث تفاؤلي للعدّاد: أي زيادة محلية قبل الرد تُفسد الحالة
   * عند فشل الطلب أو عند وصول لقطة أحدث (rollback خاطئ). نعتمد على العدّاد
   * القادم من الخادم بعد نجاح الطلب.
   */
  const voteQuestion = async (questionId: string) => {
    if (!attendee || !attendee.id || votingQuestion) return;
    const alreadyVoted = myQuestionVotes[questionId] === true;
    setVotingQuestion(questionId);
    setQuestionVoteError(null);
    try {
      if (alreadyVoted) {
        // ⚠️ مسار DELETE يقرأ المعرّفات من الـ query string لا من جسم الطلب،
        // فإرسالها في الجسم كان يجعل زر التراجع يفشل دائماً بـ 400.
        const qs = new URLSearchParams({ attendeeId: attendee.id, questionId }).toString();
        await api(`/api/qa/question/vote?${qs}`, { method: "DELETE" });
      } else {
        await api("/api/qa/question/vote", {
          method: "POST",
          body: JSON.stringify({ attendeeId: attendee.id, questionId }),
        });
      }
      setMyQuestionVotes((v) => ({ ...v, [questionId]: !alreadyVoted }));
      await loadCurrent();
    } catch (e) {
      setQuestionVoteError(e instanceof Error ? e.message : t("participate.voteFailed"));
    } finally {
      setVotingQuestion(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-center mb-2">{t("participate.title")}</h1>
      {session && <p className="text-center text-muted-foreground text-sm mb-6">{t("participate.sessionTitle")}: {session.titleAr || session.title}</p>}

      {/* فشل جلب مؤقت — لا يُنهي الجلسة ولا يمسح هوية الحاضر. */}
      {connectionIssue && (
        <p
          role="status"
          data-testid="qa-connection-issue"
          className="text-center text-amber-600 text-sm mb-4"
        >
          {t("participate.connectionIssue")}
        </p>
      )}

      {/* Join gate */}
      {!attendee ? (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-1">{t("join.title")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("join.subtitle")}</p>
          <input
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder={t("join.namePlaceholder")}
            data-testid="qa-join-name"
            maxLength={60}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-red-500"
          />
          <TurnstileWidget onVerify={setJoinToken} resetKey={joinReset} onStalled={setJoinStalled} />
          {joinStalled && (
            <p role="status" data-testid="qa-verify-stalled" className="text-amber-600 text-sm mt-2">
              {t("participate.verifyStalled")}
            </p>
          )}
          {joinError && <p className="text-red-600 text-sm mt-2">{joinError}</p>}
          <Button className="w-full mt-3" data-testid="qa-join-submit" loading={joining} loadingText={t("join.joining")} onClick={handleJoin} disabled={TURNSTILE_ENABLED && !joinToken && !joinStalled}>
            {t("join.joinButton")}
          </Button>
        </div>
      ) : !hasSnapshot && initialLoading ? (
        // ⚠️ لم تنجح ولا لقطة واحدة بعد: نُظهر "جارٍ الاتصال" بدل "لا توجد
        // جلسة". عرض "لا جلسة" كان يعني أن الحاضر يضغط زر إعادة الانضمام
        // فيفقد هويته وأصواته — بسبب انقطاع شبكة لا بسبب شيء فعله.
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm" data-testid="qa-connecting">
          <p className="text-muted-foreground">{t("participate.connecting")}</p>
        </div>
      ) : sessionMismatch ? (
        // ⚠️ رمز QR قديم (جلسة منتهية أو جلسة أخرى). نوقف التدفق كلياً:
        // لا انضمام ولا سؤال ولا تصويت — فقط رسالة صريحة.
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm" data-testid="qa-stale-session">
          <p className="text-muted-foreground">{t("participate.staleSession")}</p>
        </div>
      ) : !active ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm" data-testid="qa-no-session">
          <p className="text-muted-foreground">{t("join.noSession")}</p>
          <Button
            className="mt-4"
            variant="outline"
            size="sm"
            onClick={() => {
              // إعادة الانضمام = هوية جديدة، فيُمسح سجل أصوات الحضور السابق.
              if (attendeeRef.current) {
                sessionStorage.removeItem(`${VOTE_STORAGE}:${attendeeRef.current.id}`);
              }
              sessionStorage.removeItem(STORAGE);
              setMyQuestionVotes({});
              setAttendee(null);
            }}
          >
            {t("join.alreadyJoined")}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ask a question */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-3">{t("participate.askTitle")}</h2>
            {session && session.acceptingQuestions ? (
              <>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t("participate.askPlaceholder")}
                  data-testid="qa-ask-text"
                  maxLength={300}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 mb-2 outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <div className="text-right text-xs text-muted-foreground mb-1">{question.length}/300</div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="rounded border-border"
                    />
                    {t("participate.anonymous")}
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="text-sm rounded-lg border border-border bg-background px-2 py-1"
                  >
                    <option value="">{t("participate.noTag")}</option>
                    <option value="tech">{t("participate.tagTech")}</option>
                    <option value="ideas">{t("participate.tagIdeas")}</option>
                    <option value="environment">{t("participate.tagEnvironment")}</option>
                    <option value="education">{t("participate.tagEducation")}</option>
                    <option value="other">{t("participate.tagOther")}</option>
                  </select>
                </div>
                <TurnstileWidget onVerify={setQToken} resetKey={qReset} onStalled={setQStalled} />
                {qMsg && <p className={`text-sm mt-2 ${qMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{qMsg.text}</p>}
                <Button className="w-full mt-3" data-testid="qa-ask-submit" loading={sendingQ} loadingText={t("participate.sending")} onClick={submitQuestion} disabled={!question.trim() || (TURNSTILE_ENABLED && !qToken && !qStalled)}>
                  <Send className="h-4 w-4 mr-2" />
                  {t("participate.askButton")}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{t("participate.notAccepting")}</p>
            )}
          </div>

          {/* Audience questions — vote / un-vote */}
          {questions.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-3">{t("screen.questionsLabel")}</h2>
              {questionVoteError && (
                <p className="text-sm text-red-600 mb-3">{questionVoteError}</p>
              )}
              <ul className="space-y-3">
                {questions.map((q) => {
                  const mine = myQuestionVotes[q.id] === true;
                  const pending = votingQuestion === q.id;
                  const myDraft = answerDrafts[q.id] ?? "";
                  const myPendingAnswer = myAnswers[q.id];
                  const approved = q.answers ?? [];
                  const open = openAnswerFor === q.id;
                  return (
                    <li
                      key={q.id}
                      data-testid="qa-question"
                      data-question-id={q.id}
                      className={`rounded-2xl border p-4 ${
                        mine ? "border-red-400 bg-red-50/40" : "border-border bg-background"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{q.text}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{q.author}</span>
                        {q.featured && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            ★ {t("featured")}
                          </span>
                        )}
                        <span className="ms-auto flex items-center gap-3">
                          <span className="text-sm text-muted-foreground" data-testid="qa-question-votes">
                            {t("participate.questionVotesCount", { count: q.votes })}
                          </span>
                          <Button
                            size="sm"
                            data-testid="qa-question-vote"
                            variant={mine ? "outline" : undefined}
                            onClick={() => voteQuestion(q.id)}
                            disabled={pending || votingQuestion !== null}
                            className={mine ? "" : "bg-red-600 hover:bg-red-700 text-white"}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {mine ? t("participate.undoVote") : t("participate.voteQuestion")}
                          </Button>
                        </span>
                      </div>

                      {/* ── الإجابات المفتوحة ───────────────────────────── */}
                      {/*
                        * التصويت = «سؤال مهم». الجواب = «هذا ما أعرفه/أريد
                        * قوله». لذلك يبقى مفتوحاً بعد التصويت: سؤالٌ عليه 40
                        * تصوياً قد يحتاج مساهماً يعرف الحلّ.
                        */}
                      <div className="mt-3 border-t border-border pt-3">
                        {myPendingAnswer && (
                          <div
                            className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-2"
                            data-testid="qa-my-pending-answer"
                          >
                            <p className="text-xs font-medium text-amber-700 mb-1">
                              {t("participate.myAnswerPending")}
                            </p>
                            <p className="text-sm">{myPendingAnswer}</p>
                          </div>
                        )}

                        {approved.length > 0 && (
                          <ul className="space-y-2 mb-2" data-testid="qa-approved-answers">
                            {approved.map((a) => (
                              <li key={a.id} className="rounded-xl bg-background border border-border p-3">
                                <p className="text-sm">{a.text}</p>
                                <p className="text-xs text-muted-foreground mt-1">— {a.author}</p>
                              </li>
                            ))}
                          </ul>
                        )}

                        {open ? (
                          <div data-testid="qa-answer-form">
                            <textarea
                              value={myDraft}
                              onChange={(e) =>
                                setAnswerDrafts((d) => ({ ...d, [q.id]: e.target.value }))
                              }
                              maxLength={500}
                              rows={3}
                              placeholder={t("participate.answerPlaceholder")}
                              data-testid="qa-answer-input"
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-red-500 resize-y"
                            />
                            {/* تحقق بشري منفصل: الرموز أحادية الاستخدام،
                                فمشاركته مع صندوق السؤال يجعل الثاني يفشل. */}
                            <TurnstileWidget
                              onVerify={setAnswerToken}
                              resetKey={answerReset}
                              onStalled={setAnswerStalled}
                            />
                            {answerStalled && (
                              <p role="status" className="text-amber-600 text-xs mt-1">
                                {t("participate.verifyStalled")}
                              </p>
                            )}
                            {answerMsg[q.id] && (
                              <p
                                role="status"
                                className={`text-xs mt-1 ${
                                  answerMsg[q.id].type === "ok" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {answerMsg[q.id].text}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                data-testid="qa-answer-submit"
                                onClick={() => submitAnswer(q.id)}
                                loading={sendingAnswer === q.id}
                                loadingText="…"
                                disabled={sendingAnswer !== null || myDraft.trim().length < 2}
                              >
                                {myPendingAnswer ? t("participate.updateAnswer") : t("participate.sendAnswer")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setOpenAnswerFor(null)}
                                disabled={sendingAnswer !== null}
                              >
                                {t("participate.cancelAnswer")}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {t("participate.answerModerationNote")}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid="qa-answer-open"
                              onClick={() => setOpenAnswerFor(q.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {myPendingAnswer ? t("participate.updateAnswer") : t("participate.answerAction")}
                            </Button>
                            {approved.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {t("participate.approvedAnswersCount", { count: approved.length })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Live polls */}
          <div className="space-y-4">
            {polls.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">{t("participate.noPolls")}</p>
            ) : (
              <>
                {/* تحقق بشري واحد لكل جولة تصويت على الاستبيانات. */}
                {polls.some((p) => p.active) && (
                  <TurnstileWidget onVerify={setPollToken} resetKey={pollReset} onStalled={setPollStalled} />
                )}
                {pollError && <p className="text-sm text-red-600">{pollError}</p>}
                {polls.map((poll) => {
                const myVote = pollVotes[poll.id];
                const showResults = poll.showResults;
                return (
                  <div key={poll.id} data-testid="qa-poll" data-poll-id={poll.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold mb-4">{poll.promptAr || poll.prompt}</h3>
                    <div className="space-y-2">
                      {poll.options.map((opt, i) => {
                        const label = poll.optionsAr?.[i] ?? opt;
                        const count = showResults && poll.tallies ? poll.tallies[i] ?? 0 : 0;
                        const total = poll.totalVotes ?? 0;
                        const pct = showResults && total > 0 ? Math.round((count / total) * 100) : 0;
                        const selected = myVote === i;
                        return (
                          <button
                            key={i}
                            data-testid="qa-poll-option"
                            data-option-index={i}
                            onClick={() => !selected && poll.active && vote(poll.id, i)}
                            disabled={!poll.active || selected || votingPoll === poll.id}
                            className={`relative w-full text-left rounded-xl border px-4 py-3 transition ${
                              selected
                                ? "border-red-600 bg-red-600/10"
                                : poll.active
                                ? "border-border hover:border-red-400"
                                : "border-border opacity-70"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                {selected && poll.active && <Vote className="h-4 w-4 text-red-600" />}
                                {label}
                              </span>
                              {showResults && <span className="text-xs text-muted-foreground">{pct}%</span>}
                            </div>
                            {showResults && (
                              <div className="absolute bottom-0 left-0 h-1 rounded-full bg-red-600/60" style={{ width: `${pct}%` }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {showResults && poll.totalVotes !== null && (
                      <p className="text-xs text-muted-foreground mt-3">{t("participate.totalVotes", { count: poll.totalVotes })}</p>
                    )}
                    {myVote === undefined && (
                      <p className="text-xs text-muted-foreground mt-3">{t("participate.voteButton")}</p>
                    )}
                  </div>
                );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
