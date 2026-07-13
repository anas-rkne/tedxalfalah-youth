"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate, useReducedMotion } from "framer-motion";

interface Stat {
  label: string;
  targetValue: number;
  suffix: string;
}

interface AnimatedStatsProps {
  stats: Stat[];
}

function AnimatedNumber({ targetValue, inView, reduceMotion }: { targetValue: number; inView: boolean; reduceMotion: boolean }) {
  const [displayValue, setDisplayValue] = useState(reduceMotion ? targetValue : 0);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const controls = animate(0, targetValue, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (value) => setDisplayValue(Math.round(value)),
    });

    return () => controls.stop();
  }, [inView, targetValue, reduceMotion]);

  return (
    <span className="inline-block tabular-nums">
      {displayValue}
    </span>
  );
}

export default function AnimatedStats({ stats }: AnimatedStatsProps) {
  const shouldReduceMotion = useReducedMotion();
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
            <AnimatedNumber targetValue={stat.targetValue} inView={isInView} reduceMotion={!!shouldReduceMotion} />
            {stat.suffix}
          </span>
          <span className="text-sm text-tedx-white/70">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
