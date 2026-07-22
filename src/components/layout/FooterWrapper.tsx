import { getTranslations } from "next-intl/server";
import FooterContent from "./FooterContent";

export default async function Footer() {
  const tCommon = await getTranslations("common.nav");
  const tFooter = await getTranslations("footer");

  // تجميع الروابط السريعة في الخادم
  const QUICK_LINKS = [
    { label: tCommon("home"), href: "/" },
    { label: tCommon("speakers"), href: "/speakers" },
    { label: tCommon("team"), href: "/team" },
    { label: tCommon("venue"), href: "/venue" },
    { label: tCommon("activations"), href: "/activations" },
    { label: tCommon("schedule"), href: "/schedule" },
    { label: tCommon("apply"), href: "/apply" },
    { label: tCommon("sponsors"), href: "/sponsors" },
    { label: tCommon("tickets"), href: "/tickets" },
    { label: tCommon("faq"), href: "/faq" },
  ];

  return (
    <FooterContent
      // نصوص قسم CTA
      ctaLabel={tFooter("ctaLabel")}
      joinUs={tFooter("joinUs")}
      ctaDescription={tFooter("ctaDescription")}
      applyButton={tFooter("applyButton")}
      ticketsButton={tFooter("ticketsButton")}
      
      // نصوص قسم العلامة التجارية
      brandDescription={tFooter("brandDescription")}
      emailAddress="marhaba@tedxalfalahyouth.com"
      
      // نصوص الروابط السريعة
      quickLinksHeading={tFooter("quickLinksHeading")}
      moreHeading={tFooter("moreHeading")}
      quickLinks={QUICK_LINKS}
      
      // نصوص الشريط السفلي
      copyright={tFooter("copyright")}
      termsLink={tFooter("termsLink")}
      backToTop={tFooter("backToTop")}
      licenseNotice={tFooter("licenseNotice")}

      // ✅ إضافة الخصائص الجديدة هنا
      licenseHeading={tFooter("licenseHeading")}
      venueAddress={tFooter("venueAddress")}
      phoneNumber={tFooter("phoneNumber")}
    />
  );
}