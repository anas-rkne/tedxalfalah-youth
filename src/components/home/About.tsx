import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import TextReveal from "@/components/ui/TextReveal";

export default async function About() {
  const t = await getTranslations("home.about");

  return (
    <section className="section-padding bg-tedx-white">
      <SectionContainer className="max-w-3xl text-center">
        <TextReveal
          text={t("heading")}
          as="h2"
          className="text-3xl md:text-4xl font-bold mb-6"
        />
        <p className="text-tedx-gray text-lg leading-relaxed mb-4">
          {t("body")}
        </p>
        <p className="text-sm text-tedx-gray italic">{t("licenseNote")}</p>
      </SectionContainer>
    </section>
  );
}
