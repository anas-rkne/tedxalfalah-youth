"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export default function WelcomeConfetti() {
  const [show, setShow] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // نعرض القصاصات مرة واحدة فقط لكل جلسة متصفح، وليس بكل تحديث للصفحة
    const alreadyShown = sessionStorage.getItem("tedx-welcome-confetti-shown");
    if (prefersReducedMotion || alreadyShown) return;

    // Intentional: one-time setup once we confirm (via browser-only APIs)
    // this is a fresh session that should see the welcome confetti.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    sessionStorage.setItem("tedx-welcome-confetti-shown", "true");

    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      numberOfPieces={150}
      recycle={false}
      gravity={0.15}
      colors={["#E62B1E", "#3B82F6", "#FACC15", "#22C55E", "#FFFFFF"]}
      className="!fixed !inset-0 !z-[9998] pointer-events-none"
    />
  );
}
