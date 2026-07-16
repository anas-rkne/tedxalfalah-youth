import { getTranslations } from "next-intl/server";
import AboutContent from "./AboutContent";

export default async function About() {
  const t = await getTranslations("home.about");

  return (
    <AboutContent
      heading={t("heading")}
      body={t("body")}
      licenseNote={t("licenseNote")}
    />
  );
}