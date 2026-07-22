import { getTranslations } from "next-intl/server";
import { getSpeakers } from "@/lib/data";
import SpeakersStage from "./SpeakersStage";

export default async function SpeakersPreview() {
  const t = await getTranslations("home.speakersPreview");
  const allSpeakers = await getSpeakers();
  
  // (1) إنشاء بيانات افتراضية (Placeholders) جميلة لملء الفراغ إذا لم توجد بيانات كافية
  const FALLBACK_SPEAKERS = [
    { id: 'fallback-1', name: 'Speakers Coming Soon', role: 'Inspiring Voice', bio: 'We are curating amazing speakers. Stay tuned!', imageUrl: null, socialLinks: {} },
    { id: 'fallback-2', name: 'Speakers Coming Soon', role: 'Inspiring Voice', bio: 'We are curating amazing speakers. Stay tuned!', imageUrl: null, socialLinks: {} },
    { id: 'fallback-3', name: 'Speakers Coming Soon', role: 'Inspiring Voice', bio: 'We are curating amazing speakers. Stay tuned!', imageUrl: null, socialLinks: {} },
    { id: 'fallback-4', name: 'Speakers Coming Soon', role: 'Inspiring Voice', bio: 'We are curating amazing speakers. Stay tuned!', imageUrl: null, socialLinks: {} },
  ];

  // (2) تحويل البيانات، مع استخدام الـ fallback في حال وجود خطأ
  const rawSpeakers = (allSpeakers && allSpeakers.length > 0) ? allSpeakers : FALLBACK_SPEAKERS;
  
// ... باقي الكود ...

const speakers = rawSpeakers.slice(0, 4).map((s: any) => ({
  id: s._id || s.id || Math.random().toString(),
  name: s.name || "Speaker Name",
  role: s.role || s.title || "Guest Speaker",
  // ✅ تحسين: إذا كان النص يحتوي على "PLACEHOLDER"، تجاهله واستخدم الترجمة الافتراضية
  bio: (s.bio && !s.bio.includes('PLACEHOLDER')) ? s.bio : t("bioFallback"),
  imageUrl: s.image || s.photo || null,
  socialLinks: s.socialLinks || { twitter: '#', instagram: '#', linkedin: '#' }
}));

// ... باقي الكود ...

  // (4) تمرير كل النصوص اللازمة من السيرفر للعميل
  return (
    <SpeakersStage
      heading={t("heading")}
      subtitle={t("subtitle")}
      badgeLabel={t("badgeLabel")}
      speakers={speakers}
      seeAllLabel={t("seeAll")}
      seeAllHref="/speakers"
    />
  );
}