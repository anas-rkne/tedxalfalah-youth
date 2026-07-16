import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/ui/ScrollReveal";
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
    <footer className="relative w-full bg-background/70 backdrop-blur-xl mt-auto py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-4">
        {/* Social icons */}
        <div className="flex items-center gap-4">
          <AnimatedSocialIcon href="#" ariaLabel="Instagram">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-[inset_0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow">
              <InstagramIcon size={18} className="text-gray-700" />
            </div>
          </AnimatedSocialIcon>
          <AnimatedSocialIcon href="#" ariaLabel="LinkedIn">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-[inset_0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow">
              <LinkedinIcon size={18} className="text-gray-700" />
            </div>
          </AnimatedSocialIcon>
          <AnimatedSocialIcon href="#" ariaLabel="X">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-[inset_0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow">
              <XIcon size={18} className="text-gray-700" />
            </div>
          </AnimatedSocialIcon>
        </div>

        {/* Decorative "Join Us!" divider */}
        <div className="flex w-full items-center justify-center gap-4">
          <div className="h-px flex-1 bg-gray-300 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full border border-gray-300 bg-white" />
          </div>
          <span className="font-serif text-4xl text-center font-bold tracking-tight text-gray-800 sm:text-5xl px-2">
            {tFooter("joinUs")}
          </span>
          <div className="h-px flex-1 bg-gray-300 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full border border-gray-300 bg-white" />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-8">
          <ScrollReveal>
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-800">{tFooter("contactHeading")}</h3>
              <p className="text-sm text-gray-500">
                <a href="mailto:marhaba@tedxalfalahyouth.com" className="hover:text-red-600 transition-colors">
                  marhaba@tedxalfalahyouth.com
                </a>
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-800">{tFooter("quickLinksHeading")}</h3>
              <ul className="grid grid-cols-2 gap-y-2 text-sm text-gray-500">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-red-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-800">{tFooter("brandHeading")}</h3>
              <p className="text-sm text-gray-500">{tFooter("licenseNotice")}</p>
              <Link href="/terms" className="text-sm underline text-gray-500 hover:text-red-600 transition-colors block mt-2">
                {tFooter("termsLink")}
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom bar */}
        <div className="w-full border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} TEDxAlFalah Youth. {tFooter("copyright")}
        </div>
      </div>
    </footer>
  );
}
