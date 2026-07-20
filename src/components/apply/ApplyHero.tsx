"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ApplyHeroProps {
  title: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  imageAlt?: string;
}

function ScrollIndicator() {
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
        Scroll
      </span>
      <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      <ChevronDown size={14} className="text-white/30" />
    </motion.div>
  );
}

export default function ApplyHero({
  title,
  subtitle,
  body,
  imageUrl = "/images/youth-speaker.jpg",
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
      className="relative min-h-[85vh] overflow-hidden flex items-end pb-20"
    >
      {/* ── الصورة كخلفية مع بارالكس ── */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imageY, scale: imageScale }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          طبقات التدرج — لقراءة النص بوضوح
          ═══════════════════════════════════════════════════════════════ */}

      {/* طبقة 1: تدرج علوي — يخفف من ألوان الصورة في الأعلى */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,14,0.55) 0%, rgba(10,10,14,0.20) 25%, rgba(10,10,14,0.10) 40%, rgba(10,10,14,0.30) 55%, rgba(10,10,14,0.70) 75%, rgba(10,10,14,0.95) 100%)",
        }}
      />

      {/* طبقة 2: تدرج جانبي — يحيط بالنص من اليمين واليسار */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 55%, rgba(10,10,14,0.50) 0%, transparent 70%)",
        }}
      />

      {/* طبقة 3: تدرج سفلي — يضمن وضوح النص في الأسفل */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,14,0.90) 0%, rgba(10,10,14,0.40) 30%, transparent 60%)",
        }}
      />

      {/* ── المحتوى ── */}
      <motion.div
        className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        {/* العنوان الرئيسي — مع ظل إضافي للقراءة */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.25] tracking-[-0.01em]"
          style={{
            textShadow: "0 2px 30px rgba(0,0,0,0.7), 0 1px 8px rgba(0,0,0,0.5)",
          }}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h1>

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

        {/* النص الداعم — مع ظل للقراءة */}
        {body && (
          <motion.p
            className="text-base sm:text-lg text-white/60 leading-[1.85] max-w-2xl mx-auto font-light"
            style={{
              textShadow: "0 1px 12px rgba(0,0,0,0.6)",
            }}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {body}
          </motion.p>
        )}
      </motion.div>

      {/* ── شريط TEDx سفلي ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] z-10">
        <div
          className="h-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #e62b1e, #ff4d3f, #e62b1e, transparent)",
          }}
        />
      </div>

      {/* ── سهم التمرير ── */}
      <ScrollIndicator />
    </section>
  );
}