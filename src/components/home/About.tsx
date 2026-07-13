import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";

export default async function About() {
  const t = await getTranslations("home.about");

  return (
    <section className="py-16 md:py-24 bg-tedx-white">
      <SectionContainer className="max-w-3xl text-center">
        <FadeInView>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("heading")}</h2>
          <p className="text-tedx-gray text-lg leading-relaxed mb-4">
            {t("body")}
          </p>
          <p className="text-sm text-tedx-gray italic">{t("licenseNote")}</p>
        </FadeInView>
      </SectionContainer>
    </section>
  );
}
