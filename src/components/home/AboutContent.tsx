"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TedxGlobe } from "@/components/ui/tedx-globe";
import { Users, Lightbulb, Globe } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import SectionBadge from "@/components/ui/SectionBadge";

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
   مكون كلمة عنوان متحركة
   ═══════════════════════════════════════════════════════════════ */
function AnimatedWord({
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
}

/* ═══════════════════════════════════════════════════════════════
   مكون قيمة صغيرة (أصبحت تقبل النص كـ prop)
   ═══════════════════════════════════════════════════════════════ */
function MiniValue({
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
}

/* ═══════════════════════════════════════════════════════════════
   مكون فقرة نصية (يدعم التمييز)
   ═══════════════════════════════════════════════════════════════ */
function FormattedParagraph({
  text,
  className,
  isRTL,
}: {
  text: string;
  className?: string;
  isRTL: boolean;
}) {
  const highlightRegex = /(TEDx|TED)(?![A-Za-z0-9])/g;
  const parts: { type: "text" | "highlight"; content: string }[] = [];

  let lastIndex = 0;
  let match;

  while ((match = highlightRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "highlight", content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content: text });
  }

  return (
    <p className={className} dir={isRTL ? "rtl" : "ltr"}>
      {parts.map((part, index) => {
        if (part.type === "highlight") {
          return (
            <span
              key={index}
              dir="ltr"
              className="inline-block text-tedx-red font-semibold"
            >
              {part.content}
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </p>
  );
}

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
  const { isRTL } = useRTL(); // ✅ فقط لتحديد الاتجاه
  const shouldReduceMotion = useReducedMotion();

  const titleWords = heading.split(" ");
  const highlightWords = ["TED", "TEDx"];

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      
      {/* ═══════════════════════════════════════════════════════════════
          HEADER - بداية القسم
          ═══════════════════════════════════════════════════════════════ */}
      <div className="container-padding max-w-5xl mx-auto text-center">
        
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-4">
            {/* ✅ الشارة تأتي من الـ prop الآن */}
            <SectionBadge>
              {badgeLabel}
            </SectionBadge>
          </div>
        </motion.div>

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

      {/* ═══════════════════════════════════════════════════════════════
          CONTENT - المحتوى الرئيسي
          ═══════════════════════════════════════════════════════════════ */}
      <div className="container-padding max-w-7xl mx-auto mt-10 md:mt-16">
        <div
          className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${
            isRTL ? "lg:flex-row-reverse" : "lg:flex-row"
          }`}
        >
          {/* الكرة الأرضية */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, x: isRTL ? 40 : -40 }}
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

          {/* النص التعريفي */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, x: isRTL ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 max-w-xl"
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

              {/* قيم صغيرة */}
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
                <MiniValue
                  icon={<Globe className="w-3 h-3" />}
                  text={valuesLabels.platform} // ✅ من الـ prop
                  delay={0.4}
                />
                <MiniValue
                  icon={<Users className="w-3 h-3" />}
                  text={valuesLabels.community} // ✅ من الـ prop
                  delay={0.5}
                />
                <MiniValue
                  icon={<Lightbulb className="w-3 h-3" />}
                  text={valuesLabels.ideas} // ✅ من الـ prop
                  delay={0.6}
                />
              </div>
            </div>

            {/* ملاحظة الترخيص */}
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

      {/* ═══════════════════════════════════════════════════════════════
          CTA - دعوة للانضمام (تم عكس الهرمية: الأساسي للتذاكر، الثانوي للتقديم)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="container-padding max-w-4xl mx-auto mt-16 md:mt-24">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="p-10 md:p-14 rounded-[32px] bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative overflow-hidden text-center"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-tedx-red/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-tedx-red/5 rounded-full blur-2xl" />

          <div className="relative z-10">
            <h2 className="heading-h2 mb-4 text-white">
              {ctaHeading}
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
              {ctaDescription}
            </p>
            
            {/* ✅ أزرار هرمية صحيحة */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              
              {/* 1. زر ثانوي (للتقديم) - خلفية شفافة */}
              <AnimatedSlidingButton
                href="/apply"
                variant="primary"
                className="min-w-[140px] bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                {applyLabel}
              </AnimatedSlidingButton>

              {/* 2. زر أساسي (للتذاكر) - لون أحمر */}
              <AnimatedSlidingButton
                href="/tickets"
                variant="primary"
                className="min-w-[140px] shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)]"
              >
                {ticketsLabel}
              </AnimatedSlidingButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}