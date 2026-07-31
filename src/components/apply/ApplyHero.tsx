"use client";

import { useRef, memo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import TextType from "@/components/TextType";
import SafeImage from "@/components/ui/SafeImage";

interface ApplyHeroProps {
  title: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  imageAlt?: string;
}

/* ═══════════ مؤشر التمرير ═══════════ */
function ScrollIndicator() {
  const t = useTranslations("common");
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-20"
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      onClick={() => {
        window.scrollTo({ top: window.innerHeight * 0.9, behavior: "smooth" });
      }}
    >
      <span className="text-[11px] font-medium text-white/30 tracking-[0.15em] uppercase">
        {t("ui.scroll")}
      </span>
      <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      <ChevronDown size={14} className="text-white/30" />
    </motion.div>
  );
}

const ApplyHero = memo(function ApplyHero({
  title,
  subtitle,
  body,
  imageUrl = "/images/youth-speaker-2.jpg",
  imageAlt = "Apply to speak",
}: ApplyHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const imageY = useTransform(
    scrollY,
    [0, 1000],
    [0, shouldReduceMotion ? 0 : 180]
  );
  const imageScale = useTransform(
    scrollY,
    [0, 1000],
    [1, shouldReduceMotion ? 1 : 1.12]
  );
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0.15]);
  const contentY = useTransform(
    scrollY,
    [0, 500],
    [0, shouldReduceMotion ? 0 : 60]
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-[85vh] overflow-hidden flex items-center pb-20"
    >
      {/* صورة الخلفية مع Parallax – SafeImage لمنع الانعكاس */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imageY, scale: imageScale }}
      >
        <SafeImage
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </motion.div>

      {/* طبقات التدرج – لقراءة النص بوضوح */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,14,0.55) 0%, rgba(10,10,14,0.20) 25%, rgba(10,10,14,0.10) 40%, rgba(10,10,14,0.30) 55%, rgba(10,10,14,0.70) 75%, rgba(10,10,14,0.95) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 55%, rgba(10,10,14,0.50) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,14,0.90) 0%, rgba(10,10,14,0.40) 30%, transparent 60%)",
        }}
      />

      {/* المحتوى */}
      <motion.div
        className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.25] tracking-[-0.01em]"
          style={{
            textShadow:
              "0 2px 30px rgba(0,0,0,0.7), 0 1px 8px rgba(0,0,0,0.5)",
          }}
        >
          <TextType
            text={[title]}
            typingSpeed={60}
            pauseDuration={2000}
            loop={false}
            showCursor
            cursorCharacter="|"
            cursorClassName="text-tedx-red"
            cursorBlinkDuration={0.6}
            hideCursorWhileTyping={false}
            initialDelay={300}
          />
        </h1>

        {/* الفاصل الأحمر */}
        <motion.div
          className="w-20 h-[2px] mx-auto mt-6 mb-6"
          style={{
            background:
              "linear-gradient(90deg, transparent, #e62b1e, transparent)",
          }}
          initial={shouldReduceMotion ? {} : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />

        {body && (
          <motion.p
            className="text-base sm:text-lg text-white/60 leading-[1.85] max-w-2xl mx-auto font-light"
            style={{
              textShadow: "0 1px 12px rgba(0,0,0,0.6)",
            }}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {body}
          </motion.p>
        )}
      </motion.div>

      {/* شريط TEDx سفلي */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] z-10">
        <div
          className="h-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #e62b1e, #ff4d3f, #e62b1e, transparent)",
          }}
        />
      </div>

      <ScrollIndicator />
    </section>
  );
});

export default ApplyHero;