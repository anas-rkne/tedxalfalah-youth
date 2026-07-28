import { getTranslations } from "next-intl/server";
import HeroDynamicContent from "@/components/home/HeroDynamicContent";

export default async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return (
    <HeroDynamicContent
      eventName={t("eventName")}
      tagline={t("tagline")}
      subtitle={t("subtitle")}
      dateText={t("date")}
      venueText={t("venue")}
      scrollLabel={t("scrollLabel")}
      applyLabel={t("applyLabel")}
      ticketsLabel={t("ticketsLabel")}
      badgeLabel={t("badgeLabel")}
      eventYear={t("eventYear")}
      countdownHeadline={t("countdownHeadline")}
    />
  );
}