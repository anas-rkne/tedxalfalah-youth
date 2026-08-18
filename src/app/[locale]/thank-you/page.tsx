import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import ThankYouContent from "@/components/thankyou/ThankYouContent";
import { SITE_URL } from "@/lib/constants";

const VALID_TYPES = ["contact", "apply", "partner", "tickets"] as const;
type ThankYouType = (typeof VALID_TYPES)[number];

function isValidType(value: string | undefined): value is ThankYouType {
  return Boolean(value && (VALID_TYPES as readonly string[]).includes(value));
}

interface ThankYouPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ThankYouPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { type } = await searchParams;
  const key = isValidType(type) ? type : "default";
  const t = await getTranslations({ locale, namespace: `thankYou.${key}.meta` });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `${SITE_URL}/${locale}/thank-you` },
  };
}

const ctaConfig: Record<string, { href: string }> = {
  contact: { href: "/" },
  apply: { href: "/" },
  partner: { href: "/" },
  tickets: { href: "/" },
  default: { href: "/" },
};

export default async function ThankYouPage({
  params,
  searchParams,
}: ThankYouPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { type } = await searchParams;
  const key = isValidType(type) ? type : "default";

  const tc = await getTranslations({ locale, namespace: "thankYou.common" });
  const t = await getTranslations({ locale, namespace: `thankYou.${key}` });
  const { href } = ctaConfig[key] || ctaConfig.default;
  const timelineStages = tc.raw("timeline.stages") as {
    date: string;
    title: string;
  }[];

  return (
    <ThankYouContent
      headerSubtitle={tc("headerSubtitle")}
      stepper1={tc("stepper1")}
      stepper2={tc("stepper2")}
      stepper3={tc("stepper3")}
      verticalLabel={tc("verticalLabel")}
      footerHashtag={tc("footerHashtag")}
      footerDate={tc("footerDate")}
      footerContact={tc("footerContact")}
      showTimeline={key === "apply" || key === "tickets"}
      timelineButton={tc("timeline.button")}
      timelineTitle={tc("timeline.title")}
      timelineSubtitle={tc("timeline.subtitle")}
      timelineStages={timelineStages}
      eyebrow={t("eyebrow")}
      title={t("title")}
      body={t("body")}
      stat1={t("stat1")}
      stat2={t("stat2")}
      stat3={t("stat3")}
      cta={t("cta")}
      ctaHref={href}
    />
  );
}
