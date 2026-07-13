import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import SpeakersGrid from "@/components/speakers/SpeakersGrid";
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
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          {t("title")}
        </h1>
        <p className="text-center text-tedx-gray max-w-2xl mx-auto mb-12">
          {t("subtitle")}
        </p>

        {speakers.length > 0 ? (
          <SpeakersGrid speakers={speakers} />
        ) : (
          <p className="text-center text-tedx-gray py-16">
            {t("empty")}
          </p>
        )}
      </SectionContainer>
    </section>
  );
}
