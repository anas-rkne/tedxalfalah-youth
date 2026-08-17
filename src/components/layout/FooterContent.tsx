"use client";

import { Link } from "@/i18n/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/SocialIcons";
import { Mail, ArrowUp, ArrowUpRight, MapPin, Phone, ExternalLink } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import SafeImage from "@/components/ui/SafeImage";

const SOCIAL_LINKS = [
  { platform: "instagram" as const, url: "https://www.instagram.com/tedxalfalahyouth" },
  { platform: "linkedin" as const, url: "https://www.linkedin.com/company/tedxalfalahyouth" },
  { platform: "x" as const, url: "https://x.com/tedxalfalahyouth" },
];

const EMAIL = "marhaba@tedxalfalahyouth.com";

const DOODLE_BG = {
  backgroundImage: "url('/images/footer-red-bg.svg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
} as const;

const DOODLE_BG_MOBILE = {
  backgroundImage: "url('/images/footer-red-bg.svg')",
  backgroundSize: "auto 690px",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
} as const;

function SocialLinkItem({ platform, url }: { platform: string; url: string }) {
  const icons = {
    instagram: <InstagramIcon size={16} />,
    linkedin: <LinkedinIcon size={16} />,
    x: <XIcon size={16} />,
  };
  const labels = {
    instagram: "Instagram",
    linkedin: "LinkedIn",
    x: "X (Twitter)",
  };
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={labels[platform as keyof typeof labels]}
      className="group flex items-center justify-center w-10 h-10 rounded-full border border-zinc-200 hover:border-tedx-red hover:bg-tedx-red/5 transition-all duration-300 active:scale-95"
    >
      <span className="text-zinc-400 group-hover:text-tedx-red transition-colors duration-300">
        {icons[platform as keyof typeof icons]}
      </span>
    </a>
  );
}

function QuickLinkItem({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-tedx-red transition-colors duration-200 py-1"
      >
        <span className="w-0 h-px bg-tedx-red group-hover:w-3 transition-all duration-300" />
        {label}
        <ArrowUpRight
          size={12}
          className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
        />
      </Link>
    </li>
  );
}

export default function FooterContent() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common.nav");
  const { isRTL } = useRTL();
  const shouldReduceMotion = useReducedMotion();

  const quickLinks = useMemo(() => [
    { label: tCommon("home"), href: "/" },
    { label: tCommon("team"), href: "/team" },
    { label: tCommon("apply"), href: "/apply" },
  ], [tCommon]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const midPoint = Math.ceil(quickLinks.length / 2);
  const firstHalfLinks = quickLinks.slice(0, midPoint);
  const secondHalfLinks = quickLinks.slice(midPoint);

  return (
    <footer id="global-footer" className="relative w-full overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* ═══════════════════════════════════════════════════════════════
          1. CTA BANNER — أحمر زاهٍ مع دودل، بدون أزرار
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full mt-0 mb-[15px] h-[220px] sm:h-[240px] md:h-[260px] overflow-hidden flex items-center justify-center bg-tedx-red"
        style={DOODLE_BG}
      >
        <div className="absolute inset-0 sm:hidden" style={DOODLE_BG_MOBILE} aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-8 flex flex-col items-center gap-2 md:gap-3">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              {t("ctaLabel")}
            </span>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={`${isRTL ? "font-arabic" : "font-alexandria"} text-6xl sm:text-7xl lg:text-8xl font-black text-white tracking-wide leading-none`}
          >
            {t("joinUs")}
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm md:text-base text-white/80 max-w-2xl mx-auto leading-snug"
          >
            <span className="block">{t("ctaDescriptionL1")}</span>
            <span className="block">{t("ctaDescriptionL2")}</span>
          </motion.p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. قسم الأزرار الأبيض — Apply Now / Get Tickets
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-white px-4">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-lg mx-auto py-12 md:py-14"
        >
          <AnimatedSlidingButton
            href="/apply"
            variant="primary"
            className="px-8 py-3 min-w-[180px]"
          >
            {t("applyButton")}
          </AnimatedSlidingButton>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. MAIN FOOTER — أبيض، 4 أعمدة
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-white border-t border-zinc-100">
        <div className="container-padding py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
              {/* 3.1 Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="mb-5">
                    <SafeImage
                      src="/images/logo-black.png"
                      alt="TEDxAlFalah Youth"
                      width={144}
                      height={48}
                      sizes="(max-width: 640px) 144px, 160px"
                      className="h-12 w-36 sm:h-14 sm:w-40 object-contain"
                    />
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-sm">
                    {t("brandDescription")}
                  </p>

                  {/* عناصر الاتصال مع الشريط الأحمر العمودي — اتجاه ثابت LTR كالإنكليزية */}
                  <div dir="ltr" className="border-l-4 border-tedx-red pl-3 space-y-2 mb-6">
                    <a
                      href={`mailto:${EMAIL}`}
                      className="flex items-center gap-3 text-sm text-zinc-600 hover:text-tedx-red transition-colors group"
                    >
                      <Mail
                        size={15}
                        className="text-tedx-red group-hover:scale-110 transition-transform"
                      />
                      <span>{EMAIL}</span>
                    </a>
                    {t("phoneNumber") && (
                      <a
                        href={`tel:${t("phoneNumber")}`}
                        className="flex items-center gap-3 text-sm text-zinc-600 hover:text-tedx-red transition-colors group"
                      >
                        <Phone
                          size={15}
                          className="text-tedx-red group-hover:scale-110 transition-transform"
                        />
                        <span>{t("phoneNumber")}</span>
                      </a>
                    )}
                    <div className="flex items-start gap-3 text-sm text-zinc-600">
                      <MapPin
                        size={15}
                        className="text-tedx-red mt-0.5 shrink-0"
                      />
                      <span>{t("venueAddress")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {SOCIAL_LINKS.map((social) => (
                      <SocialLinkItem
                        key={social.platform}
                        platform={social.platform}
                        url={social.url}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* 3.2 Quick Links */}
              <div>
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
                    {t("quickLinksHeading")}
                  </h3>
                  <ul className="space-y-1">
                    {firstHalfLinks.map((link) => (
                      <QuickLinkItem
                        key={link.href}
                        label={link.label}
                        href={link.href}
                      />
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* 3.3 More Links */}
              <div>
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
                    {t("moreHeading")}
                  </h3>
                  <ul className="space-y-1">
                    {secondHalfLinks.map((link) => (
                      <QuickLinkItem
                        key={link.href}
                        label={link.label}
                        href={link.href}
                      />
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* 3.4 License */}
              <div>
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
                    {t("licenseHeading")}
                  </h3>
                  <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                    <div className="mb-3">
                      <SafeImage
                        src="/images/logo-black.png"
                        alt="TEDxAlFalah Youth"
                        width={96}
                        height={32}
                        sizes="96px"
                        className="h-8 w-24 object-contain"
                      />
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {t("licenseNotice")}
                    </p>
                    <a
                      href="https://www.ted.com/about/programs-initiatives/tedx-program"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-tedx-red hover:underline font-medium"
                    >
                      {t("learnAboutTEDx")}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          4. BOTTOM BAR — أحمر مع دودل، نصوص بيضاء
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-tedx-red overflow-hidden">
        {/* نمط الدودل خفيف */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={DOODLE_BG}
        />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none sm:hidden"
          style={DOODLE_BG_MOBILE}
        />

        {/* خط علوي أبيض */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="container-padding py-5 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-white">
                <span>© {new Date().getFullYear()} TEDxAlFalah Youth</span>
                <span className="hidden sm:inline text-white/50">·</span>
                <span>{t("copyright")}</span>
              </div>
              <button
                onClick={scrollToTop}
                className="group flex items-center gap-2 text-xs text-white hover:text-white transition-colors"
              >
                <span className="uppercase tracking-widest hidden sm:inline">
                  {t("backToTop")}
                </span>
                <div className="w-9 h-9 rounded-full border border-white/50 group-hover:border-white group-hover:bg-white/15 transition-all duration-300 flex items-center justify-center">
                  <ArrowUp
                    size={16}
                    className="group-hover:-translate-y-0.5 transition-transform duration-300"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}