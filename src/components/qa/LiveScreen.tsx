"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, TrendingUp, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useQaStream } from "@/lib/qa/use-qa-stream";
import WordCloud, { calculateWordFrequency } from "@/components/qa/WordCloud";

interface QuestionView {
  id: string;
  author: string;
  text: string;
  votes: number;
  featured: boolean;
  answered?: boolean;
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

export default function LiveScreen() {
  const t = useTranslations("qa");
  const { data: streamData } = useQaStream(3000);
  const [qIdx, setQIdx] = useState(0);

  const data = streamData ?? { active: false, session: null };

  // تدوير الأسئلة المعتمدة على الشاشة تلقائيًا (باستثناء المُجاب عنها)
  const questions = (data.questions ?? []).filter((q) => !q.answered);
  useEffect(() => {
    if (questions.length <= 1) return;
    const iv = setInterval(() => setQIdx((i) => (i + 1) % questions.length), 7000);
    return () => clearInterval(iv);
  }, [questions.length]);

  const eventName =
    (data.settings && (data.settings.eventNameAr || data.settings.eventName)) ||
    t("screen.eventName");

  const activePoll = data.polls?.find((p) => p.active);
  const endedPoll = data.polls?.find((p) => !p.active && p.showResults);

  const displayPoll = activePoll ?? endedPoll;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-10 select-none">
      {/* Header */}
      <header className="absolute top-8 left-8 text-center w-full">
        <h1 className="text-3xl font-bold tracking-tight uppercase">{eventName}</h1>
        {data.session && (
          <p className="text-zinc-400 text-lg mt-1">{data.session.titleAr || data.session.title}</p>
        )}
      </header>

      {/* Main content */}
      <main className="w-full max-w-4xl flex-1 flex items-center justify-center">
        {!data.active || !data.session ? (
          <div className="text-center">
            <h2 className="text-4xl font-bold">{t("screen.waiting")}</h2>
            <p className="text-zinc-400 text-xl mt-3">{t("screen.waitingSubtitle")}</p>
          </div>
        ) : displayPoll && displayPoll.showResults ? (
          <PollResults poll={displayPoll} label={t("screen.pollLabel")} votesLabel={t("screen.pollVotes", { count: displayPoll.totalVotes ?? 0 })} />
        ) : questions.length > 0 ? (
          <QuestionCard q={questions[qIdx % questions.length]} label={t("screen.questionsLabel")} />
        ) : (
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-2xl">{t("screen.noQuestions")}</p>
          </div>
        )}
      </main>

      {/* Footer stats */}
      <footer className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 text-zinc-400 text-lg">
        {data.session && (
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("screen.participants", { count: data.session.attendeeCount })}
          </span>
        )}
      </footer>

      {/* Word Cloud — bottom left */}
      {questions.length >= 3 && (
        <div className="absolute bottom-4 left-4 w-64 h-40 overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
          <WordCloud words={calculateWordFrequency(questions.map((q) => q.text))} maxWords={15} />
        </div>
      )}

      {/* QR Code for joining */}
      {data.session && (
        <div className="absolute bottom-6 right-8 flex flex-col items-center gap-2 bg-zinc-900/80 rounded-2xl p-4 backdrop-blur-sm">
          <QRCodeSVG
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/en/live?session=${data.session.id}`}
            size={120}
            bgColor="transparent"
            fgColor="#ffffff"
            level="M"
          />
          <span className="text-zinc-400 text-xs">{t("screen.scanToJoin")}</span>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ q, label }: { q: QuestionView; label: string }) {
  return (
    <div className="text-center max-w-3xl">
      <div className="inline-flex items-center gap-2 text-red-400 uppercase tracking-widest text-sm mb-6">
        <MessageSquare className="h-4 w-4" />
        {label}
      </div>
      <p className="text-4xl md:text-5xl leading-snug font-medium">{q.text}</p>
      <p className="text-zinc-400 text-xl mt-6">— {q.author}</p>
    </div>
  );
}

function PollResults({ poll, label, votesLabel }: { poll: PollView; label: string; votesLabel: string }) {
  const total = poll.totalVotes ?? poll.tallies?.reduce((a, b) => a + b, 0) ?? 0;
  const options = poll.options.map((o, i) => ({ text: poll.optionsAr?.[i] ?? o }));
  return (
    <div className="w-full max-w-3xl">
      <div className="inline-flex items-center gap-2 text-red-400 uppercase tracking-widest text-sm mb-6">
        <TrendingUp className="h-4 w-4" />
        {label}
      </div>
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">{poll.promptAr || poll.prompt}</h2>
      <div className="space-y-5">
        {options.map((o, i) => {
          const count = poll.tallies?.[i] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-4">
              <div className="w-44 text-right text-xl shrink-0">{o.text}</div>
              <div className="flex-1 bg-zinc-800 rounded-full h-8 overflow-hidden">
                <div className="h-full bg-red-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-24 text-left text-xl font-bold shrink-0">{pct}%</div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-zinc-400 text-lg mt-8">{votesLabel}</p>
    </div>
  );
}
