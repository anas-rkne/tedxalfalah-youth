"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare, TrendingUp, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useQaStream } from "@/lib/qa/use-qa-stream";
import type { PublicPoll, PublicQuestion, PublicSnapshot } from "@/lib/qa/public-view";
import WordCloud, { calculateWordFrequency } from "@/components/qa/WordCloud";

/** الحالة قبل وصول أول إطار — مطابقة تماماً لشكل اللقطة الحقيقية. */
const EMPTY_SNAPSHOT: PublicSnapshot = {
  active: false,
  settings: { eventName: "", eventNameAr: "", active: false },
  session: null,
  questions: [],
  polls: [],
  screen: { mode: "manual", slide: { kind: "hold" } },
};

export default function LiveScreen() {
  const t = useTranslations("qa");
  const locale = useLocale();
  const { data: streamData } = useQaStream({ view: "live", pollInterval: 3000 });
  const [qIdx, setQIdx] = useState(0);

  const data = streamData ?? EMPTY_SNAPSHOT;
  const screen = data.screen ?? EMPTY_SNAPSHOT.screen;
  const slide = screen.slide;

  // `visible` هو تطبيق showOnLive: كان الخادم يحسبه والواجهة تتجاهله، فزر
  // "مخفي من الشاشة" في لوحة الإدارة بلا أي أثر فعلياً.
  const questions = data.questions.filter((q) => !q.answered && q.visible);

  /**
   * ⚠️ التدوير التلقائي يعمل **فقط** في وضع `auto` **و** فقط بلا شريحة مثبَّتة.
   *
   * القاعدة: التثبيت اليدوي يفوز دائماً. فلو دارت الشاشة على وضع `auto`
   * والتثبيت اليدوي موجود، لاختفى تثبيت المشرف بعد 7 ثوانٍ — وزر «التالي»
   * في اللوحة يصبح بلا أثر. لذلك الشرط مزدوج وليس `mode === "auto"` فقط.
   */
  const pinned = slide.kind === "question" || slide.kind === "poll";
  const rotating = screen.mode === "auto" && !pinned;

  useEffect(() => {
    if (!rotating) return;
    if (questions.length <= 1) return;
    const iv = setInterval(() => setQIdx((i) => (i + 1) % questions.length), 7000);
    return () => clearInterval(iv);
  }, [rotating, questions.length]);

  const activePoll = data.polls.find((p) => p.active);
  const endedPoll = data.polls.find((p) => !p.active && p.showResults);

  /**
   * ترتيب الأولوية على الشاشة:
   *   1. شريحة مثبَّتة (سؤال أو استطلاع) — قرار المشرف، لا يُمَسّ.
   *   2. استعلام نشط/منتهٍ بنتائج — لأنه جاري الآن.
   *   3. وضع `auto`: تدوير المخزون.
   *   4. كلمة الانتظار.
   */
  const pinnedQuestion =
    slide.kind === "question" ? questions.find((q) => q.id === slide.questionId) : undefined;
  const pinnedPoll =
    slide.kind === "poll" ? data.polls.find((p) => p.id === slide.pollId) : undefined;
  const displayPoll =
    pinnedPoll ?? (pinned ? undefined : activePoll ?? endedPoll);
  const wantsResults = displayPoll?.showResults ?? false;
  const rotateQuestion = rotating ? questions[qIdx % questions.length] : undefined;

  const body = !data.active || !data.session ? (
    <div className="text-center">
      <h2 className="text-4xl font-bold">{t("screen.waiting")}</h2>
      <p className="text-zinc-400 text-xl mt-3">{t("screen.waitingSubtitle")}</p>
    </div>
  ) : pinnedQuestion ? (
    <QuestionCard q={pinnedQuestion} label={t("screen.questionsLabel")} testId="qa-screen-question" />
  ) : displayPoll && wantsResults ? (
    <PollResults
      poll={displayPoll}
      label={t("screen.pollLabel")}
      votesLabel={t("screen.pollVotes", { count: displayPoll.totalVotes ?? 0 })}
    />
  ) : slide.kind === "wordCloud" ? (
    <div className="w-full max-w-4xl" data-testid="qa-screen-wordcloud">
      <div className="inline-flex items-center gap-2 text-red-400 uppercase tracking-widest text-sm mb-6">
        <MessageSquare className="h-4 w-4" />
        {t("screen.wordCloudLabel")}
      </div>
      <div className="h-[45vh]">
        <WordCloud words={calculateWordFrequency(questions.map((q) => q.text))} maxWords={20} />
      </div>
    </div>
  ) : rotateQuestion ? (
    <QuestionCard q={rotateQuestion} label={t("screen.questionsLabel")} testId="qa-screen-question" />
  ) : (
    <HoldCard />
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-10 select-none">
      {/* Header — عنوان الجلسة فقط (دون اسم الفعالية) */}
      {data.session && (
        <header className="absolute top-6 inset-x-0 text-center w-full px-4">
          <p className="text-zinc-400 text-xl">{data.session.titleAr || data.session.title}</p>
        </header>
      )}

      {/* Main content */}
      <main className="w-full max-w-4xl flex-1 flex items-center justify-center">{body}</main>

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

      {/* QR Code for joining — خاص بالجلسة الحالية */}
      {data.session &&
        (() => {
          // `?session=` صار له معنى (وكان قد حُذف لأنه ميت): القارئ الذي
          // يمسح رمز QR **مطبوعاً على مطبوعة قديمة** يجب أن يعرف أن جلسته
          // انتهت، لا أن يُدخله في جلسة أخرى جارية بلا أن يدري.
          // `LiveParticipate` يتحقق من `session` ويعرض رسالة واضحة عند
          // عدم التطابق.
          const joinUrl = `${
            typeof window !== "undefined" ? window.location.origin : ""
          }/${locale}/live?session=${data.session.id}`;
          return (
            <div
              // ⚠️ `data-qr-value` للاختبار الآلي والتشغيل: قراءة الرابط من
              // داخل SVG تحتاج فك ترميز، والرابط نفسه ليس سرّاً — كل من
              // يرى الشاشة يستطيع قراءته من الرمز.
              data-testid="qa-screen-qr"
              data-qr-value={joinUrl}
              className="absolute bottom-6 right-8 flex flex-col items-center gap-2 bg-zinc-900/80 rounded-2xl p-4 backdrop-blur-sm"
            >
              <QRCodeSVG value={joinUrl} size={120} bgColor="transparent" fgColor="#ffffff" level="M" />
              <span className="text-zinc-400 text-xs">{t("screen.scanToJoin")}</span>
            </div>
          );
        })()}
    </div>
  );
}

function QuestionCard({ q, label, testId }: { q: PublicQuestion; label: string; testId?: string }) {
  return (
    <div className="text-center max-w-3xl" data-testid={testId}>
      <div className="inline-flex items-center gap-2 text-red-400 uppercase tracking-widest text-sm mb-6">
        <MessageSquare className="h-4 w-4" />
        {label}
      </div>
      <p className="text-4xl md:text-5xl leading-snug font-medium">{q.text}</p>
      <p className="text-zinc-400 text-xl mt-6">— {q.author}</p>
    </div>
  );
}

/**
 * «بانتظار المشرف» — الشريحة الافتراضية في الوضع اليدوي.
 *
 * ⚠️ لماذا يظهر هذا بدل «لا توجد أسئلة»؟
  * في الوضع اليدوي الشاشة «مملوكة» للمشرف. فراغُ المخزون ليس خطأ ولا نهاية
  * الفعالية، بل انتقالٌ مُفترض: المشرف سيضع سؤالاً بعد ثوانٍ. إظهار «لا توجد
  * أسئلة» كان يوحي للحضور بأنّ هذه المرحلة قد انتهت — إشارة خاطئة تماماً.
 */
function HoldCard() {
  const t = useTranslations("qa");
  return (
    <div className="text-center" data-testid="qa-screen-hold">
      <MessageSquare className="h-16 w-16 mx-auto text-zinc-700 mb-4" />
      <p className="text-zinc-300 text-3xl">{t("screen.hold")}</p>
    </div>
  );
}

function PollResults({ poll, label, votesLabel }: { poll: PublicPoll; label: string; votesLabel: string }) {
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
