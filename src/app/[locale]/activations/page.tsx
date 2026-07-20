import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ActivationCard from "@/components/activations/ActivationCard";
import TextReveal from "@/components/ui/TextReveal";
import ScrollReveal from "@/components/ui/ScrollReveal";
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
      <SectionContainer className="max-w-5xl mx-auto">
        {/* ═══════ العنوان ═══════ */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-4 px-4 py-1.5 bg-black/[0.03] border border-black/[0.05] rounded-full">
            Activations
          </span>
          <TextReveal
            text={t("title")}
            as="h1"
            className="font-bold font-arabic text-zinc-900 text-center leading-[1.1] tracking-[-0.03em] mb-3 text-[clamp(2rem,4vw,3rem)]"
            serif
          />
          <p className="text-zinc-500 text-base max-w-lg mx-auto leading-[1.7]">
            {t("subtitle")}
          </p>
        </div>

        <ScrollReveal>
          {activations.length === 0 ? (
            <p className="text-center text-zinc-400 py-16">
              {t("empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-20">
              {activations.map((activation, index) => (
                <ActivationCard
                  key={activation.id}
                  activation={activation}
                  index={index}
                />
              ))}
            </div>
          )}
        </ScrollReveal>
      </SectionContainer>
    </section>
  );
}