import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ActivationCard from "@/components/activations/ActivationCard";
import { getActivations } from "@/lib/data";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.activations" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ActivationsPage() {
  const activations = await getActivations();
  const t = await getTranslations("page.activations");

  return (
    <section className="py-16 md:py-24">
      <SectionContainer>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          {t("title")}
        </h1>
        <p className="text-center text-tedx-gray max-w-2xl mx-auto mb-16">
          {t("subtitle")}
        </p>

        {activations.length === 0 ? (
          <p className="text-center text-tedx-gray py-16">
            {t("empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-16">
            {activations.map((activation, index) => (
              <ActivationCard
                key={activation.id}
                activation={activation}
                index={index}
              />
            ))}
          </div>
        )}
      </SectionContainer>
    </section>
  );
}
