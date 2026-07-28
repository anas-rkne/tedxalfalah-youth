import { createClient } from "@sanity/client";

export const isSanityConfigured = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
);

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2025-01-01",
      useCdn: true, // ✅ مهم جداً: تفعيل CDN لتسريع الاتصال في الإنتاج
      timeout: 60000, // ✅ رفع المهلة إلى 60 ثانية لمنع انتهاء الوقت
    })
  : null;