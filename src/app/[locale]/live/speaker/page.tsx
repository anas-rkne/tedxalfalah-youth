import type { Metadata } from "next";
import SpeakerView from "@/components/qa/SpeakerView";

export const metadata: Metadata = {
  title: "TEDx Speaker View",
  // ⚠️ كانت بلا `robots`، فكانت قابلة للفهرسة. شاشة المتحدث تعرض المحتوى
  // المتدفق من لوحة التحكم ولا يجب أن تظهر في نتائج البحث.
  robots: { index: false, follow: false },
};

export default function SpeakerPage() {
  return <SpeakerView />;
}
