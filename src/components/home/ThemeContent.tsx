"use client";

import { useRef, useMemo } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { Users, Ticket, Calendar } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

interface ThemeContentProps {
  title: string;
  body: string;
  badgeLabel: string;
  statSpeakersLabel: string;
  statSeatsLabel: string;
  statDayLabel: string;
  beliefsHeading: string;
  valuesHeading: string;
  value1Title: string;
  value1Desc: string;
  value2Title: string;
  value2Desc: string;
  value3Title: string;
  value3Desc: string;
  ctaHeading: string;
  ctaDescription: string;
  applyLabel: string;
  ticketsLabel: string;
  leftImageSrc?: string;
  rightImageSrc?: string;
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
        ease: [0.23, 1, 0.32, 1] as const,
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
   مكون إحصائية
   ═══════════════════════════════════════════════════════════════ */
function StatItem({
  icon,
  value,
  label,
  delay,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center gap-2"
    >
      <div className="w-10 h-10 rounded-xl bg-tedx-red/10 flex items-center justify-center text-tedx-red">
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون بطاقة قيمة TEDx
   ═══════════════════════════════════════════════════════════════ */
function ValueCard({
  number,
  title,
  description,
  delay,
}: {
  number: string;
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
      <div className="text-4xl font-bold text-tedx-red/10 group-hover:text-tedx-red/20 transition-colors duration-500 mb-3">
        {number}
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   🎭 صورة جانبية متحركة — Float + Parallax + Shadow + Particles
   ═══════════════════════════════════════════════════════════════ */
function ThemeSideImage({
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
  const { isRTL } = useRTL();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // ═══════ Parallax Mouse ═══════
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 30, mass: 1 };
  const parallaxX = useSpring(
    useTransform(
      mouseX,
      [-0.5, 0.5],
      direction === "left" ? [12, -12] : [-12, 12]
    ),
    springConfig
  );
  const parallaxY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [8, -8]),
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

  // ═══════ Entrance X ═══════
  const xInitial = useMemo(() => {
    if (direction === "left") return isRTL ? 50 : -50;
    return isRTL ? -50 : 50;
  }, [direction, isRTL]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: xInitial }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] as const }}
      className="hidden lg:flex flex-col items-center flex-shrink-0 w-56 lg:w-64 xl:w-72 relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
        dir="ltr"
      
    >
      {/* ═══════ الظل النابض ═══════ */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-5 rounded-[100%] bg-zinc-600/40 blur-md z-0"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.8, 0.5],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: [0.42, 0, 0.58, 1] as const,
          delay: delay + 0.5,
        }}
      />

      {/* ═══════ الصورة مع التأثيرات ═══════ */}
      <motion.div
className="relative w-full aspect-[3/4] z-10 overflow-hidden"
        style={{
          x: shouldReduceMotion ? 0 : parallaxX,
          y: shouldReduceMotion ? 0 : parallaxY,
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                y: [0, -10, 0],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: [0.42, 0, 0.58, 1] as const,
          delay: delay + 0.5,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 1280px) 224px, 288px"
        />

        {/* تدرج ناعم من الأسفل */}

        {/* ═══════ جزيئات حمراء تتبع الحركة ═══════ */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute top-1/4 -left-3 w-2 h-2 rounded-full bg-[#e62b1e] z-20"
              animate={{
                y: [0, -18, 0],
                opacity: [0, 0.5, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: delay + 0.5,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute top-1/3 -right-3 w-1.5 h-1.5 rounded-full bg-[#e62b1e] z-20"
              animate={{
                y: [0, -14, 0],
                opacity: [0, 0.6, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: delay + 1.2,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-[#e62b1e] z-20"
              animate={{
                y: [0, -22, 0],
                x: [0, 8, 0],
                opacity: [0, 0.35, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: delay + 0.8,
                ease: "easeOut",
              }}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ThemeContent({
  title,
  body,
  badgeLabel,
  statSpeakersLabel,
  statSeatsLabel,
  statDayLabel,
  beliefsHeading,
  valuesHeading,
  value1Title,
  value1Desc,
  value2Title,
  value2Desc,
  value3Title,
  value3Desc,
  ctaHeading,
  ctaDescription,
  applyLabel,
  ticketsLabel,
  leftImageSrc,
  rightImageSrc,
}: ThemeContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();

  const titleWords = title.split(" ");
  const highlightWords = ["TEDx", "TEDxYouth", "Ideas", "Power", "Future", "Change"];

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — العنوان الرئيسي (مع صور جانبية متحركة)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center min-h-[60vh]">
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
          
          {/* الصورة اليسرى */}
          {leftImageSrc && (
            <ThemeSideImage
              src={leftImageSrc}
              alt="Left side illustration"
              direction="left"
              delay={0.15}
            />
          )}

          {/* المحتوى المركزي */}
          <div className="flex-1 w-full max-w-4xl flex flex-col items-center text-center gap-8 md:gap-10">

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
              transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] as const }}
              className="flex items-center gap-3 origin-center"
            >
              <div className="h-px w-10 bg-border" />
              <div className="h-1 w-16 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
              <div className="h-px w-10 bg-border" />
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="max-w-3xl"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <p className="text-lg md:text-xl text-center text-muted-foreground leading-[1.9] font-light">
                {body.split(/(\s+)/).map((part, index) => {
                  const isEnglish = /^[A-Za-z0-9]/.test(part);
                  const isTEDx = /TEDx/i.test(part);

                  if (isTEDx) {
                    return (
                      <span
                        key={index}
                        dir="ltr"
                        className="inline-block text-foreground font-bold mx-1"
                      >
                        {part}
                      </span>
                    );
                  }

                  if (isEnglish) {
                    return (
                      <span key={index} dir="ltr" className="inline-block mx-0.5">
                        {part}
                      </span>
                    );
                  }

                  return <span key={index}>{part}</span>;
                })}
              </p>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex items-center gap-6 sm:gap-10 pt-2"
            >
              <StatItem icon={<Users className="w-5 h-5" />} value="12+" label={statSpeakersLabel} delay={0.6} />
              <div className="w-px h-10 bg-border" />
              <StatItem icon={<Ticket className="w-5 h-5" />} value="200" label={statSeatsLabel} delay={0.7} />
              <div className="w-px h-10 bg-border" />
              <StatItem icon={<Calendar className="w-5 h-5" />} value="1" label={statDayLabel} delay={0.8} />
            </motion.div>
          </div>

          {/* الصورة اليمنى */}
          {rightImageSrc && (
            <ThemeSideImage
              src={rightImageSrc}
              alt="Right side illustration"
              direction="right"
              delay={0.3}
            />
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          VALUES SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="section-padding relative bg-muted/30">
        <div className="container-padding max-w-6xl mx-auto">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3 block">
              {beliefsHeading}
            </span>
            <h2 className="heading-h2 tracking-[-0.02em]">
              {valuesHeading}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <ValueCard number="01" title={value1Title} description={value1Desc} delay={0.1} />
            <ValueCard number="02" title={value2Title} description={value2Desc} delay={0.2} />
            <ValueCard number="03" title={value3Title} description={value3Desc} delay={0.3} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="section-padding relative">
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
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <AnimatedSlidingButton
                  href="/apply"
                  variant="primary"
                  className="min-w-[140px] bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
                >
                  {applyLabel}
                </AnimatedSlidingButton>

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
      </div>
    </section>
  );
}