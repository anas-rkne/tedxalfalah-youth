import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";

export default async function Theme() {
  const t = await getTranslations("home.theme");

  return (
    <section className="py-16 md:py-24 bg-tedx-black text-tedx-white">
      <SectionContainer className="max-w-3xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
          {t("title")}
        </h2>
        <p className="text-tedx-white/80 text-lg leading-relaxed">
          {t("body")}
        </p>
      </SectionContainer>
    </section>
  );
}
