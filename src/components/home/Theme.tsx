import { getTranslations } from "next-intl/server";
import ThemeContent from "./ThemeContent";

export default async function Theme({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.theme" });
  const tHero = await getTranslations({ locale, namespace: "home.hero" });

  return (
    <ThemeContent
      title={t("title")}
      body={t("body")}
      badgeLabel={t("badgeLabel") || "Our Theme"}
      statSpeakersLabel={t("statSpeakers") || "Speakers"}
      statSeatsLabel={t("statSeats") || "Seats"}
      statDayLabel={t("statDay") || "Inspiring Day"}
      beliefsHeading={t("beliefsHeading") || "What We Believe"}
      valuesHeading={t("valuesHeading") || "Our TEDx Values"}
      value1Title={t("value1Title") || "Ideas Deserve a Stage"}
      value1Desc={t("value1Desc") || "Every idea, no matter how small, deserves to be heard and shared with the world."}
      value2Title={t("value2Title") || "Youth are the Future"}
      value2Desc={t("value2Desc") || "We believe in the power of youth and their ability to create real change."}
      value3Title={t("value3Title") || "Diversity Fuels Creativity"}
      value3Desc={t("value3Desc") || "Different backgrounds and experiences create deeper ideas and stronger impact."}
      ctaHeading={t("ctaHeading") || "Be Part of the Event"}
      ctaDescription={t("ctaDescription") || "Join us on a journey to explore inspiring ideas and create unforgettable memories."}
      applyLabel={tHero("applyLabel")}
      ticketsLabel={tHero("ticketsLabel")}
      
      // ✅ هنا تقوم بإضافة مسارات الصور
      leftImageSrc="/images/طفل 2.svg"   // ضع مسار الصورة اليسرى هنا
      rightImageSrc="/images/طفلة 2.svg" // ضع مسار الصورة اليمنى هنا
    />
  );
}