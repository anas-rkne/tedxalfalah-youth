import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import SpeakersGrid from "@/components/speakers/SpeakersGrid";
import { getSpeakers } from "@/lib/data";
import DarkHeroSection from "@/components/shared/DarkHeroSection";
import SectionBadge from "@/components/ui/SectionBadge";
import JsonLd from "@/components/JsonLd";
import { personSchema } from "@/lib/json-ld";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.speakers" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function SpeakersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const speakers = await getSpeakers();
  const t = await getTranslations({ locale, namespace: "page.speakers" });
  const isArabic = locale === "ar";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-tedx-red selection:text-white pb-32 overflow-hidden relative">
      {speakers.map((s) => (
        <JsonLd
          key={s.id}
          data={personSchema({
            name: s.name,
            description: s.shortDescriptor,
            image: s.imageUrl,
          })}
        />
      ))}
      {/* ═══════════ HERO ═══════════ */}
      <DarkHeroSection
        badgeLabel={t("hero.badge")}
        mainTitle={t("hero.mainTitle")}
        highlightTitle={t("hero.highlightTitle")}
        description={t("meta.description")}
        discoverLabel={isArabic ? "اكتشف القائمة" : "Discover Lineup"}
        isArabic={isArabic}
      />

      {/* ═══════════ SPEAKERS GRID ═══════════ */}
      <section className="section-padding bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <SectionBadge>{t("hero.badge")}</SectionBadge>
            </div>
            <h2 className={`heading-h1 tracking-[-0.03em] heading-margin text-center ${isArabic ? "font-arabic" : ""}`}>
              {t("title")}
            </h2>
            <div className="flex justify-center heading-margin">
              <div className="h-1 w-20 bg-tedx-red rounded-full" />
            </div>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {speakers.length > 0 ? (
            <SpeakersGrid speakers={speakers} bioFallback={t("bioFallback")} />
          ) : (
            <p className="text-center text-muted-foreground py-16">
              {t("empty")}
            </p>
          )}
        </div>
      </section>

      {/* ═══════════ CSS للهيرو ═══════════ */}
      <style>{`
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-scale-x {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .hero-fade-up {
          opacity: 0;
          animation: hero-fade-up 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .hero-scale-x {
          transform: scaleX(0);
          animation: hero-scale-x 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-fade-up, .hero-scale-x {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}