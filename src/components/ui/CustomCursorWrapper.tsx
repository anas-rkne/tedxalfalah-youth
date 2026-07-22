"use client";

import dynamic from "next/dynamic";

const SmoothCursor = dynamic(
  () => import("@/components/ui/smooth-cursor").then((mod) => mod.SmoothCursor),
  { ssr: false }
);

export default function CustomCursorWrapper() {
  // ✅ اختر التصميم: "pulse-dot" | "blend-circle" | "bubble-trail" | "ring"
  return <SmoothCursor cursor="paper-plane" />;
}