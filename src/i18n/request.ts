import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let requested = await requestLocale;

  // في تمريرات العرض الثابتة (static optimization / prerender) قد يكون
  // requestLocale غير معرف — نقرأ اللغة من الرأس الذي يضعه middleware.
  if (!requested) {
    try {
      const h = await headers();
      requested = h.get("x-next-intl-locale") ?? undefined;
    } catch {
      // لا يوجد request scope (مثال: prerender أثناء البناء) — نترك القيمة undefined
    }
  }

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
