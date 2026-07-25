"use client";

import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TedxGlobe } from "@/components/ui/tedx-globe";
import { Users, Lightbulb, Globe } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import SectionBadge from "@/components/ui/SectionBadge";
import FadeUp from "@/components/shared/FadeUp";
import DarkCTASection from "@/components/shared/DarkCTASection";


interface AboutContentProps {
  heading: string;
  body: string;
  licenseNote: string;
  badgeLabel: string;
  valuesLabels: {
    platform: string;
    community: string;
    ideas: string;
  };
  ctaHeading: string;
  ctaDescription: string;
  applyLabel: string;
  ticketsLabel: string;
}

/* ═══════════════════════════════════════════════════════════════
   مكونات فرعية مستخرجة (ثابتة، تُنشأ مرة واحدة)
   ═══════════════════════════════════════════════════════════════ */

const AnimatedWord = memo(function AnimatedWord({
  word,
  index,
  isHighlight,
  shouldReduceMotion,
}: {
  word: string;
  index: number;
  isHighlight: boolean;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <motion.span
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 40, rotateX: -40 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`inline-block mx-1 md:mx-1.5 ${
        isHighlight ? "text-tedx-red" : "text-foreground"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {word}
    </motion.span>
  );
});

const MiniValue = memo(function MiniValue({
  icon,
  text,
  delay,
}: {
  icon: React.ReactNode;
  text: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-2 px-3 py-2 rounded-full bg-background border border-border shadow-sm"
    >
      <div className="w-6 h-6 rounded-md bg-tedx-red/10 flex items-center justify-center text-tedx-red">
        {icon}
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{text}</span>
    </motion.div>
  );
});

const FormattedParagraph = memo(function FormattedParagraph({
  text,
  className,
  isRTL,
}: {
  text: string;
  className?: string;
  isRTL: boolean;
}) {
  const parts = useMemo(() => {
    const highlightRegex = /(TEDx|TED)(?![A-Za-z0-9])/g;
    const result: { type: "text" | "highlight"; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = highlightRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      result.push({ type: "highlight", content: match[0] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      result.push({ type: "text", content: text.slice(lastIndex) });
    }
    if (result.length === 0) {
      result.push({ type: "text", content: text });
    }
    return result;
  }, [text]);

  return (
    <p className={className} dir={isRTL ? "rtl" : "ltr"}>
      {parts.map((part, index) => {
        if (part.type === "highlight") {
          return (
            <span key={index} dir="ltr" className="inline-block text-tedx-red font-semibold">
              {part.content}
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </p>
  );
});

/* ═══════════════════════════════════════════════════════════════
   المكون الرئيسي
   ═══════════════════════════════════════════════════════════════ */
export default function AboutContent({
  heading,
  body,
  licenseNote,
  badgeLabel,
  valuesLabels,
  ctaHeading,
  ctaDescription,
  applyLabel,
  ticketsLabel,
}: AboutContentProps) {
  const { isRTL } = useRTL();
  const shouldReduceMotion = useReducedMotion();

  const titleWords = useMemo(() => heading.split(" "), [heading]);
  const highlightWords = ["TED", "TEDx"];

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      {/* ─── HEADER ─── */}
      <div className="container-padding max-w-5xl mx-auto text-center">
        <FadeUp>
          <div className="flex justify-center mb-4">
            <SectionBadge>{badgeLabel}</SectionBadge>
          </div>
        </FadeUp>

        <div className="perspective-[1000px] mt-6 heading-margin">
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
          className="flex items-center justify-center gap-3 origin-center"
        >
          <div className="h-px w-10 bg-border" />
          <div className="h-1 w-14 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
          <div className="h-px w-10 bg-border" />
        </motion.div>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="container-padding max-w-7xl mx-auto mt-10 md:mt-16">
        {/* dir="ltr" يثبت ترتيب: الكرة يسار، النص يمين */}
        <div
          dir="ltr"
          className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
        >
          {/* الكرة الأرضية (ثابتة يسار) */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full max-w-md lg:max-w-lg flex-shrink-0"
          >
            <div className="relative aspect-square rounded-[32px] bg-gradient-to-br from-zinc-50/50 to-zinc-100/50 border border-border overflow-hidden flex items-center justify-center">
              <TedxGlobe />
              <div className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">
                TEDx
              </div>
            </div>
          </motion.div>

          {/* النص التعريفي (dir="auto" لاستجابة الاتجاه للغة) */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 max-w-xl"
            dir="auto"
          >
            <div className="relative p-8 md:p-10 rounded-[24px] bg-card border border-border">
              <div className="w-12 h-12 rounded-2xl bg-tedx-red/10 flex items-center justify-center text-tedx-red mb-6">
                <Lightbulb className="w-6 h-6" />
              </div>

              <FormattedParagraph
                text={body}
                className="text-lg md:text-xl text-muted-foreground leading-[1.9] font-light"
                isRTL={isRTL}
              />

              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
                <MiniValue icon={<Globe className="w-3 h-3" />} text={valuesLabels.platform} delay={0.4} />
                <MiniValue icon={<Users className="w-3 h-3" />} text={valuesLabels.community} delay={0.5} />
                <MiniValue icon={<Lightbulb className="w-3 h-3" />} text={valuesLabels.ideas} delay={0.6} />
              </div>
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-card border border-border">
              <p
                className="text-sm text-muted-foreground italic leading-relaxed"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {licenseNote}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── CTA ─── */}
  <DarkCTASection
  heading={ctaHeading}
  description={ctaDescription}
  primaryButton={{ href: "/tickets", label: ticketsLabel }}
  secondaryButton={{ href: "/apply", label: applyLabel }}
  className="mt-16 md:mt-24"
/>
    </section>
  );
}