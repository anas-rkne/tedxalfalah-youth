"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchTo(nextLocale: string) {
    router.replace(
      // @ts-expect-error -- pathname قد يحتوي معاملات ديناميكية غير مستخدمة هنا حالياً
      { pathname, params },
      { locale: nextLocale }
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm font-medium border border-gray-300 rounded overflow-hidden">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchTo(loc)}
          className={`px-2.5 py-1 transition-colors ${
            locale === loc
              ? "bg-tedx-red text-tedx-white"
              : "text-tedx-black hover:bg-tedx-gray-light"
          }`}
          aria-current={locale === loc}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
