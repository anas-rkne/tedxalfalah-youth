import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always", // أو 'as-needed' حسب رغبتك
});

export type Locale = (typeof routing.locales)[number];