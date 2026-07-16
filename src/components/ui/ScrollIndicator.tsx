"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ScrollIndicatorProps {
  text?: string;
}

export default function ScrollIndicator({ text }: ScrollIndicatorProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute bottom-10 left-0 right-0 flex flex-col items-center z-20 cursor-pointer"
      style={{ opacity }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
    >
      {/* حاوية لحجم 32px */}
      <div className="relative h-8 w-8">
        
        {/* 1. السهم العلوي (يتحرك للأعلى قليلاً) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-red-400/30"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  opacity: [0.3, 1, 0.3],
                  y: [0, -10, 0],
                }
          }
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ChevronDown className="h-8 w-8 stroke-[3]" />
        </motion.div>

        {/* 2. السهم السفلي (يتحرك للأسفل قليلاً) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-red-600 drop-shadow-md"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  opacity: [1, 0.3, 1],
                  y: [0, 4, 0],
                }
          }
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        >
          <ChevronDown className="h-8 w-8 stroke-[3]" />
        </motion.div>

      </div>

      {/* النص الاختياري */}
      {text && (
        <motion.span
          className="text-[10px] md:text-xs font-semibold tracking-widest uppercase text-red-600/70 mt-3"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  opacity: [0.7, 0.3, 0.7],
                }
          }
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        >
          {text}
        </motion.span>
      )}
    </motion.div>
  );
}