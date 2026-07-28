import { getTranslations } from "next-intl/server";
import ContactForm from "./ContactForm";

export default async function ContactFormWrapper({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.contactForm" });

  return (
    <ContactForm
      heading={t("heading")}
      badgeLabel={t("badge")}
      intro={t("intro")}
      emailLabel="marhaba@tedxalfalahyouth.com"
      namePlaceholder={t("namePlaceholder")}
      emailPlaceholder={t("emailPlaceholder")}
      subjectLabel={t("subjectLabel")}
      subjectGeneral={t("subjectGeneral")}
      subjectSpeaking={t("subjectSpeaking")}
      subjectSponsorship={t("subjectSponsorship")}
      subjectVolunteering={t("subjectVolunteering")}
      subjectMedia={t("subjectMedia")}
      messagePlaceholder={t("messagePlaceholder")}
      submitLabel={t("submit")}
      submittingLabel={t("submitting")}
      errorGeneric={t("errorGeneric")}
      nameRequired={t("nameRequired")}
      emailInvalid={t("emailInvalid")}
      messageMinLength={t("messageMinLength")}
      leftImageSrc="/images/طفل 2.svg"
      rightImageSrc="/images/طفلة 2.svg"
    />
  );
}
