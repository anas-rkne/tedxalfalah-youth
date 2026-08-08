"use client";

import { useRef, memo } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Calendar } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import Countdown from "@/components/shared/Countdown";
import ActionButtons from "@/components/home/ActionButtons";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import FadeUp from "@/components/shared/FadeUp";

const EVENT_DATE = "2026-12-18T09:00:00+04:00";

const ANIMATION_CONFIG = {
  fadeScale: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
  },
} as const;

const PulseDot = memo(function PulseDot({ delay = 0 }: { delay?: number }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tedx-red opacity-30"
        style={{ animationDelay: `${delay}s` }}
      />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tedx-red" />
    </span>
  );
});

const EventBadge = memo(function EventBadge({
  label,
  year,
}: {
  label: string;
  year: string;
}) {
  return (
    <motion.div
      {...ANIMATION_CONFIG.fadeScale}
      transition={{ ...ANIMATION_CONFIG.fadeScale.transition, delay: 0.1 }}
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-tedx-red/10 border border-tedx-red/20"
    >
      <PulseDot />
      <span className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-tedx-red">
        {label}
      </span>
      <span className="w-px h-3 bg-tedx-red/20" />
      <span className="text-[10px] font-semibold text-tedx-red/60">{year}</span>
    </motion.div>
  );
});

/* ─── AnimatedCharacter ─── */
function AnimatedCharacter({
  src,
  alt,
  direction,
  delay,
}: {
  src: string;
  alt: string;
  direction: "left" | "right";
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 30, mass: 1 };
  const parallaxX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], direction === "left" ? [15, -15] : [-15, 15]),
    springConfig
  );
  const parallaxY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [10, -10]),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: direction === "left" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      className="hidden lg:flex flex-col items-center flex-shrink-0 w-48 lg:w-56 xl:w-64 relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full aspect-[3/4] overflow-visible will-change-transform"
        style={{
          x: shouldReduceMotion ? 0 : parallaxX,
          y: shouldReduceMotion ? 0 : parallaxY,
        }}
        animate={shouldReduceMotion ? undefined : { y: [0, -12, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: [0.42, 0, 0.58, 1],
          delay: delay + 0.5,
        }}
      >
        <SafeImage
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 1280px) 224px, 256px"
          priority={direction === "left"}
          loading={direction === "left" ? "eager" : "lazy"}
        />

        {/* 5 فقاعات حمراء */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute top-1/4 -left-4 w-2 h-2 rounded-full bg-tedx-red z-20"
              animate={{ y: [0, -20, 0], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: delay + 0.5, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute top-1/3 -right-4 w-1.5 h-1.5 rounded-full bg-tedx-red z-20"
              animate={{ y: [0, -15, 0], opacity: [0, 0.5, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: delay + 1.2, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-tedx-red z-20"
              animate={{ y: [0, -25, 0], x: [0, 10, 0], opacity: [0, 0.4, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: delay + 0.8, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-tedx-red/80 z-20"
              animate={{ y: [0, -18, 0], x: [0, -8, 0], opacity: [0, 0.7, 0], scale: [0.5, 1.3, 0.5] }}
              transition={{ duration: 3.2, repeat: Infinity, delay: delay + 1.8, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 rounded-full bg-tedx-red z-20"
              animate={{ y: [0, -22, 0], x: [0, -5, 0], opacity: [0, 0.5, 0], scale: [0.6, 1.1, 0.6] }}
              transition={{ duration: 3.8, repeat: Infinity, delay: delay + 2.2, ease: [0.23, 1, 0.32, 1] }}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── SaveTheDate ─── */
const SaveTheDate = memo(function SaveTheDate({
  saveTheDateLabel,
  dateText,
  venueText,
}: {
  saveTheDateLabel: string;
  dateText: string;
  venueText: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-sm md:text-base">
      <span className="inline-flex items-center gap-1.5 text-tedx-red font-bold uppercase tracking-[0.15em] text-xs md:text-sm">
        <Calendar className="w-4 h-4" />
        {saveTheDateLabel}
      </span>
      <span className="text-zinc-500 font-semibold">{dateText}</span>
      <span className="hidden sm:inline text-zinc-300">•</span>
      <span className="text-zinc-500 font-semibold">{venueText}</span>
    </div>
  );
});

export default function HeroDynamicContent({
  tagline,
  dateText,
  venueText,
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
  applyLabel: string;
  saveSeatLabel: string;
  badgeLabel: string;
  eventYear: string;
  intro: string;
  saveTheDateLabel: string;
}) {
  return (
    <BackgroundBeamsWithCollision className="min-h-full overflow-hidden">
      <div
        dir="ltr"
        className="flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-4 xl:gap-6 w-full max-w-7xl mx-auto px-4 overflow-hidden"
      >
        <AnimatedCharacter
          src="/images/طفلة 1.svg"
          alt="صورة توضيحية — فتى يشير لليسار"
          direction="left"
          delay={0.15}
        />

        {/* العمود المركزي */}
        <div
          dir="auto"
          className="relative z-10 px-2 sm:px-4 flex flex-col items-center w-full pt-20 lg:pt-12 gap-6 md:gap-8"
        >
          {/* 🔥 الكتلة العليا */}
          <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
            <FadeUp delay={0.1}>
              <EventBadge label={badgeLabel} year={eventYear} />
            </FadeUp>
            <FadeUp delay={0.2} className="w-full">
              <HeroTypewriterTitle title={tagline} />
            </FadeUp>
            <FadeUp delay={0.25}>
              <p className="text-base md:text-lg text-zinc-500 text-center max-w-2xl leading-relaxed">
                {intro}
              </p>
            </FadeUp>
          </div>

          {/* Save the Date */}
          <FadeUp delay={0.4}>
            <SaveTheDate
              saveTheDateLabel={saveTheDateLabel}
              dateText={dateText}
              venueText={venueText}
            />
          </FadeUp>

          {/* العد التنازلي */}
          <FadeUp delay={0.6}>
            <Countdown targetDate={EVENT_DATE} />
          </FadeUp>

          {/* الأزرار */}
          <FadeUp delay={0.7}>
            <ActionButtons applyLabel={applyLabel} ticketsLabel={saveSeatLabel} />
          </FadeUp>
        </div>

        <AnimatedCharacter
          src="/images/صفل 1.svg"
          alt="صورة توضيحية — فتاة تشير لليمين"
          direction="right"
          delay={0.3}
        />
      </div>

      <FadeUp delay={0.9}>
        <ScrollIndicator />
      </FadeUp>
    </BackgroundBeamsWithCollision>
  );
}
