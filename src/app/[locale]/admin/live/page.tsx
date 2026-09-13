import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import QaAdminPanel from "@/components/qa/QaAdminPanel";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Live Q&A Admin | TEDxAlFalah Youth",
    robots: { index: false, follow: false },
  };
}

export default async function AdminLivePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <QaAdminPanel />;
}
