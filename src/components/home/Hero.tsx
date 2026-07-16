import { getTranslations } from "next-intl/server";
import HeroDynamicContent from "@/components/home/HeroDynamicContent";

export default async function Hero() {
  const t = await getTranslations("home.hero");

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center text-center overflow-hidden bg-background/60 backdrop-blur-xl">
      <HeroDynamicContent
        title={t("title")}
        subtitle={t("subtitle")}
        scrollLabel={t("scroll")}
        applyLabel={t("applyNow")}
        ticketsLabel={t("getTickets")}
      />
    </section>
  );
}
