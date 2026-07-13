import { getTranslations } from "next-intl/server";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";
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
              <div
                key={activation.id}
                className={`flex flex-col md:flex-row gap-8 items-center ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="relative w-full md:w-1/2 aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={activation.imageUrl}
                    alt={activation.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <h2 className="text-2xl font-bold mb-2">
                    {activation.name}
                  </h2>
                  <p className="text-sm text-tedx-red font-medium mb-3">
                    {activation.locationInVenue}
                  </p>
                  <p className="text-tedx-gray leading-relaxed">
                    {activation.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionContainer>
    </section>
  );
}
