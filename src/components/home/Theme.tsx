import { getTranslations } from "next-intl/server";
import ThemeContent from "./ThemeContent";

export default async function Theme() {
  const t = await getTranslations("home.theme");
  const tHero = await getTranslations("home.hero"); // لمشاركة نصوص الأزرار

  return (
    <ThemeContent
      title={t("title")}
      body={t("body")}
      // ✅ تمرير جميع النصوص الإضافية التي كانت مكتوبة يدوياً
      badgeLabel={t("badgeLabel") || "Our Theme"}
      statSpeakersLabel={t("statSpeakers") || "Speakers"}
      statSeatsLabel={t("statSeats") || "Seats"}
      statDayLabel={t("statDay") || "Inspiring Day"}
      beliefsHeading={t("beliefsHeading") || "What We Believe"}
      valuesHeading={t("valuesHeading") || "Our TEDx Values"}
      // تمرير بيانات البطاقات الثلاثة
      value1Title={t("value1Title") || "Ideas Deserve a Stage"}
      value1Desc={t("value1Desc") || "Every idea, no matter how small, deserves to be heard and shared with the world."}
      value2Title={t("value2Title") || "Youth are the Future"}
      value2Desc={t("value2Desc") || "We believe in the power of youth and their ability to create real change."}
      value3Title={t("value3Title") || "Diversity Fuels Creativity"}
      value3Desc={t("value3Desc") || "Different backgrounds and experiences create deeper ideas and stronger impact."}
      ctaHeading={t("ctaHeading") || "Be Part of the Event"}
      ctaDescription={t("ctaDescription") || "Join us on a journey to explore inspiring ideas and create unforgettable memories."}
      // نصوص الأزرار (مستوردة من الهيرو لتكون متطابقة)
      applyLabel={tHero("applyLabel")}
      ticketsLabel={tHero("ticketsLabel")}
    />
  );
}