import { getTranslations } from "next-intl/server";
import HighlightsContent from "./HighlightsContent";

export default async function Highlights() {
  const t = await getTranslations("home.highlights");
  const tCommon = await getTranslations("common"); // لأزرار مثل "قدم الآن"

  const STATS = [
    { label: t("statsSpeakers"), targetValue: 12, suffix: "+" },
    { label: t("statsAttendees"), targetValue: 400, suffix: "+" },
    { label: t("statsActivations"), targetValue: 5, suffix: "+" },
  ];

  return (
    <HighlightsContent
      // النصوص الرئيسية
      mainHeading={t("mainHeading")}
      mainSubtitle={t("mainSubtitle")}
      
      // نصوص البطاقة الأولى (المكان)
      venueTitle={t("venueTitle")}
      venueTeaser={t("venueTeaser")}
      venueBadgeText={t("venueBadgeText")}
      venueLinkText={t("venueLinkText")}
      
      // نصوص البطاقة الثانية (الفعاليات)
      activationsTitle={t("activationsTitle")}
      activationsTeaser={t("activationsTeaser")}
      activationsBadgeText={t("activationsBadgeText")}
      activationsLinkText={t("activationsLinkText")}
      
      // نصوص بطاقة الإحصائيات
      statsBadgeText={t("statsBadgeText")}
      statsTitle={t("statsTitle")}
      statsDescription={t("statsDescription")}
      
      // نصوص بطاقة التاريخ
      dateBadgeText={t("dateBadgeText")}
      dateNumber={t("dateNumber")}
      dateMonthYear={t("dateMonthYear")}
      dateDescription={t("dateDescription")}
      
      // نصوص بطاقة "كن متحدثاً"
      speakerBadgeText={t("speakerBadgeText")}
      speakerTitle={t("speakerTitle")}
      speakerDescription={t("speakerDescription")}
      speakerCta={tCommon("applyNow")} // استخدام ترجمة شائعة أو إضافة مفتاح جديد
      
      // البيانات الإحصائية
      stats={STATS}
    />
  );
}