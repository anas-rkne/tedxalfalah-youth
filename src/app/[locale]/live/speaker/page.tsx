import type { Metadata } from "next";
import SpeakerView from "@/components/qa/SpeakerView";

export const metadata: Metadata = {
  title: "TEDx Speaker View",
};

export default function SpeakerPage() {
  return <SpeakerView />;
}
