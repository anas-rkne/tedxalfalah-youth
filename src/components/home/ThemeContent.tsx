"use client";

import { useRef, memo } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Users, Ticket, Calendar } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge";
import SafeImage from "@/components/ui/SafeImage";


interface ThemeContentProps {
  title: string;
  body: string;
  badgeLabel: string;
  statSpeakersLabel: string;
  statSeatsLabel: string;
  statDayLabel: string;
  leftImageSrc?: string;
  rightImageSrc?: string;
}

/* ═══════════════════════════════════════════
   مكونات فرعية (ثابتة)
   ═══════════════════════════════════════════ */

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

const StatItem = memo(function StatItem({
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
});

/* ═════════════════════════════════════════
   صورة جانبية – SafeImage + اتجاه ثابت
   ═══════════════════════════════════════════ */
const ThemeSideImage = memo(function ThemeSideImage({
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
          className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
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

/* ═══════════════════════════════════════════
   المكون الرئيسي
   ═══════════════════════════════════════════ */
export default function ThemeContent({
  title,
  body,
  badgeLabel,
  statSpeakersLabel,
  statSeatsLabel,
  statDayLabel,
  leftImageSrc,
  rightImageSrc,
}: ThemeContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();

  const titleWords = title.split(" ");
  const highlightWords = ["TEDx", "TEDxYouth", "Ideas", "Power", "Future", "Change"];

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      {/* ═══════════ HERO SECTION (صور + محتوى) ═══════════ */}
      <div
        dir="ltr" // يثبت ترتيب الصورتين والمحتوى الأوسط
        className="relative flex flex-col lg:flex-row items-center justify-center min-h-[60vh]"
      >
        {/* خلفية */}
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

          {/* المحتوى الأوسط */}
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
                      <span key={index} dir="ltr" className="inline-block text-foreground font-bold mx-1">
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
              className="flex items-center gap-6 sm:gap-10 pt-2 pb-10"
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
    </section>
  );
}