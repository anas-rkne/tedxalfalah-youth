"use client";

import { useMemo, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRTL } from "@/hooks/useRTL";
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import Countdown from "@/components/shared/Countdown";
import ActionButtons from "@/components/home/ActionButtons";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";

const EVENT_DATE = "2026-11-15T09:00:00+04:00";

const ANIMATION_CONFIG = {
  fadeUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const },
  },
  fadeScale: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
  },
  fadeX: (direction: "left" | "right", isRTL: boolean) => ({
    initial: {
      opacity: 0,
      x: direction === "left" ? (isRTL ? 40 : -40) : (isRTL ? -40 : 40),
    },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
  }),
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

/* ═══════════════════════════════════════════════════════════════
   🏷️ شارة حدث TEDx - تمت إزالة النصوص الافتراضية بالكامل
   ═══════════════════════════════════════════════════════════════ */
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

const DecorativeDivider = memo(function DecorativeDivider() {
  return (
    <div className="flex items-center gap-3 w-full max-w-[200px] mx-auto">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
      <div className="flex items-center gap-1">
        <div className="w-1 h-1 rounded-full bg-tedx-red/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-tedx-red/40" />
        <div className="w-1 h-1 rounded-full bg-tedx-red/20" />
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   🖼️ صورة جانبية — حجم كبير + منطق flip الأصلي
   ═══════════════════════════════════════════════════════════════ */
const HeroSideImage = memo(function HeroSideImage({
  src,
  alt,
  flip,
  direction,
  delay,
}: {
  src: string;
  alt: string;
  flip: boolean;
  direction: "left" | "right";
  delay: number;
}) {
  const { isRTL } = useRTL();
  const anim = useMemo(
    () => ANIMATION_CONFIG.fadeX(direction, isRTL),
    [direction, isRTL]
  );

  return (
    <motion.div
      initial={anim.initial}
      animate={anim.animate}
      transition={{ ...anim.transition, delay }}
      className="hidden lg:flex flex-col items-center flex-shrink-0 w-48 lg:w-56 xl:w-64"
    >
      <div className="relative w-full aspect-[3/4]">
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-contain", flip && "scale-x-[-1]")}
          sizes="(max-width: 1280px) 224px, 256px"
          priority={direction === "left"}
          loading={direction === "left" ? "eager" : "lazy"}
        />
      </div>
    </motion.div>
  );
});

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
    <div className="text-base md:text-lg text-muted-foreground max-w-2xl text-center flex flex-col gap-2.5 leading-relaxed">
      <p className="text-tedx-red font-bold text-lg md:text-xl tracking-tight">
        {eventName}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-muted-foreground text-sm md:text-base">
        <span>{dateText}</span>
        <span className="hidden sm:inline text-border">•</span>
        <span>{venueText}</span>
      </div>
    </div>
  );
});

const FadeUp = memo(function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
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
  const { isRTL } = useRTL();

  return (
    <BackgroundBeamsWithCollision className="min-h-[calc(100dvh-80px)]">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 xl:gap-14 w-full max-w-7xl mx-auto px-4 relative h-full">
        
        {/* الصورة اليسرى - flip بناءً على اللغة الإنجليزية */}
        <HeroSideImage
          src="/images/boy-pointing-left.jpg"
          alt="صورة توضيحية — فتى يشير لليسار"
          flip={!isRTL} // ✅ true في الإنجليزية، false في العربية (كما كان سابقاً)
          direction="left"
          delay={0.15}
        />

        <div className="relative z-10 px-4 flex flex-col items-center gap-5 md:gap-7 justify-center w-full h-full">
          
          {/* شارة الحدث - الآن تستلم النصوص بدقة */}
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

        {/* الصورة اليمنى - flip بناءً على اللغة الإنجليزية */}
        <HeroSideImage
          src="/images/girl-pointing-right.jpg"
          alt="صورة توضيحية — فتاة تشير لليمين"
          flip={!isRTL} // ✅ true في الإنجليزية، false في العربية (كما كان سابقاً)
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