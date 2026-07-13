"use client";

import { AnimatePresence, motion } from "framer-motion";

interface FlipDigitProps {
  value: number;
}

export default function FlipDigit({ value }: FlipDigitProps) {
  const display = String(value).padStart(2, "0");

  return (
    <div
      className="relative w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded bg-tedx-white/10 border border-tedx-white/30"
      style={{ perspective: 400 }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={display}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl font-bold text-tedx-white tabular-nums"
          style={{ transformStyle: "preserve-3d" }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
