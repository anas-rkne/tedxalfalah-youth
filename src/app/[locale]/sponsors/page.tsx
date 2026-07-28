import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { getSponsors } from "@/lib/data";
import SponsorsPageClient from "./SponsorsPageClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.sponsors" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function SponsorsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.sponsors" });
  const sponsors = await getSponsors();
  const isArabic = locale === "ar";
  return <SponsorsPageClient sponsors={sponsors} />;
}
