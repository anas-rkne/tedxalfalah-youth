"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "next-intl"; // استيراد للكشف عن اللغة الحالية

interface HeroTypewriterTitleProps {
  title: string;
}

export default function HeroTypewriterTitle({ title }: HeroTypewriterTitleProps) {
  const shouldReduceMotion = useReducedMotion();
  const locale = useLocale(); // معرفة اللغة الحالية

  // اختيار الخط المناسب بناءً على اللغة
  const fontClass = locale === "ar" ? "font-arabic" : "font-sans";

  // ✅ التعديل هنا:
  // - text-3xl (جوال صغير)
  // - sm:text-4xl, md:text-5xl (تابلت)
  // - lg:text-6xl, xl:text-7xl (شاشات كبيرة)
  // - md:whitespace-nowrap (يبقى في سطر واحد في الشاشات الأكبر من الهاتف فقط)
const headingClass = `text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl font-bold ${fontClass} text-black dark:text-white text-balance leading-snug`; if (shouldReduceMotion) {
    return (
      <h1 className={headingClass}>
        {title}
      </h1>
    );
  }

  return (
    <motion.h1
      className={headingClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {title}
    </motion.h1>
  );
}