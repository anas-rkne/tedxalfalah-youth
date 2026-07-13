"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left";
}

export default function FadeInView({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: FadeInViewProps) {
  const xOffset = direction === "left" ? -20 : 0;
  const yOffset = direction === "up" ? 30 : 0;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: xOffset, y: yOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
