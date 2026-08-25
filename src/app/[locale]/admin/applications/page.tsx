import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.meta" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminApplicationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminDashboard />;
}
