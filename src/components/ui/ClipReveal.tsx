"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ClipRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "left" | "right";
}

export default function ClipReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  direction = "left",
}: ClipRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const clipFrom = direction === "left" ? "inset(0 100% 0 0)" : "inset(0 0% 0 100%)";
  const clipTo = "inset(0 0% 0 0)";

  return (
    <motion.div
      className={className}
      initial={{ clipPath: clipFrom }}
      whileInView={{ clipPath: clipTo }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}
