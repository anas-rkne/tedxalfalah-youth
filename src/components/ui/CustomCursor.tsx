"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 300 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  const dotX = useSpring(cursorX, { damping: 35, stiffness: 150 });
  const dotY = useSpring(cursorY, { damping: 35, stiffness: 150 });

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isTouchDevice || prefersReducedMotion) return;
    setEnabled(true);

    function handleMouseMove(e: MouseEvent) {
      cursorX.set(e.clientX - 6);
      cursorY.set(e.clientY - 6);
      setIsVisible(true);
    }

    function handlePointerOver(e: PointerEvent) {
      const target = e.target as HTMLElement;
      setIsHoveringInteractive(
        Boolean(target.closest("button, a, [role='button'], input, select"))
      );
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("pointerover", handlePointerOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("pointerover", handlePointerOver);
    };
  }, [cursorX, cursorY]);

  if (!enabled || !isVisible) return null;

  return (
    <>
      {/* Trailing dot */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 start-0 z-[9998] rounded-full pointer-events-none bg-tedx-red/30"
        style={{
          x: dotX,
          y: dotY,
          width: 8,
          height: 8,
        }}
      />
      {/* Main cursor */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 start-0 z-[9999] rounded-full pointer-events-none border-2"
        style={{
          x: springX,
          y: springY,
          borderColor: isHoveringInteractive
            ? "rgba(230, 43, 30, 0.6)"
            : "rgba(230, 43, 30, 0.4)",
        }}
        animate={{
          width: isHoveringInteractive ? 40 : 12,
          height: isHoveringInteractive ? 40 : 12,
          backgroundColor: isHoveringInteractive
            ? "rgba(230, 43, 30, 0.15)"
            : "transparent",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </>
  );
}
