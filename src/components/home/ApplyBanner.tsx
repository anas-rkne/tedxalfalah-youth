import { getTranslations } from "next-intl/server";
import ApplyBannerContent from "./ApplyBannerContent";

// TODO: replace with real application deadline once confirmed by client
const APPLICATION_DEADLINE_LABEL = "September 30, 2026";

export default async function ApplyBanner() {
  const t = await getTranslations("home.applyBanner");

  return (
    <ApplyBannerContent
      text={t("text", { date: APPLICATION_DEADLINE_LABEL })}
      cta={t("cta")}
    />
  );
}