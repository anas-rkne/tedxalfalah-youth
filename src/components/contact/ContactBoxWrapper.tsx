import { getTranslations } from "next-intl/server";
import ContactBox from "./ContactBox";

export default async function ContactBoxWrapper({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.contactBox" });

  return (
    <ContactBox
      heading={t("heading")}
      badgeLabel={t("badge")}
      intro={t("intro")}
      emailLabel="marhaba@tedxalfalahyouth.com"
      namePlaceholder={t("namePlaceholder")}
      emailPlaceholder={t("emailPlaceholder")}
      messagePlaceholder={t("messagePlaceholder")}
      submitLabel={t("submit")}
      submittingLabel={t("submitting")}
      errorGeneric={t("errorGeneric")}
      nameRequired={t("nameRequired")}
      emailInvalid={t("emailInvalid")}
      messageMinLength={t("messageMinLength")}
    />
  );
}
