import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ScrollReveal from "@/components/ui/ScrollReveal";
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

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
        }}
      />
      <span className="text-[13px] font-semibold text-slate-400/60 uppercase tracking-[0.08em] whitespace-nowrap px-4 py-1.5 bg-slate-400/[0.06] border border-slate-400/[0.08] rounded-full">
        {title}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
        }}
      />
    </div>
  );
}

export default async function VenuePage() {
  const t = await getTranslations("page.venue");

  return (
    <div className="bg-[#0a0a0e]">
      {/* ═══════ Hero ═══════ */}
      <VenueHeroSection
        heroTitle={t("heroTitle")}
        heroAlt={t("heroAlt")}
        heroImage="/images/venue-hero.webp"   // ← تأكد من اسم الملف الموجود في public
      />

      {/* ═══════ Narrative ═══════ */}
      <ScrollReveal>
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <SectionContainer className="max-w-3xl mx-auto">
            <SectionHeading title={t("narrativeLabel")} />
            <p className="text-slate-400/80 leading-[1.8] text-center text-[15px]">
              {t("narrative")}
            </p>
          </SectionContainer>
        </section>
      </ScrollReveal>

      {/* ═══════ Map ═══════ */}
      <VenueMapSection
        title={t("gettingThere.title")}
        mapTitle={t("gettingThere.mapTitle")}
        directions={t("gettingThere.directions")}
      />

      {/* ═══════ Accessibility ═══════ */}
      <ScrollReveal>
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <SectionContainer className="max-w-3xl mx-auto">
            <SectionHeading title={t("accessibility.title")} />
            <p className="text-slate-400/80 leading-[1.8] text-center text-[15px]">
              {t("accessibility.body")}
            </p>
          </SectionContainer>
        </section>
      </ScrollReveal>

      {/* ═══════ Gallery ═══════ */}
      <VenueGallerySection count={6} />
    </div>
  );
}