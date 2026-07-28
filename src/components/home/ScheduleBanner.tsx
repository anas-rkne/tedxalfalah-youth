import { getTranslations } from "next-intl/server";
import ScheduleBannerContent from "./ScheduleBannerContent";

export default async function ScheduleBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.scheduleBanner" });

  return (
    <ScheduleBannerContent
      badgeLabel={t("badge")}
      title={t("title")}
      description={t("description")}
      ctaLabel={t("cta")}
    />
  );
}
