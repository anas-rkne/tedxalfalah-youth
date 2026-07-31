"use client";

import { cn } from "@/lib/utils";
import React from "react";

/* أيقونة الزاوية اليسرى العلوية – تذكرة */
const LeftCornerIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="w-64 h-64 text-tedx-red/[0.05] absolute -left-8 -top-8 pointer-events-none"
    aria-hidden="true"
  >
    <path d="M20 12V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6" />
    <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

/* أيقونة الزاوية اليمنى العلوية – ميكروفون */
const RightCornerIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="w-64 h-64 text-tedx-red/[0.05] absolute -right-8 -top-8 pointer-events-none"
    aria-hidden="true"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

export const BackgroundBeamsWithCollision = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative min-h-[100dvh] w-full overflow-hidden bg-white flex items-center justify-center",
        className
      )}
    >
      

      {/* المحتوى */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

export default React.memo(BackgroundBeamsWithCollision);