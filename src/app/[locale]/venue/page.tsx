import { getTranslations } from "next-intl/server";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";
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
      <section className="relative h-[50vh] min-h-[350px]">
        <Image
          src="/mock/hero-placeholder.svg"
          alt={t("heroAlt")}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-tedx-white text-center px-4">
            {t("heroTitle")}
          </h1>
        </div>
      </section>

      <section className="py-16">
        <SectionContainer className="max-w-3xl">
          <p className="text-tedx-gray leading-relaxed">
            {t("narrative")}
          </p>
        </SectionContainer>
      </section>

      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold mb-6">{t("gettingThere.title")}</h2>
          <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
            <iframe
              title={t("gettingThere.mapTitle")}
              src="https://www.google.com/maps?q=Dubai&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
          <p className="text-sm text-tedx-gray">
            {t("gettingThere.directions")}
          </p>
        </SectionContainer>
      </section>

      <section className="py-16">
        <SectionContainer className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">{t("accessibility.title")}</h2>
          <p className="text-tedx-gray leading-relaxed">
            {t("accessibility.body")}
          </p>
        </SectionContainer>
      </section>

      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold mb-6">{t("photoGallery.title")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-video rounded-lg overflow-hidden"
              >
                <Image
                  src="/mock/activation-placeholder.svg"
                  alt={t("photoGallery.alt", { number: i + 1 })}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>
    </>
  );
}
