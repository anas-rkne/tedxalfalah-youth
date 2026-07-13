import { useLocale } from "next-intl";

export function useRTL() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return { isRTL, dir: isRTL ? "rtl" : "ltr" as const };
}
