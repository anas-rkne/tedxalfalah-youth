import { getTranslations } from "next-intl/server";
import { getSessions } from "@/lib/data";
import HighlightsContent from "./HighlightsContent";

export default async function Highlights({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.highlights" });
  const sessions = await getSessions();
  const isScheduleReady = sessions.length > 0;

  if (!isScheduleReady) return null;

  return (
    <HighlightsContent
      isScheduleReady={isScheduleReady}
      mainHeading={t("mainHeading")}
      mainSubtitle={t("mainSubtitle")}
    />
  );
}