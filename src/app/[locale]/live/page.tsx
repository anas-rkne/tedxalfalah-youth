import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import LiveParticipate from "@/components/qa/LiveParticipate";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Live Q&A | TEDxAlFalah Youth",
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/${locale}/live` },
  };
}

export default async function LivePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LiveParticipate />;
}
