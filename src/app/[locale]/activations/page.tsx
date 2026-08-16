// هذه الصفحة مخفية حالياً بناءً على طلب العميل. يمكن إعادتها لاحقاً.
import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ActivationCard from "@/components/activations/ActivationCard";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getActivations } from "@/lib/data";
import { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import SectionBadge from "@/components/ui/SectionBadge";
import DarkHeroSection from "@/components/shared/DarkHeroSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.activations" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `${SITE_URL}/${locale}/activations` },
  };
}

export default async function ActivationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activations = await getActivations();
  const t = await getTranslations({ locale, namespace: "page.activations" });
  const isArabic = locale === "ar";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-tedx-red selection:text-white pb-32 overflow-hidden relative">
      {/* ═══════════ HERO (مشترك) ═══════════ */}
      <DarkHeroSection
        badgeLabel={t("hero.badge")}
        mainTitle={t("hero.mainTitle")}
        highlightTitle={t("hero.highlightTitle")}
        description={t("meta.description")}
        discoverLabel={t("hero.discoverLabel")}
        isArabic={isArabic}
      />

      {/* ═══════════ TITLE ═══════════ */}
      <section className="section-padding bg-background">
        <div className={`container-padding max-w-5xl mx-auto text-center ${isArabic ? 'font-arabic' : 'font-sans'}`}>
          <div className="flex justify-center mb-4">
            <SectionBadge>{t("meta.title")}</SectionBadge>
          </div>
          <h1 className={`heading-h1 tracking-[-0.03em] heading-margin ${isArabic ? 'font-arabic' : 'font-sans'}`}>
            {t("title")}
          </h1>
          <div className="flex justify-center">
            <div className="h-1 w-20 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
          </div>
          <p className={`text-center max-w-2xl mx-auto mt-6 text-lg leading-relaxed text-muted-foreground ${isArabic ? 'font-arabic' : ''}`}>
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* ═══════════ ACTIVATIONS GRID ═══════════ */}
      <section className="container-padding pb-20 sm:pb-28">
        <ScrollReveal>
          {activations.length === 0 ? (
            <p className={`text-center text-muted-foreground py-16 ${isArabic ? 'font-arabic' : ''}`}>
              {t("empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-20 max-w-5xl mx-auto">
              {activations.map((activation, index) => (
                <ActivationCard
                  key={activation.id}
                  activation={activation}
                  index={index}
                  descriptionFallback={t("descriptionFallback")}
                />
              ))}
            </div>
          )}
        </ScrollReveal>
      </section>
    </div>
  );
}