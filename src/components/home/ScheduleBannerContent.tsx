"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ArrowRight } from "lucide-react";
import { memo } from "react";
import { Link } from "@/i18n/navigation";
import { useRTL } from "@/hooks/useRTL";

interface ScheduleBannerContentProps {
  badgeLabel: string;
  title: string;
  description: string;
  ctaLabel: string;
}

const SectionBadge = memo(function SectionBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tedx-red/10 border border-tedx-red/20 text-tedx-red text-xs font-bold uppercase tracking-[0.2em]">
      <span className="w-1.5 h-1.5 rounded-full bg-tedx-red animate-pulse" />
      {children}
    </span>
  );
});

export default function ScheduleBannerContent({
  badgeLabel,
  title,
  description,
  ctaLabel,
}: ScheduleBannerContentProps) {
  const { isRTL } = useRTL();
  const shouldReduceMotion = useReducedMotion();

  const motionProps = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

  return (
    <section
      className="relative w-full overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ═══════════════════════════════════════════
         خلفية TEDx — تمتد عرض الصفحة بالكامل
         ═══════════════════════════════════════════ */}
      <div className="relative section-padding">
        {/* 1. خلفية داكنة */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-zinc-950" />

        {/* 2. شبكة حمراء */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(230,43,30,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(230,43,30,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* 3. نقاط حمراء متناثرة */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(230,43,30,0.5) 1.5px, transparent 1.5px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* 4. دوائر حمراء زخرفية */}
        <div className="absolute top-[10%] left-[5%] w-[250px] h-[250px] rounded-full bg-tedx-red/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[5%] w-[250px] h-[250px] rounded-full bg-tedx-red/8 blur-[100px] pointer-events-none" />
        <div className="absolute top-[30%] right-[15%] w-[100px] h-[100px] rounded-full bg-tedx-red/5 blur-[40px] pointer-events-none" />
        <div className="absolute bottom-[25%] left-[10%] w-[150px] h-[150px] rounded-full bg-tedx-red/5 blur-[60px] pointer-events-none" />

        {/* 5. مربعات حمراء صغيرة */}
        <div className="absolute top-[20%] right-[25%] w-3 h-3 bg-tedx-red/15 rotate-45 pointer-events-none" />
        <div className="absolute bottom-[30%] left-[20%] w-2 h-2 bg-tedx-red/20 rotate-12 pointer-events-none" />
        <div className="absolute top-[50%] left-[8%] w-4 h-4 bg-tedx-red/10 rotate-[25deg] pointer-events-none" />
        <div className="absolute bottom-[40%] right-[12%] w-3 h-3 bg-tedx-red/12 rotate-[-10deg] pointer-events-none" />

        {/* 6. خطوط مائلة حمراء خفيفة */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 60px,
                rgba(230,43,30,0.3) 60px,
                rgba(230,43,30,0.3) 61px
              )
            `,
          }}
        />

        {/* 7. خط علوي TEDx */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tedx-red/30 to-transparent" />

        {/* 8. خط سفلي TEDx */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tedx-red/20 to-transparent" />

        {/* ═══════════════════════════════════════════
           المحتوى — في المنتصف فقط
           ═══════════════════════════════════════════ */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          {/* البادج */}
          <motion.div {...motionProps} transition={{ duration: 0.5 }}>
            <div className="flex justify-center mb-6">
              <SectionBadge>{badgeLabel}</SectionBadge>
            </div>
          </motion.div>

          {/* العنوان */}
          <motion.h2
            {...motionProps}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1] mb-5"
          >
            {title}
          </motion.h2>

          {/* الوصف */}
          <motion.p
            {...motionProps}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-300 text-base md:text-lg font-light max-w-xl mx-auto leading-relaxed mb-10"
          >
            {description}
          </motion.p>

          {/* الزر الحديث */}
          <motion.div
            {...motionProps}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/schedule"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-tedx-red text-white font-bold rounded-2xl
                overflow-hidden transition-all duration-300
                shadow-[0_8px_32px_-8px_rgba(230,43,30,0.5)]
                hover:shadow-[0_16px_48px_-12px_rgba(230,43,30,0.6)]
                hover:scale-[1.03] active:scale-[0.97]"
            >
              {/* تأثير shine */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <CalendarDays className="relative z-10 w-5 h-5" />
              <span className="relative z-10">{ctaLabel}</span>
              <ArrowRight
                className={`relative z-10 w-4 h-4 transition-transform duration-300 ${
                  isRTL
                    ? "rotate-180 group-hover:-translate-x-1"
                    : "group-hover:translate-x-1"
                }`}
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}