"use client";

import { useRTL } from "@/hooks/useRTL";
import { ReactNode } from "react";

interface SectionBadgeProps {
  children: ReactNode;
  className?: string;
}

export default function SectionBadge({ children, className = "" }: SectionBadgeProps) {
  const { isRTL } = useRTL();

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-tedx-red px-4 py-1.5 bg-tedx-red/10 border border-tedx-red/20 rounded-full ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* النقطة النابضة (Pulse Dot) */}
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tedx-red opacity-50" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-tedx-red" />
      </span>
      {children}
    </span>
  );
}