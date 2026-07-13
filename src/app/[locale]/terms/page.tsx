import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.terms" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("page.terms");

  const SECTION_NAMES = ["section1", "section2", "section3", "section4", "section5", "section6"] as const;

  return (
    <section className="py-16 md:py-24">
      <SectionContainer className="max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-tedx-gray mb-10">
          {t("lastUpdated")}
        </p>

        <div className="flex flex-col gap-10">
          {SECTION_NAMES.map((sectionKey) => (
            <div key={sectionKey}>
              <h2 className="text-xl font-bold mb-3">{t(`sections.${sectionKey}.title`)}</h2>
              <div className="flex flex-col gap-3">
                {(t.raw(`sections.${sectionKey}.content`) as string[]).map((paragraph: string, i: number) => (
                  <p key={i} className="text-tedx-gray leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
