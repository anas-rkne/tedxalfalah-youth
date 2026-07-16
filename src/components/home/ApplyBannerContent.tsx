"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";

interface ApplyBannerContentProps {
  text: string;
  cta: string;
}

export default function ApplyBannerContent({ text, cta }: ApplyBannerContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // حركة بارالاكس بسيطة للخلفية المضيئة (اختياري)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center bg-black pt-20 pb-0 overflow-hidden"
    >
      {/* 1. الأشكال الضبابية الدوارة في الخلفية (محاكاة التصميم) */}
      {/* التوهج الأيسر */}
      <motion.div
        className="absolute left-[-15%] top-[10%] w-[600px] h-[600px] rounded-full bg-red-700/30 blur-[120px] pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      {/* التوهج الأيمن */}
      <motion.div
        className="absolute right-[-15%] bottom-[10%] w-[700px] h-[700px] rounded-full bg-red-600/20 blur-[120px] pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      {/* طبقة بارالاكس خفيفة للخلفية */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      />

      {/* 2. المحتوى الرئيسي */}
      <div className="relative z-10 w-full max-w-5xl px-4 md:px-8 flex flex-col items-center text-center gap-6 md:gap-8">
        
        {/* الشارة العلوية (Badge) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-800/50 bg-red-900/20 text-red-400 text-xs md:text-sm font-medium backdrop-blur-sm">
          <Sparkles className="w-3 h-3" />
          <span>شارك صوتك اليوم</span>
        </div>

        {/* العنوان الرئيسي الكبير */}
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
          {text}
        </h2>

        {/* النص الفرعي */}
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
          انضم إلينا لتكون جزءاً من التغيير. أفكارك يمكن أن تلهم المئات.
        </p>

        {/* زر CTA بحواف دائرية وتوهج (بدلاً من Neubrutalism الحاد) */}
        <Link
          href="/apply"
          className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-4 text-white text-lg font-semibold shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:bg-red-700 hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-105 active:scale-95"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}