"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface FlipDigitProps {
  value: number;
}

export default function FlipDigit({ value }: FlipDigitProps) {
  const shouldReduceMotion = useReducedMotion();
  const display = String(value).padStart(2, "0");

  if (shouldReduceMotion) {
    return (
      <div className="relative w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded bg-white/10 border border-white/30">
        <span className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl font-bold text-white tabular-nums">
          {display}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded bg-white/10 border border-white/30"
      style={{ perspective: 400 }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={display}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl font-bold text-white tabular-nums"
          style={{ transformStyle: "preserve-3d" }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
