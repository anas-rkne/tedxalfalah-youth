"use client";

import { useRef, memo } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import Countdown from "@/components/shared/Countdown";
import ActionButtons from "@/components/home/ActionButtons";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import FadeUp from "@/components/shared/FadeUp";

const EVENT_DATE = "2026-11-15T09:00:00+04:00";

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
        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e62b1e] opacity-30"
        style={{ animationDelay: `${delay}s` }}
      />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e62b1e]" />
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
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#e62b1e]/10 border border-[#e62b1e]/20"
    >
      <PulseDot />
      <span className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-[#e62b1e]">
        {label}
      </span>
      <span className="w-px h-3 bg-[#e62b1e]/20" />
      <span className="text-[10px] font-semibold text-[#e62b1e]/60">{year}</span>
    </motion.div>
  );
});

const DecorativeDivider = memo(function DecorativeDivider() {
  return (
    <div className="flex items-center gap-3 w-full max-w-[200px] mx-auto">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-zinc-200" />
      <div className="flex items-center gap-1">
        <div className="w-1 h-1 rounded-full bg-[#e62b1e]/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#e62b1e]/40" />
        <div className="w-1 h-1 rounded-full bg-[#e62b1e]/20" />
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-zinc-200" />
    </div>
  );
});

/* ─── AnimatedCharacter (بدون ظل، مع 5 فقاعات) ─── */
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
      className="hidden lg:flex flex-col items-center flex-shrink-0 w-56 lg:w-64 xl:w-72 relative"
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
              className="absolute top-1/4 -left-4 w-2 h-2 rounded-full bg-[#e62b1e] z-20"
              animate={{ y: [0, -20, 0], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: delay + 0.5, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute top-1/3 -right-4 w-1.5 h-1.5 rounded-full bg-[#e62b1e] z-20"
              animate={{ y: [0, -15, 0], opacity: [0, 0.5, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: delay + 1.2, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-[#e62b1e] z-20"
              animate={{ y: [0, -25, 0], x: [0, 10, 0], opacity: [0, 0.4, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: delay + 0.8, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-[#e62b1e]/80 z-20"
              animate={{ y: [0, -18, 0], x: [0, -8, 0], opacity: [0, 0.7, 0], scale: [0.5, 1.3, 0.5] }}
              transition={{ duration: 3.2, repeat: Infinity, delay: delay + 1.8, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 rounded-full bg-[#e62b1e] z-20"
              animate={{ y: [0, -22, 0], x: [0, -5, 0], opacity: [0, 0.5, 0], scale: [0.6, 1.1, 0.6] }}
              transition={{ duration: 3.8, repeat: Infinity, delay: delay + 2.2, ease: [0.23, 1, 0.32, 1] }}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

const EventInfo = memo(function EventInfo({
  eventName,
  dateText,
  venueText,
}: {
  eventName: string;
  dateText: string;
  venueText: string;
}) {
  return (
    <div className="text-base md:text-lg text-zinc-400 max-w-2xl text-center flex flex-col gap-2.5 leading-relaxed">
      <p className="text-[#e62b1e] font-bold text-lg md:text-xl tracking-tight">
        {eventName}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-zinc-400 text-sm md:text-base">
        <span>{dateText}</span>
        <span className="hidden sm:inline text-zinc-200">•</span>
        <span>{venueText}</span>
      </div>
    </div>
  );
});

export default function HeroDynamicContent({
  eventName,
  tagline,
  dateText,
  venueText,
  scrollLabel,
  applyLabel,
  ticketsLabel,
  badgeLabel,
  eventYear,
}: {
  eventName: string;
  tagline: string;
  dateText: string;
  venueText: string;
  scrollLabel: string;
  applyLabel: string;
  ticketsLabel: string;
  badgeLabel: string;
  eventYear: string;
}) {
  return (
    <BackgroundBeamsWithCollision className="h-[calc(100vh-80px)]">
      <div
        dir="ltr"
        className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 xl:gap-14 w-full max-w-7xl mx-auto px-4 relative h-full"
      >
        <AnimatedCharacter
                    src="/images/طفلة 1.svg"

          alt="صورة توضيحية — فتى يشير لليسار"
          direction="left"
          delay={0.15}
        />

        <div
          dir="auto"
          className="relative z-10 px-2 sm:px-4 flex flex-col items-center gap-5 md:gap-7 justify-center w-full h-full"
        >
          <FadeUp delay={0.1}>
            <EventBadge label={badgeLabel} year={eventYear} />
          </FadeUp>

          <FadeUp delay={0.25} className="w-full">
            <HeroTypewriterTitle title={tagline} />
          </FadeUp>

          <FadeUp delay={0.35} className="w-full">
            <DecorativeDivider />
          </FadeUp>

          <FadeUp delay={0.45}>
            <EventInfo
              eventName={eventName}
              dateText={dateText}
              venueText={venueText}
            />
          </FadeUp>

          <FadeUp delay={0.55}>
            <Countdown targetDate={EVENT_DATE} />
          </FadeUp>

          <FadeUp delay={0.7}>
            <ActionButtons applyLabel={applyLabel} ticketsLabel={ticketsLabel} />
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