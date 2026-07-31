"use client";

import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import JsonLd from "./JsonLd";
import { breadcrumbListSchema } from "@/lib/json-ld";

const PATH_LABELS: Record<string, string> = {
  "/": "home",
  "/speakers": "speakers",
  "/team": "team",
  "/venue": "venue",
  "/activations": "activations",
  "/schedule": "schedule",
  "/apply": "apply",
  "/sponsors": "sponsors",
  "/tickets": "tickets",
  "/contact": "contact",
  "/gallery": "gallery",
  "/prepare": "prepare",
  "/terms": "terms",
  "/faq": "faq",
  "/thank-you": "thank-you",
};

export default function BreadcrumbJsonLd() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common.nav");
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://www.tedxalfalahyouth.com";
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  const segments = pathname.split("/").filter(Boolean);
  const items = [{ name: t("home"), url: `${baseUrl}${localePrefix}/` }];

  let current = "";
  for (const seg of segments) {
    current += `/${seg}`;
    const labelKey = PATH_LABELS[current];
    const label = labelKey ? t(labelKey) : seg;
    items.push({
      name: label,
      url: `${baseUrl}${localePrefix}${current}`,
    });
  }

  return <JsonLd data={breadcrumbListSchema(items)} />;
}
