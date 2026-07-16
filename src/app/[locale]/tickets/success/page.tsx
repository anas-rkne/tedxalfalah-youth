import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";
import TextReveal from "@/components/ui/TextReveal";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.tickets.success" });
  return { title: t("meta.title") };
}

export default async function TicketSuccessPage() {
  const t = await getTranslations("page.tickets.success");
  return (
    <section className="min-h-[60vh] flex items-center justify-center section-padding">
      <SectionContainer className="max-w-lg text-center">
        <p className="text-red-600 font-bold text-sm uppercase tracking-widest mb-4">
          {t("eyebrow")}
        </p>
        <TextReveal text={t("title")} as="h1" className="text-3xl md:text-4xl font-bold mb-6" serif />
        <p className="text-gray-500 leading-relaxed mb-10">{t("body")}</p>
        <Button href="/venue" variant="primary" size="md">
          {t("cta")}
        </Button>
      </SectionContainer>
    </section>
  );
}
