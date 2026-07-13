import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import VenueHeroSection from "@/components/venue/VenueHeroSection";
import VenueMapSection from "@/components/venue/VenueMapSection";
import VenueGallerySection from "@/components/venue/VenueGallerySection";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.venue" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function VenuePage() {
  const t = await getTranslations("page.venue");

  return (
    <>
      <VenueHeroSection heroTitle={t("heroTitle")} heroAlt={t("heroAlt")} />

      <section className="section-padding">
        <SectionContainer className="content-narrow">
          <p className="text-tedx-gray leading-relaxed">
            {t("narrative")}
          </p>
        </SectionContainer>
      </section>

      <VenueMapSection
        title={t("gettingThere.title")}
        mapTitle={t("gettingThere.mapTitle")}
        directions={t("gettingThere.directions")}
      />

      <section className="section-padding">
        <SectionContainer className="content-narrow">
          <h2 className="text-2xl font-bold mb-4">{t("accessibility.title")}</h2>
          <p className="text-tedx-gray leading-relaxed">
            {t("accessibility.body")}
          </p>
        </SectionContainer>
      </section>

      <VenueGallerySection count={6} />
    </>
  );
}
