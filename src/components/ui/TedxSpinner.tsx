import { useTranslations } from "next-intl";

export default function TedxSpinner() {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col items-center justify-center gap-4" role="status" aria-label={t("loading")}>
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-gray-500 uppercase tracking-widest">
        {t("loading")}
      </p>
    </div>
  );
}
