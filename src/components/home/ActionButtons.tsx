"use client";

import { useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Link } from "@/i18n/navigation";

interface ActionButtonsProps {
  applyLabel: string;
  ticketsLabel: string;
}

function LiquidButton({
  href,
  children,
  variant,
}: {
  href: string;
  children: React.ReactNode;
  variant: "primary" | "outline";
}) {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(mouseX, { damping: 20, stiffness: 300 });
  const glowY = useSpring(mouseY, { damping: 20, stiffness: 300 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const baseClasses =
    variant === "primary"
      ? "bg-tedx-red text-tedx-white border border-tedx-red"
      : "!text-tedx-white !border-tedx-white bg-transparent";

  return (
    <motion.div
      className="relative"
      // نبض دوري كل 3 ثوانٍ لجذب انتباه الطفل، حتى بدون تفاعل
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        animate={{
          borderRadius: isHovered
            ? ["8px", "20px 8px 20px 8px", "8px 20px 8px 20px", "8px"]
            : "8px",
          scale: isHovered ? 1.03 : 1,
        }}
        transition={{
          borderRadius: { duration: 1.2, repeat: isHovered ? Infinity : 0 },
          scale: { duration: 0.2 },
        }}
        className="relative overflow-hidden"
      >
        {/* دائرة Glow تتبع الماوس فوق الزر */}
        {isHovered && (
          <motion.div
            className="pointer-events-none absolute w-24 h-24 rounded-full bg-tedx-white/30 blur-xl"
            style={{
              left: glowX,
              top: glowY,
              translateX: "-50%",
              translateY: "-50%",
            }}
          />
        )}

        <Link
          href={href}
          className={`relative z-10 inline-flex items-center justify-center px-8 py-4 text-lg font-semibold uppercase tracking-wide transition-colors duration-200 ${baseClasses}`}
        >
          {children}
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function ActionButtons({
  applyLabel,
  ticketsLabel,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-4">
      <LiquidButton href="/apply" variant="primary">
        {applyLabel}
      </LiquidButton>
      <LiquidButton href="/tickets" variant="outline">
        {ticketsLabel}
      </LiquidButton>
    </div>
  );
}
