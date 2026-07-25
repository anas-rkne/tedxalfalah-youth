// src/app/[locale]/venue/page.tsx
import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ScrollReveal from "@/components/ui/ScrollReveal";
import VenueMapSection from "@/components/venue/VenueMapSection";
import VenueGallerySection from "@/components/venue/VenueGallerySection";
import SectionBadge from "@/components/ui/SectionBadge";
import { Metadata } from "next";
import DarkHeroSection from "@/components/shared/DarkHeroSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.venue" });
  return { title: t("meta.title"), description: t("meta.description") };
}

export default async function VenuePage({ params }: Props) {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const t = await getTranslations("page.venue");

  return (
    <div className="bg-background">
      {/* ═══════ Hero ═══════ */}
      <DarkHeroSection
        badgeLabel={t("hero.badgeLabel")}
        mainTitle={t("hero.line1")}
        highlightTitle={t("hero.line2")}
        description={t("hero.description")}
        discoverLabel="Scroll"
        isArabic={isArabic}
        heroImage="/images/venue-hero.webp"
        heroAlt={t("heroAlt")}
      />

      {/* ═══════ Meet the Venue ═══════ */}
      <section className="section-padding bg-background">
        <div className="container-padding max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <SectionBadge>{t("narrativeLabel")}</SectionBadge>
          </div>
          <h1 className="heading-h1 tracking-[-0.03em] heading-margin">{t("heroTitle")}</h1>
          <div className="flex justify-center"><div className="h-1 w-20 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" /></div>
          <p className="text-center text-muted-foreground max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto mt-6 text-lg md:text-xl leading-relaxed">
            {t("narrative")}
          </p>
        </div>
      </section>

      {/* ═══════ Map ═══════ */}
      <VenueMapSection
        title={t("gettingThere.title")}
        mapTitle={t("gettingThere.mapTitle")}
        directions={t("gettingThere.directions")}
      />

      {/* ═══════ Accessibility ═══════ */}
      <ScrollReveal>
        <section className="section-padding px-4 sm:px-6 lg:px-8">
          <SectionContainer className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <SectionBadge>{t("accessibility.title")}</SectionBadge>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
            <p className="text-center text-muted-foreground text-[15px] leading-[1.8]">{t("accessibility.body")}</p>
          </SectionContainer>
        </section>
      </ScrollReveal>

      {/* ═══════ Gallery ═══════ */}
      <VenueGallerySection count={6} />
    </div>
  );
}