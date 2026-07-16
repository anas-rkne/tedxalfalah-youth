import { getTranslations } from "next-intl/server";
import { getSponsors } from "@/lib/data";
import SponsorsStripContent from "./SponsorsStripContent";

export default async function SponsorsStrip() {
  const t = await getTranslations("home.sponsorsStrip");
  const sponsors = await getSponsors();

  return (
    <SponsorsStripContent
      heading={t("heading")}
      sponsors={sponsors}
    />
  );
}