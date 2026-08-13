"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("common");

  const nextLocale = locale === "en" ? "ar" : "en";

  const switchTo = useCallback(() => {
    const { locale: _, ...paramsWithoutLocale } = params as Record<string, string>;
    router.replace(
      { pathname, params: paramsWithoutLocale } as Parameters<typeof router.replace>[0],
      { locale: nextLocale }
    );
  }, [router, pathname, params, nextLocale]);

  return (
    <motion.button
      type="button"
      onClick={switchTo}
      className="flex items-center justify-center rounded-full border border-gray-200 bg-white/90 px-4 py-1.5 text-sm font-semibold text-black transition-all duration-300 hover:border-red-600 hover:shadow-sm dark:border-gray-700 dark:bg-black/30 dark:text-white"
      style={{ direction: "ltr" }}   // ✅ النص يبقى من اليسار حتى في الوضع العربي
      whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
      aria-label={t(nextLocale === "en" ? "ui.switchToEnglish" : "ui.switchToArabic")}
    >
      {nextLocale.toUpperCase()}
    </motion.button>
  );
}