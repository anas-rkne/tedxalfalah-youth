"use client";

import { useRef, memo } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import SectionBadge from "@/components/ui/SectionBadge";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

interface ScheduleHeroSectionProps {
  badgeLabel: string;
  title: string;
  eventDate: string;
  description: string;
  isArabic: boolean;
  ticketsLabel: string;
}

const DefaultBackground = memo(function DefaultBackground({
  shouldReduceMotion,
  imageY,
  imageScale,
}: {
  shouldReduceMotion: boolean | null;
  imageY: MotionValue<number>;
  imageScale: MotionValue<number>;
}) {
  return (
    <motion.div style={{ y: imageY, scale: imageScale }} className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center items-center pointer-events-none opacity-[0.02] mix-blend-screen">
        <span className="text-[60vw] md:text-[40vw] font-black leading-none select-none text-white">X</span>
      </div>
      <div className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(230,43,30,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230,43,30,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 20%, transparent 70%)",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-[800px] h-[500px] bg-tedx-red/[0.08] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[25%] start-[10%] hidden lg:flex flex-col items-center opacity-40">
        <div className="w-2.5 h-2.5 rounded-full bg-tedx-red animate-pulse shadow-[0_0_15px_#e62b1e]" />
        <div className="w-px h-32 bg-gradient-to-b from-tedx-red to-transparent" />
      </div>
      <div className="absolute bottom-[25%] end-[10%] hidden lg:flex flex-col items-center opacity-40">
        <div className="w-px h-32 bg-gradient-to-t from-tedx-red to-transparent" />
        <div className="w-2.5 h-2.5 rounded-full bg-tedx-red animate-pulse shadow-[0_0_15px_#e62b1e]" />
      </div>
    </motion.div>
  );
});

const ScheduleHeroSection = memo(function ScheduleHeroSection({
  badgeLabel,
  title,
  eventDate,
  description,
  isArabic,
  ticketsLabel,
}: ScheduleHeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : 150]);
  const imageScale = useTransform(scrollY, [0, 500], [1, shouldReduceMotion ? 1 : 1.1]);

  return (
    <section
      ref={containerRef}
      className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-36 md:pb-28 lg:pt-40 lg:pb-32 overflow-hidden bg-[#050505] flex flex-col justify-center min-h-[75vh]"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <DefaultBackground shouldReduceMotion={shouldReduceMotion} imageY={imageY} imageScale={imageScale} />

      <div className="max-w-[1000px] mx-auto px-5 sm:px-6 md:px-10 relative z-10 w-full flex flex-col items-center text-center">
        <div className="hero-fade-up mb-6 sm:mb-8" style={{ animationDelay: "0.1s" }}>
          <SectionBadge className="bg-tedx-red/10 border-tedx-red/20 text-tedx-red px-5 py-2 backdrop-blur-md">
            {badgeLabel}
          </SectionBadge>
        </div>
        <div className="space-y-4 hero-fade-up w-full" style={{ animationDelay: "0.2s" }}>
          <h1 className={`text-[2.75rem] sm:text-5xl md:text-7xl lg:text-[6rem] font-black leading-[1.1] md:leading-[1.05] ${isArabic ? "font-arabic tracking-normal" : "tracking-[-0.04em]"}`}>
            <span className="block text-white mb-2 md:mb-4">{title}</span>
          </h1>
        </div>
        <div className="hero-fade-up w-full" style={{ animationDelay: "0.25s" }}>
          <p className={`text-tedx-red text-lg sm:text-xl md:text-2xl font-bold ${isArabic ? "font-arabic" : ""}`}>
            {eventDate}
          </p>
        </div>
        <div className="flex items-center justify-center gap-4 w-full hero-fade-up py-8 md:py-10" style={{ animationDelay: "0.3s" }}>
          <div className="h-px w-20 sm:w-32 md:w-48 bg-gradient-to-r from-transparent to-zinc-600 rounded-full" />
          <div className="relative flex items-center justify-center shrink-0">
            <span className="absolute inline-flex h-3 w-3 rounded-full bg-tedx-red/40 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-tedx-red" />
          </div>
          <div className="h-px w-20 sm:w-32 md:w-48 bg-gradient-to-l from-transparent to-zinc-600 rounded-full" />
        </div>
        <div className="w-full max-w-lg md:max-w-2xl mx-auto hero-fade-up" style={{ animationDelay: "0.4s" }}>
          <p className={`text-zinc-400 text-base sm:text-lg md:text-xl font-medium leading-relaxed ${isArabic ? "font-arabic" : "font-sans"}`}>
            {description}
          </p>
        </div>
        <div className="mt-10 hero-fade-up" style={{ animationDelay: "0.5s" }}>
          <AnimatedSlidingButton href="/tickets" variant="primary" className="min-w-[180px]">
            {ticketsLabel}
          </AnimatedSlidingButton>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[3px] z-10">
        <div className="h-full" style={{ background: "linear-gradient(90deg, transparent, #e62b1e, #ff4d3f, #e62b1e, transparent)" }} />
      </div>
    </section>
  );
});

export default ScheduleHeroSection;
