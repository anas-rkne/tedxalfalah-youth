"use client";

import { useRef, ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface ScrollSectionProps {
  children: ReactNode;
  className?: string;
  variant?: "hero" | "default" | "stagger" | "grid" | "scale";
  id?: string;
}

const easeOut = [0.23, 1, 0.32, 1] as const;

const variants = {
  hero: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, ease: easeOut },
    },
  },
  default: {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: easeOut },
    },
  },
  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  },
  grid: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: easeOut },
    },
  },
};

export default function ScrollSection({
  children,
  className = "",
  variant = "default",
  id,
}: ScrollSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.6, 1, 1, 0.6]);

  if (shouldReduceMotion) {
    return (
      <section
        id={id}
        className={`snap-start flex items-center justify-center relative overflow-visible ${
          variant === "hero" ? "z-20" : "z-10"
        } ${className}`}
      >
        <div className="w-full">{children}</div>
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      ref={ref}
      className={`snap-start flex items-center justify-center relative overflow-visible ${
        variant === "hero" ? "z-20" : "z-10"
      } ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants[variant]}
      style={variant === "hero" ? { y, opacity } : undefined}
    >
      <div className="w-full">{children}</div>
    </motion.section>
  );
}