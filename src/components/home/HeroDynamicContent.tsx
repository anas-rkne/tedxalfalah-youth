"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import Countdown from "@/components/shared/Countdown";
import FadeUp from "@/components/shared/FadeUp";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

const EVENT_DATE = "2026-12-19T09:00:00+04:00";

/* ───────────────────────────────────────────────────────────
   المكون الرئيسي للواجهة
   ─────────────────────────────────────────────────────────── */
const SaveTheDate = memo(function SaveTheDate({
  countdownTarget,
  venueText,
  venueTextAr,
  saveTheDateLabel,
  dateText,
}: {
  countdownTarget: string;
  venueText: string;
  venueTextAr?: string;
  saveTheDateLabel: string;
  dateText: string;
}) {
  const date = new Date(countdownTarget);

  const monthEn = date.toLocaleDateString("en-US", { month: "long" });
  const monthYearAr = new Intl.DateTimeFormat("ar", {
    month: "long",
    year: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(date);

  return (
    <div dir="ltr" className="flex flex-col items-center gap-2">
      <span className="sr-only">
        {saveTheDateLabel}: {dateText} — {venueText}
      </span>

      <div
        aria-hidden="true"
        className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 "
      >
        <div className="flex flex-col items-center ">
          <div className="flex items-center p-0 m-0">
            <img
              src="/images/Artboard 1.svg"
              alt=""
              aria-hidden="true"
              className="h-16 md:h-20 w-auto object-contain pointer-events-none"
            />
          <span className="text-xl md:text-2xl -ml-4 md:-ml-6 text-zinc-800 font-alexandria">
              {monthEn}
            </span>
          </div>
          <span dir="rtl" lang="ar"   className="font-alexandria text-[21px] md:text-[27px] -mt-7 md:-mt-8 pl-4  text-zinc-800">
            {monthYearAr}
          </span>
        </div>

        <div className="flex flex-col items-center sm:items-start leading-tight gap-1 pt-6">
          <span
            dir="auto"
            className="font-alexandria text-base text-xl md:text-2xl  text-black"
          >
            {venueText}
          </span>
          {venueTextAr && (
            <span
              dir="auto"
              className="font-alexandria text-xl md:text-2xl -mt-2 text-black pl-0 min-[423px]:pl-[4rem] text-center md:text-right w-full">
               {venueTextAr}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

/* ───────────────────────────────────────────────────────────
   المكون الرئيسي للواجهة
   ─────────────────────────────────────────────────────────── */
export default function HeroDynamicContent({
  tagline,
  dateText,
  venueText,
  venueTextAr,
  countdownTarget,
  applyLabel,
  badgeLabel,
  eventYear,
  intro,
  saveTheDateLabel,
}: {
  tagline: string;
  dateText: string;
  venueText: string;
  venueTextAr?: string;
  countdownTarget?: string;
  applyLabel: string;
  badgeLabel: string;
  eventYear: string;
  intro: string;
  saveTheDateLabel: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      dir="auto"
      className="relative z-20 w-full max-w-7xl mx-auto px-4 pt-20 lg:pt-16 flex flex-col items-center gap-6 md:gap-8 overflow-x-clip"
    >
      {/* صورة Artboard3 على اليمين — يمين الفقرة التعريفية بمسافة أمان ≥25px (تظهر من 1024px فأعلى) */}
      <motion.img
        src="/images/Artboard 3.svg?v=3"
        alt=""
        aria-hidden="true"
        className="hidden min-[1024px]:block absolute right-6 top-[51%] -translate-y-1/2 translate-x-[20px] w-36 xl:w-56 pointer-events-none select-none"
        animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* صورة Artboard2 على اليسار — نفس حركة العوم */}
      <motion.img
        src="/images/Artboard 2.svg"
        alt=""
        aria-hidden="true"
        className="hidden md:block absolute left-4 lg:left-10 xl:left-16 bottom-0 translate-y-1/2 w-52 md:w-64 lg:w-80 xl:w-96 pointer-events-none select-none z-100"
        animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* الكتلة المركزية */}
      <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-4xl mx-auto text-center">
        {/* الصورة الرئيسية + العنوان بمسافة ثابتة 5px (بدون gap) */}
        <div className="flex flex-col items-center">
          <div className="relative -rotate-3 select-none leading-none">
            <img
              src="/images/Artboard 9.svg?v=2"
              alt=""
              aria-hidden="true"
              className="block w-40 sm:w-56 md:w-72 h-auto pointer-events-none"
            />
            <span className="sr-only">Tomorrow, Now — {eventYear}</span>
          </div>

          {/* العنوان الرئيسي بفجوة حبر-إلى-حبر 5px بالضبط لكل شاشة */}
          <FadeUp delay={0.2} className="w-full mt-[-18px] sm:mt-[-25px] md:mt-[-33px] lg:mt-[-33px] xl:mt-[-36px]">
            <HeroTypewriterTitle title={tagline} />
          </FadeUp>
        </div>

        {/* النص التعريفي */}
        <FadeUp delay={0.25}>
          <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {intro}
          </p>
        </FadeUp>
      </div>

      {/* التاريخ والموقع */}
      <FadeUp delay={0.4}>
        <SaveTheDate
          countdownTarget={countdownTarget ?? EVENT_DATE}
          venueText="نبض الفلاح ,Nabdh Al Falah"
          venueTextAr="آبوظــــــــبي Abu Dhabi"
          saveTheDateLabel={saveTheDateLabel}
          dateText={dateText}
        />
      </FadeUp>

      {/* العداد التنازلي */}
      <FadeUp delay={0.6}>
        <Countdown targetDate={countdownTarget ?? EVENT_DATE} />
      </FadeUp>

      {/* الأزرار */}
      <FadeUp delay={0.7}>
        <div
          dir="ltr"
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-lg mx-auto"
        >
          <AnimatedSlidingButton
            href="/apply"
            variant="primary"
            className="px-8 py-3 min-w-[180px]"
          >
            {applyLabel}
          </AnimatedSlidingButton>
        </div>
      </FadeUp>
    </div>
  );
}