"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSlidingButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function AnimatedSlidingButton({
  href,
  children,
  variant = "primary",
  className = "",
}: AnimatedSlidingButtonProps) {
  const baseClasses =
  variant === "primary"
    ? "bg-tedx-red text-white border border-tedx-red hover:bg-[#C42516]"
    : "border-2 border-tedx-red text-tedx-red bg-transparent hover:bg-tedx-red hover:text-white";

  return (
    <motion.div
      className="w-full sm:w-auto"
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Link
        href={href}
        className={cn(
          `group relative inline-block w-full sm:w-auto min-w-[120px] sm:min-w-[160px] overflow-hidden rounded-full border px-4 py-2 sm:px-6 sm:py-3 text-center text-sm sm:text-base font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-600`,
          baseClasses,
          className
        )}
      >
        {/* 1. النص الأصلي مع النقطة (يخرج لليمين عند التمرير) */}
        <div className="flex items-center justify-center gap-2 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-0">
          <div className="h-2 w-2 rounded-full bg-white transition-all duration-300 group-hover:scale-[100.8]" />
          {/* إضافة whitespace-nowrap هنا لمنع التفاف النص */}
          <span className="inline-block whitespace-nowrap">{children}</span>
        </div>

        {/* 2. النص البديل مع السهم (يدخل من اليسار عند التمرير) */}
        <div className="absolute inset-0 flex -translate-x-full items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          {/* إضافة whitespace-nowrap هنا أيضاً */}
          <span className="inline-block whitespace-nowrap">{children}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}