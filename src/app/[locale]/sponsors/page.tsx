import { getTranslations } from "next-intl/server";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";
import PartnerInquiryForm from "@/components/sponsors/PartnerInquiryForm";
import { getSponsors } from "@/lib/data";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.sponsors" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

const TIER_KEYS = ["platinum", "gold", "silver", "community"] as const;

export default async function SponsorsPage() {
  const sponsors = await getSponsors();
  const t = await getTranslations("page.sponsors");

  return (
    <>
      <section className="section-padding">
        <SectionContainer className="max-w-3xl text-center">
          <h1 className="heading-h1 mb-12">
            {t("hero.title")}
          </h1>
          <p className="text-tedx-gray leading-relaxed">
            {t("hero.body")}
          </p>
        </SectionContainer>
      </section>

      <section className="section-padding bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-10">
            {t("tiers.title")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIER_KEYS.map((key) => (
              <div
                key={key}
                className="p-6 bg-tedx-white rounded-lg text-center"
              >
                <h3 className="font-bold text-lg mb-3">{t(`tiers.${key}.name`)}</h3>
                <ul className="text-sm text-tedx-gray space-y-1">
                  {(t.raw(`tiers.${key}.benefits`) as string[]).map((b: string) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-tedx-gray mt-8">
            {t("tiers.fullPackagesNote")}
          </p>
        </SectionContainer>
      </section>

      {sponsors.length > 0 && (
        <section className="section-padding">
          <SectionContainer>
            <h2 className="text-2xl font-bold text-center mb-10">
              {t("currentPartners.title")}
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              {sponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.websiteUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-32 h-16"
                >
                  <Image
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    fill
                    className="object-contain grayscale hover:grayscale-0 transition-all"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </a>
              ))}
            </div>
          </SectionContainer>
        </section>
      )}

      <section className="section-padding bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-2">
            {t("formSection.title")}
          </h2>
          <p className="text-center text-sm text-tedx-gray mb-8">
            {t("formSection.subtitle")}
          </p>
          <PartnerInquiryForm />
          <p className="text-center text-sm mt-8">
            <a
              href="/sponsorship-deck.pdf"
              className="underline text-tedx-red"
            >
              {t("formSection.downloadDeck")}
            </a>
          </p>
        </SectionContainer>
      </section>
    </>
  );
}
