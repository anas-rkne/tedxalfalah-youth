"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSocialIconProps {
  href: string;
  ariaLabel: string;
  children: ReactNode;
}

export default function AnimatedSocialIcon({
  href,
  ariaLabel,
  children,
}: AnimatedSocialIconProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.a
      href={href}
      aria-label={ariaLabel}
      className="block hover:text-red-600"
      whileHover={shouldReduceMotion ? {} : { scale: 1.2, rotate: 5 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.a>
  );
}
