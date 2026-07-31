"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 right-0 bottom-0 w-1 bg-white/5 z-50 hidden md:block">
      <motion.div
        className="absolute top-0 left-0 right-0 bg-tedx-red origin-top box-glow"
        style={{ scaleY, bottom: 0 }}
      />
    </div>
  );
}
