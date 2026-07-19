"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { 
  Lightbulb, Star, Rocket, Sparkles, Zap, 
  Heart, Globe, Compass, Smile, BrainCircuit, Target, Gem 
} from "lucide-react";

// 1. الرسومات الأساسية (مع تنويع الحجم والشفافية لخلق عمق)
const doodles = [
  // مجموعة قريبة (واضحة وكبيرة)
  { Icon: Rocket, size: 56, top: 55, left: 10, rotation: -20, color: "text-red-500/50", duration: 12 },
  { Icon: Lightbulb, size: 48, top: 8, left: 80, rotation: 25, color: "text-red-500/45", duration: 14 },
  { Icon: Globe, size: 50, top: 30, left: 85, rotation: -15, color: "text-orange-400/45", duration: 18 },
  { Icon: Smile, size: 52, top: 82, left: 70, rotation: 15, color: "text-orange-400/50", duration: 10 },
  
  // مجموعة بعيدة (صغيرة وباهتة، تتحرك أسرع قليلاً لتعطي إحساسًا بالبعد)
  { Icon: Star, size: 28, top: 75, left: 88, rotation: 30, color: "text-orange-400/25", duration: 8 },
  { Icon: Sparkles, size: 30, top: 20, left: 15, rotation: 60, color: "text-red-500/20", duration: 9 },
  { Icon: Zap, size: 22, top: 90, left: 5, rotation: -40, color: "text-red-500/20", duration: 7 },
  { Icon: Heart, size: 26, top: 40, left: 10, rotation: 80, color: "text-red-500/25", duration: 11 },
  { Icon: Compass, size: 32, top: 65, left: 92, rotation: -10, color: "text-red-500/20", duration: 8 },
  { Icon: BrainCircuit, size: 24, top: 15, left: 50, rotation: 20, color: "text-red-500/20", duration: 6 },
  { Icon: Target, size: 30, top: 50, left: 25, rotation: 40, color: "text-orange-400/25", duration: 9 },
  { Icon: Gem, size: 22, top: 95, left: 45, rotation: -50, color: "text-red-500/20", duration: 12 },
];

// 2. نجوم متلألئة إضافية (تضيف سحراً)
const STARS = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  size: 2 + Math.random() * 4,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 2 + Math.random() * 4,
  delay: Math.random() * 5,
}));

export default function HeroBackgroundEffects() {
  const shouldReduceMotion = useReducedMotion();

  // تتبع الماوس للتوهج
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x * 20);
      mouseY.set(y * 20);
    },
    [mouseX, mouseY]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // 3. تحسين الأداء: تثبيت القوائم باستخدام useMemo
  const memoizedDoodles = useMemo(() => doodles, []);
  const memoizedStars = useMemo(() => STARS, []);

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-red-200/20 via-orange-100/20 to-yellow-100/10" />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 h-full w-full bg-gradient-to-br from-red-100/20 via-orange-100/15 to-yellow-100/10" aria-hidden="true">

    </div>
  );
}