import { getTranslations } from "next-intl/server";
import AboutContent from "./AboutContent";

export default async function About() {
  const t = await getTranslations("home.about");
  const tHero = await getTranslations("home.hero"); // لاستخدام نصوص الأزرار المتطابقة

  return (
    <AboutContent
      heading={t("heading")}
      body={t("body")}
      licenseNote={t("licenseNote")}
      // ✅ تمرير النصوص الإضافية التي كانت مكتوبة يدوياً في السابق
      badgeLabel={t("badge") || "About The Event"} 
      valuesLabels={{
        platform: t("valuesPlatform") || "منصة عالمية",
        community: t("valuesCommunity") || "مجتمع شبابي",
        ideas: t("valuesIdeas") || "أفكار ملهمة",
      }}
      // ✅ تمرير نصوص الأزرار والـ CTA (يمكنك استخدام مفتاح خاص بها في about، أو مشاركتها)
      ctaHeading={t("ctaHeading") || "كن جزءاً من الحركة"}
      ctaDescription={t("ctaDescription") || "انضم إلينا واكتشف كيف يمكنك المساهمة في صنع مستقبل مليء بالأفكار الملهمة."}
      applyLabel={tHero("applyLabel")} // استخدم نفس مفتاح الترجمة الموجود في الهيرو
      ticketsLabel={tHero("ticketsLabel")} // استخدم نفس مفتاح الترجمة الموجود في الهيرو
    />
  );
}