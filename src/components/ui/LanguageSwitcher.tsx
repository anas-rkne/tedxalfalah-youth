"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const shouldReduceMotion = useReducedMotion();

  const nextLocale = locale === "en" ? "ar" : "en";

  const switchTo = useCallback(() => {
    router.replace(
      // @ts-expect-error - التوافق مع أنواع next-intl
      { pathname, params },
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
      aria-label={`Switch to ${nextLocale === "en" ? "English" : "Arabic"}`}
    >
      {nextLocale.toUpperCase()}
    </motion.button>
  );
}