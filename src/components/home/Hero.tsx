import { getTranslations } from "next-intl/server";
import HeroDynamicContent from "@/components/home/HeroDynamicContent";

export default async function Hero() {
  const t = await getTranslations("home.hero");

  return (
    <HeroDynamicContent
      eventName={t("eventName")}
      tagline={t("tagline")}
      dateText={t("date")}
      venueText={t("venue")}
      scrollLabel={t("scrollLabel")}
      applyLabel={t("applyLabel")}
      ticketsLabel={t("ticketsLabel")}
      badgeLabel={t("badgeLabel")}
      eventYear={t("eventYear")}
    />
  );
}