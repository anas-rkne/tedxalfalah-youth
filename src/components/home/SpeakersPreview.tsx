import { getTranslations } from "next-intl/server";
import { getSpeakers, getEventInfo } from "@/lib/data";
import SpeakersStage from "./SpeakersStage";

export default async function SpeakersPreview({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.speakersPreview" });
  const [eventInfo, allSpeakers] = await Promise.all([
    getEventInfo(),
    getSpeakers(),
  ]);

  if (!eventInfo?.showSpeakers || allSpeakers.length === 0) return null;

const speakers = allSpeakers.slice(0, 4).map((s) => ({
  id: s.id,
  name: s.name,
  role: s.shortDescriptor || s.talkTitle || "",
  bio: s.bio && !s.bio.includes("PLACEHOLDER") ? s.bio : t("bioFallback"),
  imageUrl: s.imageUrl || null,
  socialLinks: s.socialLinks || {},
}));

  return (
    <SpeakersStage
      heading={t("newHeading")}
      subtitle={t("newSubtitle")}
      badgeLabel={t("badgeLabel")}
      speakers={speakers}
      seeAllLabel={t("seeAll")}
      seeAllHref="/speakers"
    />
  );
}