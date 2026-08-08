import { getTranslations } from "next-intl/server";
import ThemeContent from "./ThemeContent";

export default async function Theme({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.theme" });

  return (
    <ThemeContent
      title={t("title")}
      body={t("body")}
      badgeLabel={t("badgeLabel") || "Our Theme"}
      statSpeakersLabel={t("statSpeakers") || "Speakers"}
      statSeatsLabel={t("statSeats") || "Seats"}
      statDayLabel={t("statDay") || "Inspiring Day"}
      leftImageSrc="/images/طفل 2.svg"
      rightImageSrc="/images/طفلة 2.svg"
    />
  );
}