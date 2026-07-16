import { getTranslations } from "next-intl/server";
import { getSpeakers } from "@/lib/data";
import SpeakersStage from "./SpeakersStage";

export default async function SpeakersPreview() {
  const t = await getTranslations("home.speakersPreview");
  const allSpeakers = await getSpeakers();
  
  // تحويل البيانات لتطابق الواجهة الجديدة
  const speakers = allSpeakers.slice(0, 4).map((s: any) => ({
    id: s._id || s.id || Math.random().toString(),
    name: s.name || "Speaker Name",
    role: s.role || s.title || "Guest Speaker",
    bio: s.bio || s.shortDescription || "",
    imageUrl: s.image || s.photo || null,
    socialLinks: s.socialLinks || { twitter: '#', instagram: '#', linkedin: '#' }
  }));

  return (
    <SpeakersStage
      heading={t("heading")}
      subtitle="تعرف على الأصوات التي تقف خلف TEDxAlFalah Youth."
      speakers={speakers}
      seeAllLabel={t("seeAll")}
      seeAllHref="/speakers"
    />
  );
}