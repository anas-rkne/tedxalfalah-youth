import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import Button from "@/components/ui/Button";

// TODO: replace with real application deadline once confirmed by client
const APPLICATION_DEADLINE_LABEL = "September 30, 2026";

export default async function ApplyBanner() {
  const t = await getTranslations("home.applyBanner");

  return (
    <section className="bg-tedx-red section-padding-sm">
      <SectionContainer className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
        <FadeInView>
          <p className="text-tedx-white text-xl md:text-2xl font-bold">
            {t("text", { date: APPLICATION_DEADLINE_LABEL })}
          </p>
          <Button
            href="/apply"
            size="lg"
            className="!bg-tedx-white !text-tedx-red !border-tedx-white hover:!bg-transparent hover:!text-tedx-white"
          >
            {t("cta")}
          </Button>
        </FadeInView>
      </SectionContainer>
    </section>
  );
}
