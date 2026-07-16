import { getTranslations } from "next-intl/server";
import HighlightsContent from "./HighlightsContent";

export default async function Highlights() {
  const t = await getTranslations("home.highlights");

  const STATS = [
    { label: t("statsSpeakers"), targetValue: 12, suffix: "+" },
    { label: t("statsAttendees"), targetValue: 400, suffix: "+" },
    { label: t("statsActivations"), targetValue: 5, suffix: "+" },
  ];

  return (
    <HighlightsContent
      venueTitle={t("venueTitle")}
      venueTeaser={t("venueTeaser")}
      activationsTitle={t("activationsTitle")}
      activationsTeaser={t("activationsTeaser")}
      stats={STATS}
    />
  );
}