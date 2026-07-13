"use client";

import { motion } from "framer-motion";
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
  return (
    <motion.a
      href={href}
      aria-label={ariaLabel}
      className="block hover:text-tedx-red"
      whileHover={{ scale: 1.2, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.a>
  );
}
