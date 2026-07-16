"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // تحديد اللغة المقابلة (التي سنتحول إليها)
  const nextLocale = locale === "en" ? "ar" : "en";

  function switchTo() {
    router.replace(
      // @ts-expect-error
      { pathname, params },
      { locale: nextLocale }
    );
  }

  return (
    <motion.button
      onClick={switchTo}
      className="flex items-center justify-center rounded-full border border-gray-200 bg-white/90 px-4 py-1.5 text-sm font-semibold text-black transition-all duration-300 hover:border-red-600 hover:shadow-sm dark:border-gray-700 dark:bg-black/30 dark:text-white"
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      aria-label={`Switch to ${nextLocale === "en" ? "English" : "Arabic"}`}
    >
      {nextLocale.toUpperCase()}
    </motion.button>
  );
}