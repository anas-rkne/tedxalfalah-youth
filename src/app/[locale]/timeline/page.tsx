import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import TimelinePageClient from "@/components/timeline/TimelinePageClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.timeline" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `${SITE_URL}/${locale}/timeline` },
  };
}

export default async function TimelinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // المصدر الوحيد للجدول: نفس المفاتيح التي تعرضها صفحة الشكر، فلا يتكرّر التاريخ في مكانين.
  const tc = await getTranslations({ locale, namespace: "thankYou.common" });
  const stages = tc.raw("timeline.stages") as { date: string; title: string }[];

  return <TimelinePageClient stages={stages} />;
}
