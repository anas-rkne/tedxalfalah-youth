import { getTranslations } from "next-intl/server";
import HeroDynamicContent from "@/components/home/HeroDynamicContent";

function formatEventDate(dateStr: string | undefined, locale: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString(locale === "ar" ? "ar-AE" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default async function Hero({
  locale,
  eventDate,
}: {
  locale: string;
  eventDate?: string | null;
}) {
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return (
    <HeroDynamicContent
      tagline={t("tagline")}
      dateText={formatEventDate(eventDate ?? undefined, locale) ?? t("date")}
      venueText={t("venue")}
      countdownTarget={eventDate ? `${eventDate}T09:00:00+04:00` : undefined}
      applyLabel={t("applyLabel")}
      badgeLabel={t("badgeLabel")}
      eventYear={t("eventYear")}
      intro={t("intro")}
      saveTheDateLabel={t("saveTheDateLabel")}
    />
  );
}