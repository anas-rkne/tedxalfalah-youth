"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ScrollIndicatorProps {
  text: string;
}

export default function ScrollIndicator({ text }: ScrollIndicatorProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);

  return (
    <motion.div
      className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-center text-sm font-medium text-white/70"
      style={{ opacity }}
    >
      <ChevronDown className="h-6 w-6 animate-bounce" />
      <span>{text}</span>
    </motion.div>
  );
}
