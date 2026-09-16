import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { getSponsors } from "@/lib/data";
import { SITE_URL } from "@/lib/constants";
import SponsorsPageClient from "./SponsorsPageClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.sponsors" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `${SITE_URL}/${locale}/sponsors` },
  };
}

export default async function SponsorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sponsors = await getSponsors();
  return <SponsorsPageClient sponsors={sponsors} />;
}