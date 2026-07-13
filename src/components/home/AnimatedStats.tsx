"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion, AnimatePresence, animate } from "framer-motion";

interface Stat {
  label: string;
  targetValue: number;
  suffix: string;
}

interface AnimatedStatsProps {
  stats: Stat[];
}

function AnimatedNumber({ targetValue, inView }: { targetValue: number; inView: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const controls = animate(0, targetValue, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (value) => setDisplayValue(Math.round(value)),
    });

    return () => controls.stop();
  }, [inView, targetValue]);

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={displayValue}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="inline-block tabular-nums"
      >
        {displayValue}
      </motion.span>
    </AnimatePresence>
  );
}

export default function AnimatedStats({ stats }: AnimatedStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className="p-8 bg-tedx-black text-tedx-white rounded-lg flex flex-col justify-center gap-4"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            <AnimatedNumber targetValue={stat.targetValue} inView={isInView} />
            {stat.suffix}
          </span>
          <span className="text-sm text-tedx-white/70">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
