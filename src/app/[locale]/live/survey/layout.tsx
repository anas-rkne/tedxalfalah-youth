import type { Metadata } from "next";

/**
 * `layout.tsx` مستقل لأن `page.tsx` في هذا المسار مكوّن عميل
 * (`"use client"`) ولا يمكنه تصدير `metadata`. Layout ملف خادم، فيُصدر
 * `noindex` دون تحويل الصفحة إلى مكوّن خادم.
 */
export const metadata: Metadata = {
  title: "Session Survey | TEDxAlFalah Youth",
  robots: { index: false, follow: false },
};

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
