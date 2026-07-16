"use client";

import { motion, useScroll } from "framer-motion";

export default function ReadingProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] origin-left"
      style={{
        background: "linear-gradient(90deg, #e62b1e, #ff6b5e)",
        scaleX: scrollYProgress,
      }}
    />
  );
}
