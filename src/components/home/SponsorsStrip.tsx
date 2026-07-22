import { getTranslations } from "next-intl/server";
import { getSponsors } from "@/lib/data";
import SponsorsStripContent, { Sponsor } from "./SponsorsStripContent";

// بيانات ثابتة مؤقتة (تم تحديد نوعها بدقة)
const sponsorsData: Sponsor[] = [
  { id: "1", name: "Skoll", logoUrl: "/images/Skoll_logo.png", tier: "Platinum" },
  { id: "2", name: "Logitech", logoUrl: "/images/logitech_logo.png", tier: "Gold" },
  { id: "3", name: "JetBlue", logoUrl: "/images/JetBlueLogo.png", tier: "Silver" },
  { id: "4", name: "Infosys", logoUrl: "/images/infosys_logo.jpg", tier: "Community" },
  { id: "5", name: "Gates", logoUrl: "/images/gates_logo_2.jpg", tier: "Community" },
];

export default async function SponsorsStrip() {
  const t = await getTranslations("home.sponsorsStrip");
  // const sponsors = await getSponsors(); // استخدم هذا في الإنتاج إذا كانت قاعدة البيانات جاهزة

  return (
    <SponsorsStripContent
      heading={t("heading")}
      badgeLabel={t("badgeLabel")}
      introText={t("introText")}
      sponsors={sponsorsData} // ✅ الآن TypeScript راضٍ تماماً
      
      // نصوص الإحصائيات
      stat1Number={`+${sponsorsData.length}`}
      stat1Label={t("stat1Label")}
      stat2Number="100%"
      stat2Label={t("stat2Label")}
      stat3Number="2026"
      stat3Label={t("stat3Label")}
      
      // نصوص قسم CTA
      ctaHeading={t("ctaHeading")}
      ctaDescription={t("ctaDescription")}
      ctaLabel={t("ctaLabel")}
    />
  );
}