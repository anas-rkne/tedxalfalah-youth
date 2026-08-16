"use client";

import { memo } from "react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge";
import Image from "next/image"; // استخدام next/image القياسي

interface ThemeContentProps {
  title: string;
  body: string;
  badgeLabel: string;
  statSpeakersLabel: string;
  statSeatsLabel: string;
  statDayLabel: string;
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
}: ThemeContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();

  const titleWords = title.split(" ");
  const highlightWords = ["TEDx", "TEDxYouth", "Ideas", "Power", "Future", "Change"];

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      <div
        dir="ltr"
        className="relative flex flex-col lg:flex-row items-center justify-center min-h-[60vh]"
      >
        {/* خلفية التوهج */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
          
          {/* 🟢 العمود الأيسر: صورة Artboard 6 - تم تكبيرها للضعف ورفعها 20px للأعلى */}
                 <div className="hidden lg:flex flex-col flex-shrink-0 w-56 lg:w-64 xl:w-72 h-full relative min-h-[300px] overflow-visible">
            <Image
              src="/images/Artboard 6.svg"
              alt="Left illustration"
              fill
              // 🟢 scale-x-[1] يحافظ على العرض، scale-y-[2] يكبر الارتفاع للضعف
              // 🟢 -translate-y-10 يرفعها للأعلى، و translate-x-8 يزحزحها لليمين
              className="object-contain scale-x-[2] scale-y-[2.4] -translate-y-30 translate-x-16"
              sizes="(max-width: 1280px) 224px, 288px"
            />
          </div>

          {/* المحتوى الأوسط */}
          <div className="flex-1 w-full max-w-4xl flex flex-col items-center text-center gap-8 md:gap-10" dir="auto">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
           
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

          {/* استبدال الخطوط المزخرفة بصورة Artboard 2 copy 2.svg */}
     <img
          src="/images/Artboard 2 copy 2.svg"
          alt=""
          aria-hidden="true"
          className="mx-auto mt-0 block w-40 md:w-56 h-10 md:h-12 object-cover origin-center pointer-events-none select-none"
        />

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

            {/* إحصائيات Artboard 10, 11, 12 */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 pt-2 pb-10"
            >
              {/* العنصر 1 */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 overflow-visible flex items-center justify-center">
                  <img 
                    src="/images/Artboard 10.svg" 
                    alt="Stat 1" 
                    className="w-full h-full object-contain"
                    style={{ transform: 'scale(3.5)', transformOrigin: 'center' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{statSpeakersLabel}</span>
              </div>
              
              <div className="w-px h-16 bg-border" />
              
              {/* العنصر 2 */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 overflow-visible flex items-center justify-center">
                  <img 
                    src="/images/Artboard 11.svg" 
                    alt="Stat 2" 
                    className="w-full h-full object-contain"
                    style={{ transform: 'scale(3.5)', transformOrigin: 'center' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{statSeatsLabel}</span>
              </div>
              
              <div className="w-px h-16 bg-border" />
              
              {/* العنصر 3 */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 overflow-visible flex items-center justify-center">
                  <img 
                    src="/images/Artboard 12.svg" 
                    alt="Stat 3" 
                    className="w-full h-full object-contain"
                    style={{ transform: 'scale(3.5)', transformOrigin: 'center' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{statDayLabel}</span>
              </div>
            </motion.div>
          </div>

          {/* 🟢 العمود الأيمن: صورة Artboard 7 */}
          <div className="hidden lg:block relative flex-shrink-0 w-56 lg:w-64 xl:w-72 h-auto overflow-visible">
            <img
              src="/images/Artboard 7.svg"
              alt="Right illustration"
              className="absolute -top-50 left-0 w-[80%] h-auto object-contain z-10"
            />
          </div>
          
        </div>
      </div>
    </section>
  );
}