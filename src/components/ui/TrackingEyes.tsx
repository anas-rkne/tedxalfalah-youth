"use client";

import { useEffect, useRef, useState, useId } from "react";
import { motion } from "framer-motion";

// ----------------------------------------------------------------------
// Eye Component (قابلة لإعادة الاستخدام للعين اليمنى واليسرى)
// ----------------------------------------------------------------------
interface EyeProps {
  cx: number;
  cy: number;
  r: number;
  pupilOffset: { x: number; y: number };
  uniqueId: string; // نستقبل معرفاً فريداً من الأب
  side: "left" | "right"; // لتوليد معرفات فريدة لكل عين
}

function Eye({ cx, cy, r, pupilOffset, uniqueId, side }: EyeProps) {
  // نستخدم معرف الأب مع إضافة جانب العين ليكون فريداً لكل عين
  const uid = `${uniqueId}-${side}`;

  return (
    <g>
      <defs>
        <clipPath id={`eye-clip-${uid}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>

        {/* بياض العين بتدرج خفيف للعمق */}
        <radialGradient
          id={`sclera-grad-${uid}`}
          cx="50%"
          cy="45%"
          r="55%"
          fx="50%"
          fy="40%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f5f0f0" />
          <stop offset="100%" stopColor="#e8dede" />
        </radialGradient>

        {/* قزحية حمراء بتدرج واقعي */}
        <radialGradient
          id={`iris-grad-${uid}`}
          cx="45%"
          cy="40%"
          r="55%"
          fx="40%"
          fy="35%"
        >
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="30%" stopColor="#e63946" />
          <stop offset="70%" stopColor="#b71c1c" />
          <stop offset="100%" stopColor="#7f0000" />
        </radialGradient>

        {/* ظل خارجي ناعم */}
        <filter id={`eye-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* الصلبة (بياض العين) مع ظل */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#sclera-grad-${uid})`}
        stroke="#c0b0b0"
        strokeWidth={1}
        filter={`url(#eye-shadow-${uid})`}
      />

      {/* الأجزاء المتحركة (قزحية + بؤبؤ + لمعان) مقصوصة داخل العين */}
      <motion.g
        clipPath={`url(#eye-clip-${uid})`}
        animate={{
          x: pupilOffset.x,
          y: pupilOffset.y,
        }}
        transition={{
          type: "spring",
          stiffness: 1200,
          damping: 12,
          mass: 0.1,
        }}
      >
        {/* قزحية حمراء */}
        <circle cx={cx} cy={cy} r={r * 0.75} fill={`url(#iris-grad-${uid})`} />

        {/* بؤبؤ أسود */}
        <circle cx={cx} cy={cy} r={r * 0.45} fill="#0f0a0a" />

        {/* لمعان أساسي كبير */}
        <circle
          cx={cx - r * 0.22}
          cy={cy - r * 0.28}
          r={r * 0.16}
          fill="white"
          fillOpacity={0.95}
        />
        {/* لمعان ثانوي صغير */}
        <circle
          cx={cx + r * 0.08}
          cy={cy + r * 0.1}
          r={r * 0.06}
          fill="white"
          fillOpacity={0.85}
        />
        {/* بريق دقيق */}
        <circle
          cx={cx - r * 0.35}
          cy={cy - r * 0.38}
          r={r * 0.045}
          fill="white"
        />
      </motion.g>

      {/* خط داخلي رفيع للعمق */}
      <circle
        cx={cx}
        cy={cy}
        r={r - 1}
        fill="none"
        stroke="#0000000e"
        strokeWidth={0.8}
      />
    </g>
  );
}

// ----------------------------------------------------------------------
// المكون الرئيسي TrackingEyes
// ----------------------------------------------------------------------
interface TrackingEyesProps {
  size?: number; // العرض الكلي لحاوية العينين (افتراضي 50px للحجم الصغير)
  className?: string;
}

export default function TrackingEyes({ size = 50, className = "" }: TrackingEyesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const uniqueId = useId(); // ✅ توليد معرف فريد ومستقر بين الخادم والعميل

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const maxMovement = 6; // مسافة قصوى أصغر تناسب الحجم المصغر
      const normalizedX = ((event.clientX / window.innerWidth) - 0.5) * 2;
      const normalizedY = ((event.clientY / window.innerHeight) - 0.5) * 2;

      setMousePos({
        x: normalizedX * maxMovement,
        y: normalizedY * maxMovement,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // أبعاد ديناميكية
  const svgWidth = size * 2.2;
  const svgHeight = size;
  const eyeRadius = size * 0.42; // أصغر بقليل ليناسب الحجم
  const leftCenterX = size * 0.55;
  const rightCenterX = size * 1.65;
  const centerY = size * 0.5;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: svgWidth, height: svgHeight }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
      >
        {/* العين اليسرى */}
        <Eye
          cx={leftCenterX}
          cy={centerY}
          r={eyeRadius}
          pupilOffset={mousePos}
          uniqueId={uniqueId}
          side="left"
        />
        {/* العين اليمنى */}
        <Eye
          cx={rightCenterX}
          cy={centerY}
          r={eyeRadius}
          pupilOffset={mousePos}
          uniqueId={uniqueId}
          side="right"
        />
      </svg>
    </div>
  );
}