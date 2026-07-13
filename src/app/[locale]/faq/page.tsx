import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FaqAccordion, { FaqItem } from "@/components/shared/FaqAccordion";
import { Link } from "@/i18n/navigation";
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

export default async function FaqPage() {
  const t = await getTranslations("page.faq");

  const GENERAL_FAQ_ITEMS: FaqItem[] = Array.from({ length: 9 }, (_, i) => ({
    question: t(`items.item${i + 1}.question`),
    answer: t(`items.item${i + 1}.answer`),
  }));

  return (
    <section className="section-padding">
      <SectionContainer>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          {t("title")}
        </h1>
        <p className="text-center text-tedx-gray max-w-xl mx-auto mb-12">
          {t("subtitle")}{" "}
          <Link href="/apply#faq" className="underline text-tedx-red">
            {t("applyFaqLink")}
          </Link>
        </p>

        <FaqAccordion items={GENERAL_FAQ_ITEMS} />
      </SectionContainer>
    </section>
  );
}
