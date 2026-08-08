import { getTranslations } from "next-intl/server";
import { getEventInfo } from "@/lib/data";
import AboutContent from "./AboutContent";

export default async function About({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.about" });
  const tHero = await getTranslations({ locale, namespace: "home.hero" });
  const eventInfo = await getEventInfo();

  return (
    <AboutContent
      heading={t("heading")}
      body={t("body")}
      licenseNote={t("licenseNote")}
      // ✅ تمرير النصوص الإضافية التي كانت مكتوبة يدوياً في السابق
      badgeLabel={t("badge")}
      mapAlt={t("mapAlt")}
      venueName={eventInfo?.venue ?? null}
      valuesLabels={{
        platform: t("valuesPlatform"),
        community: t("valuesCommunity"),
        ideas: t("valuesIdeas"),
      }}
      ctaHeading={t("ctaHeading")}
      ctaDescription={t("ctaDescription")}
      applyLabel={tHero("applyLabel")} // استخدم نفس مفتاح الترجمة الموجود في الهيرو
      ticketsLabel={tHero("ticketsLabel")} // استخدم نفس مفتاح الترجمة الموجود في الهيرو
    />
  );
}