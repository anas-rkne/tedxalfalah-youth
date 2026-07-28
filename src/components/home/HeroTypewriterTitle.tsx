"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "next-intl";

interface HeroTypewriterTitleProps {
  title: string;
}

export default function HeroTypewriterTitle({ title }: HeroTypewriterTitleProps) {
  const shouldReduceMotion = useReducedMotion();
  const locale = useLocale();

  const fontClass = locale === "ar" ? "font-arabic" : "font-sans";

  // تحسين العرض عبر استخدام whitespace-nowrap مع أحجام خطوط متوازنة
  const headingClass = `text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] xl:text-[5.5rem] font-bold tracking-tight leading-[1.1] whitespace-nowrap lg:whitespace-normal ${fontClass} text-black dark:text-white`;

  const words = useMemo(() => title.split(" "), [title]);

  const content = (
    <h1 className={`${headingClass} flex flex-wrap lg:flex-nowrap justify-center items-center gap-x-2 md:gap-x-3 w-full`}>
      {words.map((word, index) => {
        const isNow = word.replace(/[.,!?;]$/, '') === "Now";
        return (
          <span key={index} className={`inline-block ${isNow ? "text-[#e62b1e]" : ""}`}>
            {word}
          </span>
        );
      })}
    </h1>
  );

  if (shouldReduceMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {content}
    </motion.div>
  );
}