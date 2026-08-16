"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import Countdown from "@/components/shared/Countdown";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import FadeUp from "@/components/shared/FadeUp";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

const EVENT_DATE = "2026-12-19T09:00:00+04:00";

const ANIMATION_CONFIG = {
  fadeScale: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
  },
} as const;

/* ───────────────────────────────────────────────────────────
   HeroFlourish
   النص التمهيدي بخط يدوي أحمر
   ─────────────────────────────────────────────────────────── */
const HeroFlourish = memo(function HeroFlourish({
  label,
  year,
}: {
  label: string;
  year: string;
}) {
  const lines = label.split("\n");

  return (
    <motion.p
      {...ANIMATION_CONFIG.fadeScale}
      transition={{ ...ANIMATION_CONFIG.fadeScale.transition, delay: 0.1 }}
      dir="ltr"
      className="text-tedx-red text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.9] -rotate-3 select-none flex flex-col items-start w-full"
      style={{
        fontFamily: "'Caveat', 'Segoe Script', cursive",
      }}
    >
      {lines.map((line, index) => (
        <span key={index} className={index === 1 ? "self-end" : undefined}>
          {line}
        </span>
      ))}
      <span className="sr-only"> {year}</span>
    </motion.p>
  );
});

/* ───────────────────────────────────────────────────────────
   SaveTheDate
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

  // استخدام التوقيت العالمي لضمان ظهور اليوم 19 دائمًا
  const day = String(date.getUTCDate());
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
        className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-3"
      >
        {/* عمود التاريخ */}
        <div className="flex items-start gap-2">
          <span
            className="text-tedx-red font-extrabold text-4xl md:text-5xl leading-[0.85]"
            style={{ fontFamily: "'Caveat', 'Segoe Script', cursive" }}
          >
            {day}
          </span>
          <div className="flex flex-col leading-tight pt-1">
            <span className="text-zinc-800 font-bold text-sm md:text-base">
              {monthEn}
            </span>
            <span
              className="text-zinc-500 text-sm md:text-base font-arabic"
              dir="rtl"
            >
              {monthYearAr}
            </span>
          </div>
        </div>

        {/* عمود الموقع */}
        <div className="flex flex-col items-center sm:items-start leading-tight text-sm md:text-base">
          <span
            dir="rtl"
            lang="ar"
            className="font-arabic text-black font-semibold"
          >
            {venueText}
          </span>
          {venueTextAr && (
            <span
              dir="rtl"
              lang="ar"
              className="font-arabic text-black font-semibold"
            >
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
  saveSeatLabel,
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
  saveSeatLabel: string;
  badgeLabel: string;
  eventYear: string;
  intro: string;
  saveTheDateLabel: string;
}) {
  return (
   
      <div
        dir="auto"
  className="relative z-20 w-full max-w-7xl mx-auto px-4 pt-20 lg:pt-16 flex flex-col items-center gap-6 md:gap-8 overflow-visible">
        {/* صورة Artboard3 على اليمين في منتصف الـ Hero */}
        <img
          src="/images/Artboard 3.svg"
          alt=""
          aria-hidden="true"
className="hidden min-[821px]:block absolute right-2 lg:right-2 xl:right-2 top-1/2 -translate-y-1/2 w-36 md:w-48 lg:w-60 xl:w-72 pointer-events-none select-none max-[940px]:top-[calc(50%-100px)]"
        />

        {/* صورة Artboard2 على اليسار أسفل الهيرو متداخلة مع القسم التالي */}
        <img
          src="/images/Artboard 2.svg"
          alt=""
          aria-hidden="true"
className="hidden md:block absolute left-4 lg:left-10 xl:left-16 bottom-0 translate-y-1/2 w-36 md:w-48 lg:w-60 xl:w-72 pointer-events-none select-none z-100"
        />

        {/* الكتلة المركزية: العنوان التمهيدي + العنوان الرئيسي + النص التعريفي */}
        <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-4xl mx-auto text-center">
          <FadeUp delay={0.1}>
            <HeroFlourish label={"Tomorrow,\nNow"} year={eventYear} />
          </FadeUp>

          <FadeUp delay={0.2} className="w-full -mt-2 md:-mt-4">
            <HeroTypewriterTitle title={tagline} />
          </FadeUp>

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
            venueText="نبض الفلاح Nabdh Al Falah"
            venueTextAr="ابو ظبي Abu Dhabi"
            saveTheDateLabel={saveTheDateLabel}
            dateText={dateText}
          />
        </FadeUp>

        {/* العداد التنازلي */}
        <FadeUp delay={0.6}>
          <Countdown targetDate={countdownTarget ?? EVENT_DATE} />
        </FadeUp>

        {/* الأزرار الثنائية: Apply Now + Get Tickets */}
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

            <AnimatedSlidingButton
              href="/tickets"
              variant="secondary"
              className="px-8 py-3 min-w-[180px] bg-white text-black border border-black hover:bg-zinc-50 hover:text-black"
            >
              {saveSeatLabel}
            </AnimatedSlidingButton>
          </div>
        </FadeUp>
      </div>
  );
}