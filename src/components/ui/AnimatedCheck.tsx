"use client";

import { useReducedMotion } from "framer-motion";

export default function AnimatedCheck() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        className="mx-auto mb-6"
        aria-hidden="true"
      >
        <circle
          cx="36"
          cy="36"
          r="34"
          stroke="currentColor"
          strokeWidth="3"
          className="text-red-600"
        />
        <path
          d="M22 37L31 46L50 27"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-600"
        />
      </svg>
    );
  }

  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      className="mx-auto mb-6"
      aria-hidden="true"
    >
      <circle
        cx="36"
        cy="36"
        r="34"
        stroke="currentColor"
        strokeWidth="3"
        className="text-red-600"
        style={{
          strokeDasharray: 214,
          strokeDashoffset: 214,
          animation: "tedx-circle-draw 0.6s ease-out forwards",
        }}
      />
      <path
        d="M22 37L31 46L50 27"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-600"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 40,
          animation: "tedx-check-draw 0.4s ease-out 0.5s forwards",
        }}
      />
    </svg>
  );
}
