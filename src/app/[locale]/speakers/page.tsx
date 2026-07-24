import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import SpeakersGrid from "@/components/speakers/SpeakersGrid";
import { getSpeakers } from "@/lib/data";
import SpeakersHeroSection from "@/components/speakers/SpeakersHeroSection"; // ✅ استيراد مكون الهيرو الجديد

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
  const speakers = await getSpeakers();
  const t = await getTranslations("page.speakers");

  const isArabic = locale === "ar";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#e62b1e] selection:text-white pb-32 overflow-hidden font-sans relative">
      
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION (مكون عميل مع Parallax)
          ═══════════════════════════════════════════════════════════════ */}
      <SpeakersHeroSection
        badgeLabel={t("hero.badge")}
        mainTitle={t("hero.mainTitle")}
        highlightTitle={t("hero.highlightTitle")}
        description={t("meta.description")}
        discoverLabel={isArabic ? 'اكتشف القائمة' : 'Discover Lineup'}
        isArabic={isArabic}
      />

      {/* ═══════════════════════════════════════════════════════════════
          SPEAKERS GRID
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-arabic text-center mb-6">
              {t("title")}
            </h2>
            <div className="flex justify-center mb-8">
              <div className="h-1.5 w-24 bg-tedx-red rounded-full" />
            </div>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto text-base md:text-xl leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {speakers.length > 0 ? (
            <SpeakersGrid speakers={speakers} />
          ) : (
            <p className="text-center text-muted-foreground py-16">
              {t("empty")}
            </p>
          )}
        </div>
      </section>

      {/* أنيميشن CSS (بقية الكود) */}
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