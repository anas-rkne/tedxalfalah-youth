"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";

interface ActionButtonsProps {
  applyLabel: string;
  ticketsLabel: string;
}

function ActionButton({
  href,
  children,
  variant,
}: {
  href: string;
  children: React.ReactNode;
  variant: "primary" | "secondary";
}) {
  const colorClasses =
    variant === "primary"
      ? "bg-red-600 text-white border-2 border-black"
      : "bg-yellow-400 text-black border-2 border-black";

  return (
    <motion.div
      className="w-full sm:w-auto"
      // حركة ناعمة جداً عند الضغط (اختياري)
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Link
        href={href}
        className={`relative inline-flex w-full sm:w-auto items-center justify-center rounded-lg border-2 px-6 py-3 text-base font-bold transition-all duration-200 shadow-[3px_3px_0px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] focus:outline-none focus:ring-2 focus:ring-red-600 ${colorClasses}`}
      >
        {/* النص مع سهم يتحرك قليلاً عند الهوفر */}
        <span className="flex items-center gap-2 group">
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            {children}
          </span>
          <motion.span
            className="inline-block transition-transform duration-200 group-hover:translate-x-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </motion.span>
        </span>
      </Link>
    </motion.div>
  );
}

export default function ActionButtons({
  applyLabel,
  ticketsLabel,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 mt-6 w-full max-w-md mx-auto">
      <ActionButton href="/apply" variant="primary">
        {applyLabel}
      </ActionButton>
      <ActionButton href="/tickets" variant="secondary">
        {ticketsLabel}
      </ActionButton>
    </div>
  );
}