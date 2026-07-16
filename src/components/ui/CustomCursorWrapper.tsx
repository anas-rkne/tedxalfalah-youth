"use client";

import dynamic from "next/dynamic";

const SmoothCursor = dynamic(
  () => import("@/components/ui/smooth-cursor"),
  { ssr: false }
);

export default function CustomCursorWrapper() {
  return <SmoothCursor />;
}
