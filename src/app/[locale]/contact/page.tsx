import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import ContactForm from "@/components/home/ContactForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.contact" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home.contactForm" });

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
      leftImageSrc="/images/طفل 2.svg" // يمكنك تغيير المسار إذا لم تكن الصور موجودة
      rightImageSrc="/images/طفلة 2.svg"
    />
  );
}