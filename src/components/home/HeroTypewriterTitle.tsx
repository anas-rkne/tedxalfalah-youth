"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { TypeAnimation } from "react-type-animation";

interface HeroTypewriterTitleProps {
  title: string;
}

export default function HeroTypewriterTitle({ title }: HeroTypewriterTitleProps) {
  const shouldReduceMotion = useReducedMotion();

  // --- تفاعل 3D Tilt مع زاوية أكبر ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // ربيع أكثر حساسية وسلاسة
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  // زاوية إمالة أكبر: ±10 درجات
  const rotateX = useTransform(smoothY, [-1, 1], [10, -10]);
  const rotateY = useTransform(smoothX, [-1, 1], [-10, 10]);

  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      // حساب الموضع النسبي ضمن العنصر
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handlePointerLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [mouseX, mouseY]);

  const sequence = useMemo(() => [title, 3000], [title]);

  if (shouldReduceMotion) {
    return (
      <h1 className="text-6xl md:text-8xl font-sans font-bold tracking-tight bg-gradient-to-r from-red-600 via-red-500 to-orange-400 bg-clip-text text-transparent drop-shadow-md">
        {title}
      </h1>
    );
  }

  return (
    <motion.h1
      ref={ref}
      className="text-6xl md:text-8xl font-sans font-bold tracking-tight bg-gradient-to-r from-red-600 via-red-500 to-orange-400 bg-clip-text text-transparent drop-shadow-xl"
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
    >
      <TypeAnimation
        sequence={sequence}
        wrapper="span" // تغيير الغلاف إلى span ليكون داخل h1
        speed={{ type: "keyStrokeDelayInMs", value: 80 }}
        cursor={true}
        repeat={1}
        className="inline-block"
      />
    </motion.h1>
  );
}