"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function ScrollIndicator() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute bottom-2 left-0 right-0 flex items-center justify-center z-20 cursor-pointer"
      style={{ opacity }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
    >
      {/* حاوية السهم الواحد */}
      <div className="relative h-8 w-8 flex items-center justify-center">
        <motion.div
          className="text-red-600 drop-shadow-md"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: [0, -8, 0], // يصعد وينزل ببساطة
                  opacity: [0.8, 1, 0.8],
                }
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ChevronDown className="h-8 w-8 stroke-[3]" />
        </motion.div>
      </div>
    </motion.div>
  );
}