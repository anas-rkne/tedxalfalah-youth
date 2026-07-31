import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";
import TextReveal from "@/components/ui/TextReveal";
import Breadcrumb from "@/components/ui/Breadcrumb";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.tickets.cancel" });
  return { title: t("meta.title"), description: t("meta.description") };
}

export default async function TicketCancelPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page.tickets.cancel" });
  const tNav = await getTranslations({ locale, namespace: "common.nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return (
    <section className="min-h-[60vh] flex items-center justify-center section-padding">
      <SectionContainer className="max-w-lg text-center">
        <Breadcrumb
          ariaLabel={tCommon("ui.breadcrumb")}
          segments={[
            { label: tNav("home"), href: "/" },
            { label: tNav("tickets"), href: "/tickets" },
            { label: t("meta.title") },
          ]}
        />
        <TextReveal text={t("title")} as="h1" className="text-3xl md:text-4xl font-bold mb-6" serif />
        <p className="text-gray-500 leading-relaxed mb-10">{t("body")}</p>
        <Button href="/tickets" variant="primary" size="md">
          {t("cta")}
        </Button>
      </SectionContainer>
    </section>
  );
}
