import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";

export default async function Theme() {
  const t = await getTranslations("home.theme");

  return (
    <section className="section-padding bg-tedx-black text-tedx-white">
      <SectionContainer className="max-w-3xl text-center">
        <FadeInView>
          <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
            {t("title")}
          </h2>
          <p className="text-tedx-white/80 text-lg leading-relaxed">
            {t("body")}
          </p>
        </FadeInView>
      </SectionContainer>
    </section>
  );
}
