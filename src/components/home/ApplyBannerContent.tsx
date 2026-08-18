"use client";

import { useRef, useMemo, memo } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import { Mic, Lightbulb, Users, CheckCircle2 } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import AnimatedWord from "@/components/shared/AnimatedWord";

interface ApplyBannerContentProps {
  isClosed: boolean;
  closedCta: string;
  badgeLabel: string;
  text: string; // العنوان الرئيسي الثاني
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

// مكون العنوان الثلاثي الأحمر
const AnimatedTitleLine = memo(function AnimatedTitleLine({
  text,
  index,
  shouldReduceMotion,
}: {
  text: string;
  index: number;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 40, rotateX: -40 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`block text-center w-full text-tedx-red text-5xl md:text-7xl font-alexandria font-black tracking-tight leading-[1.1]`}
      style={{ transformStyle: "preserve-3d", fontWeight: 900 }}
    >
      {text}
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
}: ApplyBannerContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();

  // العنوان ثلاثي الأسطر الأحمر
  const titleLines = useMemo(() => ["SHARE", "YOUR VOICE", "TODAY"], []);

  return (
    <section ref={containerRef} className="section-padding pt-0 relative bg-background overflow-hidden">

      {/* ═══════════ HERO + صور جانبية ═══════════ */}
      <div
        dir="ltr"
        className="relative flex flex-col lg:flex-row items-center justify-center min-h-[60vh] pb-10 md:pb-14"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-[50%] bg-tedx-red/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
          
          {/* العمود الأيسر: صورة Artboard 7 و Artboard 8 */}
          <div className="hidden lg:flex flex-col flex-shrink-0 w-56 lg:w-64 xl:w-72 h-full relative min-h-[300px]">
            <motion.img
              src="/images/Artboard 7.svg"
              alt="Left illustration 1"
              className="absolute -top-30 right-0 w-full h-auto object-contain z-10 pointer-events-none select-none"
              animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <img
              src="/images/Artboard 8.svg"
              alt="Left illustration 2"
              className="absolute top-0 left-0 w-[80%] h-auto object-contain z-20 pointer-events-none select-none"
            />
          </div>

          {/* المحتوى الأوسط */}
          <div className="flex-1 w-full max-w-4xl flex flex-col items-center text-center gap-8 md:gap-10" dir="auto">
            
            {/* 1. العنوان الأول الأحمر الثلاثي */}
            <div className="perspective-[1000px] flex flex-col items-center justify-center w-full">
              <AnimatedTitleLine
                text={titleLines[0]}
                index={0}
                shouldReduceMotion={shouldReduceMotion}
              />
              <AnimatedTitleLine
                text={titleLines[1]}
                index={1}
                shouldReduceMotion={shouldReduceMotion}
              />
              <AnimatedTitleLine
                text={titleLines[2]}
                index={2}
                shouldReduceMotion={shouldReduceMotion}
              />
            </div>

            {/* 2. العنوان الثاني الرئيسي (القادم من {text}) */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="perspective-[1000px]"
            >
              <h1 className="heading-h1 tracking-[-0.03em] leading-[1.1]">
                {text}
              </h1>
            </motion.div>

            {/* 🟢 تم نقل الفاصل الزخرفي إلى أسفل العنوان الثاني */}
            <img
              src="/images/Artboard 2 copy 2.svg"
              alt=""
              aria-hidden="true"
              className="mx-auto mt-0 block w-40 md:w-56 h-10 md:h-12 object-cover origin-center pointer-events-none select-none"
            />

            {/* 3. النص الفرعي ({subtitle}) */}
            <motion.p
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {subtitle}
            </motion.p>

            {/* 4. الزر */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              <AnimatedSlidingButton href={isClosed ? "/" : "/apply"} variant="primary">
                {isClosed ? closedCta : cta}
              </AnimatedSlidingButton>
            </motion.div>
          </div>

          {/* العمود الأيمن: صورة Artboard 4 (في أعلى العمود) */}
          <div className="hidden lg:flex flex-col flex-shrink-0 w-56 lg:w-64 xl:w-72 h-full relative min-h-[300px]">
            <motion.img
              src="/images/Artboard 4.svg"
              alt="Right illustration"
              className="absolute -top-40 right-4 scale-[1.35] h-auto object-contain z-10 pointer-events-none select-none"
              animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

        </div>
      </div>

    </section>
  );
}