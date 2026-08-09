"use client";

import { useRef, useMemo, memo } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,   // ✅
  useSpring,        // ✅
  useTransform,     // ✅
} from "framer-motion";

import { Mic, Lightbulb, Users, CheckCircle2 } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import SectionBadge from "@/components/ui/SectionBadge";
import SafeImage from "@/components/ui/SafeImage";
import AnimatedWord from "@/components/shared/AnimatedWord";
import DarkCTASection from "@/components/shared/DarkCTASection";

interface ApplyBannerContentProps {
  isClosed: boolean;
  closedCta: string;
  badgeLabel: string;
  text: string;
  subtitle: string;
  cta: string;
  stepsHeading: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  whyApplyLabel: string;
  whyApplyHeading: string;
  reasons: string[];
  ctaHeading: string;
  ctaDescription: string;
  placeholderTitle: string;
  placeholderSubtitle: string;
  stageBadgeLabel: string;
  stageTitle: string;
  stageDescription: string;
  leftImageSrc?: string;
  rightImageSrc?: string;
}

/* ═══════════ مكونات فرعية ═══════════ */

const StepCard = memo(function StepCard({
  number, icon, title, description, delay,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group relative p-6 rounded-2xl bg-card border border-border 
        hover:border-tedx-red/20 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]
        transition-all duration-500"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-tedx-red/10 flex items-center justify-center text-tedx-red
          group-hover:bg-tedx-red group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-tedx-red/50 tracking-[0.15em] uppercase">
              Step {number}
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
});

const FeatureItem = memo(function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full bg-tedx-red/10 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-3 h-3 text-tedx-red" />
      </div>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
});

const ApplySideImage = memo(function ApplySideImage({
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
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      className="hidden lg:flex flex-col items-center flex-shrink-0 w-56 lg:w-64 xl:w-72 relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full aspect-[3/4] z-10 overflow-visible will-change-transform"
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
          priority
          className="object-contain"
          sizes="(max-width: 1280px) 224px, 288px"
        />

        {/* 5 جزيئات حمراء مطابقة لقسم الهيرو */}
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
});

/* ═══════════ المكون الرئيسي ═══════════ */

export default function ApplyBannerContent({
  isClosed, closedCta,
  badgeLabel, text, subtitle, cta,
  stepsHeading, step1Title, step1Desc, step2Title, step2Desc, step3Title, step3Desc,
  whyApplyLabel, whyApplyHeading, reasons,
  ctaHeading, ctaDescription,
  placeholderTitle, placeholderSubtitle,
  stageBadgeLabel, stageTitle, stageDescription,
  leftImageSrc, rightImageSrc,
}: ApplyBannerContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();

  const titleWords = useMemo(() => text.split(" "), [text]);
  const highlightWords = useMemo(
    () => ["TEDx", "TEDxYouth", "تقدم", "شارك", "صوتك", "فكرتك", "Apply", "Speak", "Voice"],
    []
  );

  return (
    <section ref={containerRef} className="section-padding relative bg-background overflow-hidden">

      {/* ═══════════ HERO + صور جانبية ═══════════ */}
      <div
        dir="ltr"
  className="relative flex flex-col lg:flex-row items-center justify-center min-h-[60vh] pb-16 md:pb-24"
      >
     <div className="absolute inset-0 pointer-events-none">
<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-[50%] bg-tedx-red/5 blur-3xl" />
</div>

        <div className="container-padding relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
          {leftImageSrc && (
            <ApplySideImage src={leftImageSrc} alt="Left illustration" direction="left" delay={0.15} />
          )}

          <div className="flex-1 w-full max-w-4xl flex flex-col items-center text-center gap-8 md:gap-10" dir="auto">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <SectionBadge>{badgeLabel}</SectionBadge>
            </motion.div>

            <div className="perspective-[1000px]">
              <h1 className="heading-h1 tracking-[-0.03em] leading-[1.1]">
                {titleWords.map((word, index) => (
                  <AnimatedWord
                    key={index}
                    word={word}
                    index={index}
                    isHighlight={highlightWords.some((hw) =>
                      word.toLowerCase().includes(hw.toLowerCase())
                    )}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ))}
              </h1>
            </div>

            <motion.div
              initial={shouldReduceMotion ? {} : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-3 origin-center"
            >
              <div className="h-px w-10 bg-border" />
              <div className="h-1 w-16 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
              <div className="h-px w-10 bg-border" />
            </motion.div>

            <motion.p
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {subtitle}
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              <AnimatedSlidingButton href={isClosed ? "/tickets" : "/apply"} variant="primary">
                {isClosed ? closedCta : cta}
              </AnimatedSlidingButton>
            </motion.div>
          </div>

          {rightImageSrc && (
            <ApplySideImage src={rightImageSrc} alt="Right illustration" direction="right" delay={0.3} />
          )}
        </div>
      </div>

 
    </section>
  );
}