import { getTranslations } from "next-intl/server";
import ThemeContent from "./ThemeContent";

export default async function Theme() {
  const t = await getTranslations("home.theme");

  return <ThemeContent title={t("title")} body={t("body")} />;
}