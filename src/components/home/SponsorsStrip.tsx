import { getTranslations } from "next-intl/server";
import { getSponsors } from "@/lib/data";
import SponsorsStripContent from "./SponsorsStripContent";

export default async function SponsorsStrip({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.sponsorsStrip" });
  const sponsors = await getSponsors();

  return (
    <SponsorsStripContent
      heading={t("heading")}
      badgeLabel={t("badgeLabel")}
      introText={t("introText")}
      sponsors={sponsors}
      
      // نصوص الإحصائيات
      stat1Number={`+${sponsors.length}`}
      stat1Label={t("stat1Label")}
      stat2Number="100%"
      stat2Label={t("stat2Label")}
      stat3Number={t("stat3Number")}
      stat3Label={t("stat3Label")}
      
      // نصوص قسم CTA
      ctaHeading={t("ctaHeading")}
      ctaDescription={t("ctaDescription")}
      ctaLabel={t("ctaLabel")}
    />
  );
}