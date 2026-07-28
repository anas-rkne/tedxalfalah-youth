import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FaqAccordion, { FaqItem } from "@/components/shared/FaqAccordion";
import TextReveal from "@/components/ui/TextReveal";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Link } from "@/i18n/navigation";
import SectionBadge from "@/components/ui/SectionBadge";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.faq" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.faq" });

  const GENERAL_FAQ_ITEMS: FaqItem[] = Array.from({ length: 9 }, (_, i) => ({
    question: t(`items.item${i + 1}.question`),
    answer: t(`items.item${i + 1}.answer`),
  }));

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      {/* توهج خلفي خفيف (مطابق لباقي الأقسام) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      <SectionContainer className="relative z-10">
        {/* شارة TEDx موحدة */}
        <ScrollReveal>
          <div className="flex justify-center mb-4">
            <SectionBadge>{t("badge")}</SectionBadge>
          </div>
        </ScrollReveal>

        <TextReveal
          text={t("title")}
          as="h1"
          className="heading-h1 text-center mb-4"
        />

        <ScrollReveal>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed text-lg">
            {t("subtitle")}{" "}
            <Link href="/apply#faq" className="underline text-tedx-red hover:text-tedx-red/80 transition-colors">
              {t("applyFaqLink")}
            </Link>
          </p>

          <FaqAccordion items={GENERAL_FAQ_ITEMS} />
        </ScrollReveal>
      </SectionContainer>
    </section>
  );
}