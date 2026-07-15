import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import TextReveal from "@/components/ui/TextReveal";

export default async function Theme() {
  const t = await getTranslations("home.theme");

  return (
    <section className="section-padding bg-tedx-black text-tedx-white relative overflow-hidden">
      <div className="noise-overlay" />
      <SectionContainer className="max-w-3xl text-center relative z-10">
        <TextReveal
          text={t("title")}
          as="h2"
          className="text-3xl md:text-5xl font-bold mb-8 leading-tight"
        />
        <p className="text-tedx-white/80 text-lg leading-relaxed">
          {t("body")}
        </p>
      </SectionContainer>
    </section>
  );
}
