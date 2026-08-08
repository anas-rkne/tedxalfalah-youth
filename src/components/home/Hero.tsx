import { getTranslations } from "next-intl/server";
import HeroDynamicContent from "@/components/home/HeroDynamicContent";

export default async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return (
    <HeroDynamicContent
      tagline={t("tagline")}
      dateText={t("date")}
      venueText={t("venue")}
      applyLabel={t("applyLabel")}
      saveSeatLabel={t("saveSeatLabel")}
      badgeLabel={t("badgeLabel")}
      eventYear={t("eventYear")}
      intro={t("intro")}
      saveTheDateLabel={t("saveTheDateLabel")}
    />
  );
}
