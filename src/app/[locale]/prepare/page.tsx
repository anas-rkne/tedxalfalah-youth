import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import PreparePageClient from "@/components/prepare/PreparePageClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.prepare" });
  return { title: t("meta.title"), description: t("meta.description") };
}

export default async function PreparePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PreparePageClient />;
}
