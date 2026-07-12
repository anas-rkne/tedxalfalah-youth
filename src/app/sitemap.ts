import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

// TODO: replace with the real domain once connected (tedxalfalahyouth.com)
const BASE_URL = "https://www.tedxalfalahyouth.com";

const ROUTES = [
  "",
  "/speakers",
  "/team",
  "/venue",
  "/activations",
  "/schedule",
  "/apply",
  "/sponsors",
  "/tickets",
  "/faq",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${BASE_URL}/${l}${route}`])
        ),
      },
    }))
  );
}
