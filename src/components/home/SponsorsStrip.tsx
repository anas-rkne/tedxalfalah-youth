import { getTranslations } from "next-intl/server";
import { getSponsors } from "@/lib/data";
import SponsorsStripContent from "./SponsorsStripContent";
const sponsorsData = [
  { id: "1", name: "Skoll", logoUrl: "/images/Skoll_logo.png" },
  { id: "2", name: "Logitech", logoUrl: "/images/logitech_logo.png" },
  { id: "3", name: "JetBlue", logoUrl: "/images/JetBlueLogo.png" },
  { id: "4", name: "Infosys", logoUrl: "/images/infosys_logo.jpg" },
  { id: "5", name: "Gates", logoUrl: "/images/gates_logo_2.jpg" },
];

export default async function SponsorsStrip() {
  const t = await getTranslations("home.sponsorsStrip");
  const sponsors = await getSponsors();

  return (
    <SponsorsStripContent
      heading={t("heading")}
      sponsors={sponsorsData}
    />
  );
}