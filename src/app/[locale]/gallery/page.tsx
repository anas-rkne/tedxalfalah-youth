import { setRequestLocale, getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { getGalleryImages } from "@/lib/data";
import DarkHeroSection from "@/components/shared/DarkHeroSection";
import GalleryContent from "./GalleryContent";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.gallery" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page.gallery" });
  const images = await getGalleryImages();
  const isArabic = locale === "ar";

  const categories = [
    { key: "all", label: t("filters.all") },
    { key: "venue", label: t("filters.venue") },
    { key: "speakers", label: t("filters.speakers") },
    { key: "behind", label: t("filters.behind") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DarkHeroSection
        badgeLabel={t("hero.badge")}
        mainTitle={t("hero.title")}
        highlightTitle={t("hero.highlight")}
        description=""
        discoverLabel={isArabic ? "استعرض" : "Browse"}
        isArabic={isArabic}
      />
      <GalleryContent
        images={images}
        categories={categories}
        closeLabel={t("lightbox.close")}
        ofLabel={t("lightbox.of")}
        emptyLabel={t("empty")}
      />
    </div>
  );
}
