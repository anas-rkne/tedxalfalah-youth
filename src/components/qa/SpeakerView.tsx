"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
  answered?: boolean;
  /** تطبيق showOnSpeaker — بدونه كان زر "مخفي عن المتحدث" بلا أثر. */
  visible?: boolean;
  /** المعتمدة فقط — `public-view` لا يخرج غيرها من الخادم. */
  answers?: AnswerView[];
}

interface SessionInfo {
  id: string;
  title: string;
  titleAr?: string;
  acceptingQuestions: boolean;
  speakerEnabled?: boolean;
  attendeeCount: number;
}

interface CurrentData {
  active: boolean;
  settings?: { eventName?: string; eventNameAr?: string };
  session: SessionInfo | null;
  questions?: QuestionView[];
}

export default function SpeakerView() {
  const t = useTranslations("qa");
  const locale = useLocale();
  const [data, setData] = useState<CurrentData>({ active: false, session: null });
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  /** خطأ في إجراء إداري (تعليم الإجابة) — يُعرض ولا يُتجاهل. */
  const [actionError, setActionError] = useState<string | null>(null);
  /**
   * فشل جلب مؤقت — الشاشة تحتفظ بآخر لقطة سليمة.
   *
   * ⚠️ هذه الشاشة تُعرض على المسرح أمام الحضور. اختفاء أسئلة المتحدث بسبب
   * 429 لثانية واحدة أرعب من أي تنبيه، فاللقطة القديمة تبقى مع تحذير.
   */
  const [staleNotice, setStaleNotice] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/qa/session/current?view=speaker");
      // ⚠️ `res.json()` ينجح حتى عند 429/500 (الجسم هو {error} فقط)، فكان
      // `setData(d)` يستبدل الشاشة بمحتوى الخطأ: تظهر "لا جلسة" ويمسح
      // المتحدث أسئلته من الشاشة لحظة واحدة في كل انقطاع. الآن نُبقي آخر
      // لقطة سليمة ونكتفي بتحذير.
      if (!res.ok) {
        setStaleNotice(true);
        return;
      }
      const d = await res.json();
      setStaleNotice(false);
      setData(d);
    } catch {
      setStaleNotice(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) load();
    })();
    const iv = setInterval(() => {
      if (!cancelled) load();
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [load]);

  // أسئلة غير مُجاب عنها، مرتبة حسب التصويت
  const questions = (data.questions ?? [])
    .filter((q) => !q.answered && q.visible !== false)
    .sort((a, b) => b.votes - a.votes);

  const current = questions[idx] ?? null;

  const markAnswered = async () => {
    if (!current || !data.session || busy) return;
    const token =
      typeof window !== "undefined" ? window.sessionStorage.getItem("tedx-admin-token") : null;
    if (!token) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/qa/admin/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "answer",
          sessionId: data.session.id,
          questionId: current.id,
          // ⚠️ كان يُرسَل بلا قيمة فيقلبها الخادم. الآن القيمة النهائية مطلوبة
          // (idempotent) — نضع `true` صراحةً: "تم الإجابة" على السؤال المعروض.
          answered: true,
        }),
      });
      // ⚠️ لم يكن هناك فحص لـ res.ok: أي رفض (401 منتهية، 429 حدّ المعدّل،
      // 403 دور) كان يُعامَل كنجاح — السؤال ينتقل للتالي ويتوهم المتحدث
      // banqu believes the question is answered while it never was.
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setActionError(body.error || `HTTP ${res.status}`);
        return;
      }
      await load();
      // الانتقال للسؤال التالي
      if (idx >= questions.length - 1) {
        setIdx(0);
      }
    } catch {
      setActionError(t("speaker.markFailed"));
    } finally {
      setBusy(false);
    }
  };

  const next = () => setIdx((i) => (i + 1) % Math.max(questions.length, 1));
  const prev = () => setIdx((i) => (i - 1 + questions.length) % Math.max(questions.length, 1));

  const eventName =
    (data.settings && (data.settings.eventNameAr || data.settings.eventName)) ||
    "TEDxAlFalah Youth";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col p-8 select-none">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">{eventName}</h1>
          {data.session && (
            <p className="text-zinc-400 text-sm mt-1">
              {data.session.titleAr || data.session.title} — {t("speaker.viewTitle")}
            </p>
          )}
          {/* انقطاع مؤقت: التحذير وحده. لا نمسح الأسئلة المعروضة. */}
          {staleNotice && (
            <p role="status" data-testid="qa-speaker-stale" className="text-amber-400 text-sm mt-1">
              {t("participate.connectionIssue")}
            </p>
          )}
        </div>
        {data.session && (
          <div className="flex flex-col items-center gap-1 bg-zinc-900 rounded-xl p-3">
            <QRCodeSVG
              // ⚠️ تاريخ هذا الرابط في سطرين:
              // 1) كان `/en/live` ثابتاً، فيرسل كل الحضور إلى النسخة الإنجليزية
              //    حتى في جلسة عربية. أُصلح أولًا باختيار لغة الواجهة.
              // 2) ثم أُضيف `?session=<id>` — وهو **لا يفعل شيئاً**: صفحة
              //    المشاركة تعرض الجلسة النشطة وحدها ولا تقرأ هذا البارامتر،
              //    فيسقطه المتصفح بعد pathname. بارامتر عديم الفائدة في رمز
              //    يُمسح ضوئياً ويوحي بأنه يوجّه المستخدم. حُذف عمداً (قرار
              //    صريح) بدل تركه ميتاً. إن أردنا يوماً توجيه الفحص إلى جلسة
              //    محددة، فذلك يحتاج سلوكاً حقيقياً في الواجهة والخادم: deep
              //    link يُظهر «لم تبدأ بعد» بدل الالتحاق تلقائياً.
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/live`}
              size={80}
              bgColor="transparent"
              fgColor="#ffffff"
              level="M"
            />
            <span className="text-zinc-500 text-xs">{t("screen.scanToJoin")}</span>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center">
        {!data.active || !data.session ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold">{t("screen.waiting")}</h2>
            <p className="text-zinc-400 text-lg mt-2">{t("screen.waitingSubtitle")}</p>
          </div>
        ) : data.session.speakerEnabled === false ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold">{t("speaker.disabledTitle")}</h2>
            <p className="text-zinc-400 text-lg mt-2">{t("speaker.disabledSubtitle")}</p>
          </div>
        ) : !current ? (
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-xl">{t("speaker.noQuestions")}</p>
          </div>
        ) : (
          <div className="w-full max-w-3xl text-center">
            {/* السؤال الحالي */}
            <div className="mb-6">
              <span className="text-zinc-500 text-sm uppercase tracking-widest">
                {t("speaker.currentQuestion")} ({idx + 1}/{questions.length})
              </span>
            </div>
            <p className="text-4xl md:text-5xl leading-snug font-medium mb-8">{current.text}</p>
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="text-zinc-400 text-lg">— {current.author}</span>
              <span className="text-red-400 text-lg font-bold">
                {t("speaker.votesCount", { count: current.votes })}
              </span>
              {current.featured && (
                <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm">
                  ★ {t("speaker.featured")}
                </span>
              )}
            </div>

            {/* الإجابات المفتوحة المعتمدة — زاوية المتحدث، لا الشاشة الكبيرة */}
            {(current.answers ?? []).length > 0 && (
              <div className="mt-6 text-right" data-testid="qa-speaker-answers">
                <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2">
                  {t("speaker.answersLabel", { count: current.answers?.length ?? 0 })}
                </p>
                <ul className="space-y-2">
                  {(current.answers ?? []).map((a) => (
                    <li key={a.id} className="rounded-xl bg-zinc-900/70 border border-zinc-800 p-3 text-right">
                      <p className="text-lg leading-snug">{a.text}</p>
                      <p className="text-zinc-500 text-xs mt-1">— {a.author}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prev}
                aria-label={t("speaker.previous")}
                className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={markAnswered}
                disabled={busy}
                data-testid="qa-speaker-answered"
                className="px-8 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition-colors disabled:opacity-50"
              >
                <Check className="h-5 w-5 mr-2 inline" />
                {t("speaker.markAnswered")}
              </button>
              <button
                onClick={next}
                aria-label={t("speaker.next")}
                className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            {actionError && (
              <p role="alert" className="text-red-400 text-sm" data-testid="qa-speaker-error">
                {actionError}
              </p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex justify-between items-center text-zinc-500 text-sm mt-8">
        <span>{t("speaker.participants", { count: data.session?.attendeeCount ?? 0 })}</span>
        <span>{t("speaker.unanswered", { count: questions.length })}</span>
      </footer>
    </div>
  );
}
