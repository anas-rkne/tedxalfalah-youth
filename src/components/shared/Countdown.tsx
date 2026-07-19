"use client";

import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import FlipClock from "@/components/ui/flip-clock";

interface CountdownProps {
  targetDate: string; // ISO date string
}

function useScreenSize() {
  const [size, setSize] = useState<"sm" | "md" | "lg" | "xl">("lg");

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      if (w < 500) setSize("sm");
      else if (w < 768) setSize("md");
      else if (w < 1024) setSize("lg");
      else setSize("xl");
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("countdown");
  
  const screenSize = useScreenSize();

  const orderedLabels = [
    t("seconds"),
    t("minutes"),
    t("hours"),
    t("days"),
  ];

  return (
    <div className="flex flex-col items-center gap-2 md:gap-4 w-full max-w-full overflow-hidden">
      {/* تم تغيير المسافات لتكون أصغر */}
      <div className="flex flex-row flex-nowrap items-end gap-1 sm:gap-2 md:gap-3" dir="rtl">
        <FlipClock
          countdown
          targetDate={new Date(targetDate)}
          size="md" 
          variant="outline"
          unitClassName="bg-black text-white border-0 rounded-sm"
          separatorClassName="text-tedx-red"
          labels={orderedLabels}
        />
      </div>
    </div>
  );
}