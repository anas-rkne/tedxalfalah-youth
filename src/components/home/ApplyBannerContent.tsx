"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mic, Lightbulb, Users, CheckCircle2 } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import SectionBadge from "@/components/ui/SectionBadge";

interface ApplyBannerContentProps {
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
   مكون خطوة التقديم
   ═══════════════════════════════════════════════════════════════ */
function StepCard({
  number,
  icon,
  title,
  description,
  delay,
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
}

/* ═══════════════════════════════════════════════════════════════
   مكون ميزة
   ═══════════════════════════════════════════════════════════════ */
function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full bg-tedx-red/10 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-3 h-3 text-tedx-red" />
      </div>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

export default function ApplyBannerContent({
  badgeLabel,
  text,
  subtitle,
  cta,
  stepsHeading,
  step1Title,
  step1Desc,
  step2Title,
  step2Desc,
  step3Title,
  step3Desc,
  whyApplyLabel,
  whyApplyHeading,
  reasons,
  ctaHeading,
  ctaDescription,
    placeholderTitle,
  placeholderSubtitle,
  stageBadgeLabel,
  stageTitle,
  stageDescription,
}: ApplyBannerContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();

  const titleWords = text.split(" ");
  const highlightWords = ["TEDx", "TEDxYouth", "تقدم", "شارك", "صوتك", "فكرتك", "Apply", "Speak", "Voice"];

  return (
    <section ref={containerRef} className="section-padding relative bg-background overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — العنوان الرئيسي
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-10 md:gap-12">

          {/* ✅ الشارة الموحدة */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <SectionBadge>{badgeLabel}</SectionBadge>
          </motion.div>

          {/* العنوان */}
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

          {/* الخط الزخرفي */}
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

          {/* النص الفرعي - أصبح ديناميكي الاتجاه */}
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

          {/* الزر الرئيسي */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          >
            <AnimatedSlidingButton href="/apply" variant="primary">
              {cta}
            </AnimatedSlidingButton>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STEPS SECTION — خطوات التقديم
          ═══════════════════════════════════════════════════════════════ */}
      <div className="section-padding relative bg-muted/30">
        <div className="container-padding max-w-5xl mx-auto">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3 block">
              {stepsHeading}
            </span>
            <h2 className="heading-h2 tracking-[-0.02em]">
              {stepsHeading} {/* يمكنك تحويل هذا لـ heading2Title منفصل إذا أردت */}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            <StepCard
              number="01"
              icon={<Mic className="w-5 h-5" />}
              title={step1Title}
              description={step1Desc}
              delay={0.1}
            />
            <StepCard
              number="02"
              icon={<Lightbulb className="w-5 h-5" />}
              title={step2Title}
              description={step2Desc}
              delay={0.2}
            />
            <StepCard
              number="03"
              icon={<Users className="w-5 h-5" />}
              title={step3Title}
              description={step3Desc}
              delay={0.3}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          WHY APPLY SECTION — لماذا تقدم؟
          ═══════════════════════════════════════════════════════════════ */}
      <div className="section-padding relative">
        <div className="container-padding max-w-4xl mx-auto">
          <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${isRTL ? "md:grid" : ""}`}>
      {/* Left: Living TEDx Stage Preview */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, x: isRTL ? 40 : -40, scale: 0.95 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="relative aspect-[16/10] rounded-3xl overflow-hidden group"
      >
        {/* ═══════════════════════════════════════════════════════════════
            الخلفية الحية — تدرج TEDx الديناميكي
            ═══════════════════════════════════════════════════════════════ */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
          {/* نمط الشبكة العصبية */}
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(230,43,30,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(230,43,30,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          {/* نبض مركزي */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-[#e62b1e]/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute w-20 h-20 rounded-full bg-[#e62b1e]/30 animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            الصورة الفعلية (مع fallback ذكي)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* دائرة المنصة الرئيسية */}
            <div className="relative">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-[#e62b1e]/30 flex items-center justify-center">
                <div className="w-36 h-36 md:w-48 md:h-48 rounded-full border border-[#e62b1e]/20 flex items-center justify-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#e62b1e] to-red-700 flex items-center justify-center shadow-[0_0_60px_rgba(230,43,30,0.4)] group-hover:shadow-[0_0_80px_rgba(230,43,30,0.6)] transition-shadow duration-500">
                    <Mic className="w-10 h-10 md:w-14 md:h-14 text-white" />
                  </div>
                </div>
              </div>
              
              {/* نقاط دائرية متحركة */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-[#e62b1e]"
                  style={{ top: '50%', left: '50%' }}
                  animate={{
                    x: Math.cos((i * 60 * Math.PI) / 180) * 120,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 120,
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            Overlay Glassmorphism — المعلومات
            ═══════════════════════════════════════════════════════════════ */}
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <div className="relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 overflow-hidden group-hover:bg-white/10 transition-all duration-500">
            {/* توهج خلفي */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#e62b1e]/20 rounded-full blur-2xl group-hover:bg-[#e62b1e]/30 transition-colors duration-500" />
            
            <div className="relative z-10">
              {/* ✅ الشارة المتحركة - من الترجمة */}
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e62b1e] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e62b1e]" />
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#e62b1e]">
                  {stageBadgeLabel} {/* ✅ من الترجمة */}
                </span>
              </div>
              
              {/* ✅ العنوان - من الترجمة */}
              <h3 className="text-lg md:text-xl font-bold text-white mb-1 tracking-[-0.02em]">
                {stageTitle}
              </h3>
              
              {/* ✅ الوصف - من الترجمة */}
              <p className="text-sm text-zinc-300 leading-relaxed">
                {stageDescription}
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            زاوية TEDx العلامة التجارية
            ═══════════════════════════════════════════════════════════════ */}
        <div className="absolute top-5 right-5 md:top-6 md:right-6">
          <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <span className="text-[10px] font-black tracking-[0.15em] text-white">
              TED<span className="text-[#e62b1e]">x</span>
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            خطوط زخرفية متحركة
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#e62b1e] to-transparent"
          animate={{ opacity: [0, 1, 0], x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, x: isRTL ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-tedx-red mb-3 block">
                {whyApplyLabel}
              </span>
              <h2 className="heading-h2 tracking-[-0.02em] mb-6">
                {whyApplyHeading}
              </h2>
              <div className="space-y-4">
                {reasons.map((reason, index) => (
                  <FeatureItem key={index} text={reason} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CTA SECTION — دعوة نهائية (استخدام الزر الموحد)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="section-padding relative bg-muted/30">
        <div className="container-padding max-w-4xl mx-auto text-center">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 md:p-14 rounded-[32px] bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-tedx-red/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-tedx-red/5 rounded-full blur-2xl" />

            <div className="relative z-10">
              <h2 className="heading-h2 mb-4 text-white">
                {ctaHeading}
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
                {ctaDescription}
              </p>
              
              {/* ✅ الزر الموحد AnimatedSlidingButton - نظراً للخلفية الداكنة، نضبطه */}
              <div className="flex justify-center">
                <AnimatedSlidingButton href="/apply" variant="primary" className="min-w-[160px] shadow-[0_8px_30px_-12px_rgba(230,43,30,0.5)]">
                  {cta}
                </AnimatedSlidingButton>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}