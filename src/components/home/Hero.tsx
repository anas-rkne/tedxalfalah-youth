import { getTranslations } from "next-intl/server";
import HeroDynamicContent from "@/components/home/HeroDynamicContent";

export default async function Hero() {
  const t = await getTranslations("home.hero");

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center text-center overflow-hidden bg-background/60 backdrop-blur-xl">
      <HeroDynamicContent
        eventName={t("eventName")}
        tagline={t("tagline")}
        dateText={t("date")}
        venueText={t("venue")}
        scrollLabel={t("scrollLabel")}
        applyLabel={t("applyLabel")}
        ticketsLabel={t("ticketsLabel")}
      />
    </section>
  );
}