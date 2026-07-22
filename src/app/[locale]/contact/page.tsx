import { getTranslations } from "next-intl/server";
import ContactForm from "@/components/home/ContactForm";

export default async function ContactPage() {
  const t = await getTranslations("home.contactForm");

  return (
    <ContactForm
      heading={t("heading")}
      badgeLabel={t("badge")}
      intro={t("intro")}
      emailLabel="marhaba@tedxalfalahyouth.com" // يمكنك جعلها key في الترجمة إذا أردت
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
      leftImageSrc="/images/boy-lap.jpg" // يمكنك تغيير المسار إذا لم تكن الصور موجودة
      rightImageSrc="/images/girl-lap.jpg"
    />
  );
}