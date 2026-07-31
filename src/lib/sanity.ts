import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

export const isSanityConfigured = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
);

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2025-01-01",
      useCdn: true,
      timeout: 60000,
    })
  : null;

const builder = sanityClient ? createImageUrlBuilder(sanityClient) : null;

export function urlFor(source: unknown) {
  if (!source || !builder) return null;
  return builder.image(source);
}
