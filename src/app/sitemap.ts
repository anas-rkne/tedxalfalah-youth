import { MetadataRoute } from "next";

// TODO: replace with the real domain once connected (tedxalfalahyouth.com)
const BASE_URL = "https://www.tedxalfalahyouth.com";

const ROUTES = [
  "",
  "/speakers",
  "/team",
  "/venue",
  "/activations",
  "/apply",
  "/sponsors",
  "/tickets",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
