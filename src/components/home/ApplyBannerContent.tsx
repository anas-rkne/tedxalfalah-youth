"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton"; 

interface ApplyBannerContentProps {
  text: string;
  cta: string;
}

export default function ApplyBannerContent({ text, cta }: ApplyBannerContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center bg-white pt-24 pb-16 overflow-hidden"
    >
      {/* ✅ تمت إزالة الخلفية الحمراء تماماً، القسم الآن أبيض نقي 100% */}

      <div className="relative z-10 w-full max-w-5xl px-4 md:px-8 flex flex-col items-center text-center gap-6 md:gap-8">
        
        {/* 1. الشارة العلوية (Badge) */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 text-xs md:text-sm font-medium"
        >
          <Sparkles className="w-3 h-3" />
          <span>شارك صوتك اليوم</span>
        </motion.div>

        {/* ✅ 2. العنوان الرئيسي (تطبيق ظهور الكلمات بشكل متتابع، تماماً مثل قسم Theme) */}
        {/* ✅ 2. العنوان الرئيسي (تم ضبط المسافات بشكل مثالي) */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-x-1 md:gap-x-1 gap-y-2 md:gap-y-4 max-w-4xl mx-auto"
        >
          {text.split(" ").map((word, index) => (
            <motion.span
              key={index}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.08,
                ease: [0.23, 1, 0.32, 1], 
              }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight leading-[1.2] inline-block"
            >
              {word}
              {index !== text.split(" ").length - 1 && <>&nbsp;</>}
            </motion.span>
          ))}
        </motion.div>

        {/* 3. النص الفرعي الإماراتي */}
        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
className="text-gray-500 mt-6 text-lg font-light max-w-2xl mx-auto leading-relaxed"        >
          هالفرصة بين يديك! صوتك وفكرتك يقدرون يصنعون أثر حقيقي. سجل وانضم لنا، ونبي نشوف شو عندك!
        </motion.p>

        {/* 4. الزر الأحمر */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-2"
        >
          <AnimatedSlidingButton 
            href="/apply" 
            variant="primary"
          >
            {cta}
          </AnimatedSlidingButton>
        </motion.div>

      </div>
    </section>
  );
}