import { getTranslations, getLocale } from "next-intl/server";
import FooterContent from "./FooterContent";

export default async function Footer() {
  const locale = await getLocale();
  const tCommon = await getTranslations({ locale, namespace: "common.nav" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  const SOCIAL_LINKS = [
    { platform: "instagram" as const, url: "https://www.instagram.com/tedxalfalahyouth" },
    { platform: "linkedin" as const, url: "https://www.linkedin.com/company/tedxalfalahyouth" },
    { platform: "x" as const, url: "https://x.com/tedxalfalahyouth" },
  ];

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
      ctaLabel={tFooter("ctaLabel")}
      joinUs={tFooter("joinUs")}
      ctaDescription={tFooter("ctaDescription")}
      applyButton={tFooter("applyButton")}
      ticketsButton={tFooter("ticketsButton")}
      brandDescription={tFooter("brandDescription")}
      emailAddress="marhaba@tedxalfalahyouth.com"
      quickLinksHeading={tFooter("quickLinksHeading")}
      moreHeading={tFooter("moreHeading")}
      quickLinks={QUICK_LINKS}
      copyright={tFooter("copyright")}
      termsLink={tFooter("termsLink")}
      backToTop={tFooter("backToTop")}
      licenseNotice={tFooter("licenseNotice")}
      socialLinks={SOCIAL_LINKS}
      licenseHeading={tFooter("licenseHeading")}
      venueAddress={tFooter("venueAddress")}
      phoneNumber={tFooter("phoneNumber")}
    />
  );
}