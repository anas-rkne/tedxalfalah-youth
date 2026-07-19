import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import SpeakersGrid from "@/components/speakers/SpeakersGrid";
import TextReveal from "@/components/ui/TextReveal";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getSpeakers } from "@/lib/data";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.speakers" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function SpeakersPage() {
  const speakers = await getSpeakers();
  const t = await getTranslations("page.speakers");

  return (
    <section className="section-padding">
      <SectionContainer>
        {/* عنوان رئيسي بخط الموقع (serif) مع تأثير ظهور تدريجي */}
        <TextReveal
          text={t("title")}
          as="h1"
          className="font-arabic text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 text-gray-900"
          serif
        />

        {/* خط زخرفي أحمر تحت العنوان */}
        <div className="flex justify-center mb-6">
          <div className="h-1 w-20 bg-red-600 rounded-full" />
        </div>

        <ScrollReveal>
          <p className="text-center text-gray-500 max-w-2xl mx-auto mb-12 text-lg leading-relaxed">
            {t("subtitle")}
          </p>

          {speakers.length > 0 ? (
            <SpeakersGrid speakers={speakers} />
          ) : (
            <p className="text-center text-gray-500 py-16">
              {t("empty")}
            </p>
          )}
        </ScrollReveal>
      </SectionContainer>
    </section>
  );
}