import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import FadeInView from "@/components/ui/FadeInView";
import AnimatedSocialIcon from "@/components/ui/AnimatedSocialIcon";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/SocialIcons";

export default function Footer() {
  const t = useTranslations("common.nav");
  const tFooter = useTranslations("footer");

  const QUICK_LINKS = [
    { label: t("home"), href: "/" },
    { label: t("speakers"), href: "/speakers" },
    { label: t("team"), href: "/team" },
    { label: t("venue"), href: "/venue" },
    { label: t("activations"), href: "/activations" },
    { label: t("schedule"), href: "/schedule" },
    { label: t("apply"), href: "/apply" },
    { label: t("sponsors"), href: "/sponsors" },
    { label: t("tickets"), href: "/tickets" },
    { label: t("faq"), href: "/faq" },
  ];

  return (
    <footer className="bg-tedx-black text-tedx-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 section-padding-sm grid grid-cols-1 md:grid-cols-3 gap-8">
        <FadeInView delay={0.05}>
          <div>
            <h3 className="font-bold text-lg mb-3">{tFooter("contactHeading")}</h3>
            <p className="text-sm text-gray-300">
              <a
                href="mailto:marhaba@tedxalfalahyouth.com"
                className="hover:text-tedx-red"
              >
                marhaba@tedxalfalahyouth.com
              </a>
            </p>
            <div className="flex gap-4 mt-4">
              <AnimatedSocialIcon href="#" ariaLabel="Instagram">
                <InstagramIcon size={20} />
              </AnimatedSocialIcon>
              <AnimatedSocialIcon href="#" ariaLabel="LinkedIn">
                <LinkedinIcon size={20} />
              </AnimatedSocialIcon>
              <AnimatedSocialIcon href="#" ariaLabel="X">
                <XIcon size={20} />
              </AnimatedSocialIcon>
            </div>
          </div>
        </FadeInView>

        <FadeInView delay={0.1}>
          <div>
            <h3 className="font-bold text-lg mb-3">{tFooter("quickLinksHeading")}</h3>
            <ul className="grid grid-cols-2 gap-y-2 text-sm text-gray-300">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-tedx-red">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </FadeInView>

        <FadeInView delay={0.15}>
          <div>
            <h3 className="font-bold text-lg mb-3">{tFooter("brandHeading")}</h3>
            <p className="text-sm text-gray-300">{tFooter("licenseNotice")}</p>
            <Link
              href="/terms"
              className="text-sm underline text-gray-300 hover:text-tedx-red block mt-2"
            >
              {tFooter("termsLink")}
            </Link>
          </div>
        </FadeInView>
      </div>

      <FadeInView delay={0.2}>
        <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} TEDxAlFalah Youth. {tFooter("copyright")}
        </div>
      </FadeInView>
    </footer>
  );
}
