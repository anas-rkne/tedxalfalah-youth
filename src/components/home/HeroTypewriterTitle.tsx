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
  const headingClass = `text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-6xl font-bold tracking-tight leading-tight ${fontClass} text-black dark:text-white`;

  // تقسيم الكلمات مرة واحدة فقط
  const words = useMemo(() => title.split(" "), [title]);

  const content = (
    <h1 className={`${headingClass} flex flex-wrap justify-center items-center gap-x-2 md:gap-x-3`}>
      {words.map((word, index) => (
        <span key={index} className="inline-block">
          {word}
        </span>
      ))}
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