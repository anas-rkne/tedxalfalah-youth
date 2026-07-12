import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  // localePrefix: "always" يعني كل الروابط تحتوي /en أو /ar دائماً،
  // بما فيها اللغة الافتراضية — هذا أوضح للمستخدم ومحركات البحث.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
