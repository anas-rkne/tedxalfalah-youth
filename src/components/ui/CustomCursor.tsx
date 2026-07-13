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

  useEffect(() => {
    // يُعطَّل تلقائياً على أجهزة اللمس (لا معنى لمؤشر ماوس هناك) وعند
    // تفعيل "تقليل الحركة" بالنظام لإمكانية الوصول.
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isTouchDevice || prefersReducedMotion) return;
    // Intentional: single non-cascading state update once we know this is
    // a real mouse-driven device (checked via browser-only matchMedia API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);

    function handleMouseMove(e: MouseEvent) {
      cursorX.set(e.clientX - 15);
      cursorY.set(e.clientY - 15);
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
    <motion.div
      aria-hidden="true"
      className="fixed top-0 start-0 z-[9999] rounded-full pointer-events-none border-2 border-tedx-white/60"
      style={{
        x: springX,
        y: springY,
      }}
      animate={{
        width: isHoveringInteractive ? 50 : 30,
        height: isHoveringInteractive ? 50 : 30,
        backgroundColor: isHoveringInteractive
          ? "rgba(248, 113, 113, 0.6)"
          : "rgba(255, 255, 255, 0.5)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    />
  );
}
