"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "next-intl";

interface HeroTypewriterTitleProps {
  title: string;
}

export default function HeroTypewriterTitle({ title }: HeroTypewriterTitleProps) {
  const shouldReduceMotion = useReducedMotion();
  const locale = useLocale();

  const fontClass = locale === "ar" ? "font-arabic" : "font-sans";

  const headingClass = `w-full max-w-5xl mx-auto text-center text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-bold tracking-tight leading-[1.1] text-balance ${fontClass} text-black dark:text-white`;

  const content = <h1 className={headingClass}>{title}</h1>;

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
