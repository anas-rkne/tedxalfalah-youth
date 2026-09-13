import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import LiveScreen from "@/components/qa/LiveScreen";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Live Screen | TEDxAlFalah Youth",
    robots: { index: false, follow: false },
  };
}

export default async function LiveScreenPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LiveScreen />;
}
