"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QuestionView {
  id: string;
  author: string;
  text: string;
  votes: number;
  featured: boolean;
  answered?: boolean;
}

interface SessionInfo {
  id: string;
  title: string;
  titleAr?: string;
  acceptingQuestions: boolean;
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
  const [data, setData] = useState<CurrentData>({ active: false, session: null });
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/qa/session/current");
      const d = await res.json();
      setData(d);
    } catch {
      /* تجاهل مؤقت */
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
    .filter((q) => !q.answered)
    .sort((a, b) => b.votes - a.votes);

  const current = questions[idx] ?? null;

  const markAnswered = async () => {
    if (!current || !data.session || busy) return;
    setBusy(true);
    try {
      await fetch("/api/qa/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", sessionId: data.session.id, questionId: current.id }),
      });
      await load();
      // الانتقال للسؤال التالي
      if (idx >= questions.length - 1) {
        setIdx(0);
      }
    } catch {
      /* تجاهل مؤقت */
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
              {data.session.titleAr || data.session.title} — Speaker View
            </p>
          )}
        </div>
        {data.session && (
          <div className="flex flex-col items-center gap-1 bg-zinc-900 rounded-xl p-3">
            <QRCodeSVG
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/en/live?session=${data.session.id}`}
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
              <span className="text-red-400 text-lg font-bold">{current.votes} votes</span>
              {current.featured && (
                <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm">
                  ★ {t("featured")}
                </span>
              )}
            </div>

            {/* أزرار التحكم */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prev}
                className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={markAnswered}
                disabled={busy}
                className="px-8 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition-colors disabled:opacity-50"
              >
                <Check className="h-5 w-5 mr-2 inline" />
                {t("speaker.markAnswered")}
              </button>
              <button
                onClick={next}
                className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex justify-between items-center text-zinc-500 text-sm mt-8">
        <span>{data.session?.attendeeCount ?? 0} participants</span>
        <span>{questions.length} unanswered questions</span>
      </footer>
    </div>
  );
}
