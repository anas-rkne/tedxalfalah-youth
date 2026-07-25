"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import FlipClock from "@/components/ui/flip-clock";
import { useRTL } from "@/hooks/useRTL";

interface CountdownProps {
  targetDate: string;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("countdown");
  const { isRTL } = useRTL();

  const orderedLabels = useMemo(
    () => [t("seconds"), t("minutes"), t("hours"), t("days")],
    [t]
  );

  return (
    <div className="flex flex-col items-center gap-2 md:gap-4 w-full max-w-full overflow-hidden">
      <div
        className="flex flex-row flex-nowrap items-end gap-1 sm:gap-2 md:gap-3"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <FlipClock
          countdown
          targetDate={new Date(targetDate)}
          size="md"
          variant="outline"
          unitClassName="bg-[var(--color-tedx-black)] text-white border-0 rounded-sm"
          separatorClassName="text-tedx-red"
          labels={orderedLabels}
        />
      </div>
    </div>
  );
}