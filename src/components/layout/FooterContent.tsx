"use client";

import { Link } from "@/i18n/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import TrackingEyes from "@/components/ui/TrackingEyes";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/SocialIcons";
import { Mail, ArrowUpRight, MapPin, Phone, ExternalLink } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

interface SocialLink {
  platform: "instagram" | "linkedin" | "x";
  url: string;
}

interface FooterContentProps {
  ctaLabel: string;
  joinUs: string;
  ctaDescription: string;
  applyButton: string;
  ticketsButton: string;
  brandDescription: string;
  emailAddress: string;
  quickLinksHeading: string;
  moreHeading: string;
  quickLinks: Array<{ label: string; href: string }>;
  copyright: string;
  termsLink: string;
  backToTop: string;
  licenseHeading: string;
  venueAddress: string;
  phoneNumber?: string;
  socialLinks?: SocialLink[];
  licenseNotice?: string;
}

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
      className="group flex items-center justify-center w-10 h-10 rounded-full border border-zinc-200 hover:border-[#e62b1e] hover:bg-[#e62b1e]/5 transition-all duration-300 active:scale-95"
    >
      <span className="text-zinc-400 group-hover:text-[#e62b1e] transition-colors duration-300">
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
        className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#e62b1e] transition-colors duration-200 py-1"
      >
        <span className="w-0 h-px bg-[#e62b1e] group-hover:w-3 transition-all duration-300" />
        {label}
        <ArrowUpRight
          size={12}
          className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
        />
      </Link>
    </li>
  );
}



export default function FooterContent({
  ctaLabel,
  joinUs,
  ctaDescription,
  applyButton,
  ticketsButton,
  brandDescription,
  emailAddress,
  quickLinksHeading,
  moreHeading,
  quickLinks,
  copyright,
  termsLink,
  backToTop,
  licenseHeading,
  venueAddress,
  phoneNumber,
  socialLinks,
  licenseNotice,
}: FooterContentProps) {
  const { isRTL } = useRTL();
  const shouldReduceMotion = useReducedMotion();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const midPoint = Math.ceil(quickLinks.length / 2);
  const firstHalfLinks = quickLinks.slice(0, midPoint);
  const secondHalfLinks = quickLinks.slice(midPoint);

  return (
    <footer id="global-footer" className="relative w-full overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* ═══════════════════════════════════════════════════════════════
          CTA BANNER — خلفية TEDx محسّنة
          ═══════════════════════════════════════════════════════════════ */}
<div className="relative py-16 sm:py-20 md:py-28 container-padding overflow-hidden">
  {/* ═══════════════════════════════════════════════════════════════
      ✅ خلفية TEDx — هوية قوية وجذابة
      ═══════════════════════════════════════════════════════════════ */}

  {/* 1. الخلفية الأساسية — أسود عميق TEDx */}
  <div className="absolute inset-0 bg-black" />
  <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-zinc-950" />

  {/* 2. نمط شبكة TEDx */}
  <div
    className="absolute inset-0 opacity-[0.04] pointer-events-none"
    style={{
      backgroundImage: `linear-gradient(rgba(230,43,30,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(230,43,30,0.6) 1px, transparent 1px)`,
      backgroundSize: "48px 48px",
    }}
  />

  {/* 3. ✅ كلمة TEDx كبيرة شفافة — هوية قوية */}
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
    <span
      className="text-[20rem] sm:text-[25rem] md:text-[30rem] lg:text-[35rem] font-black leading-none tracking-tighter"
      style={{
        color: "rgba(255,255,255,0.02)",
       textShadow: "0 0 120px rgba(230,43,30,0.08)"
      }}
    >
      TEDx
    </span>
  </div>

  {/* 4. ✅ حرف X ضخم منفصل — زخرفة إضافية */}
  <div className="absolute bottom-[-5%] right-[-5%] pointer-events-none select-none overflow-hidden">
    <span
      className="text-[15rem] sm:text-[20rem] md:text-[25rem] font-black leading-none"
      style={{
        color: "rgba(230,43,30,0.03)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      X
    </span>
  </div>

  {/* 5. دوائر حمراء كبيرة شفافة — شعار TEDx */}
  <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full border border-[#e62b1e]/10 pointer-events-none" />
  <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-[#e62b1e]/[0.03] blur-[60px] pointer-events-none" />

  <div className="absolute bottom-[15%] right-[8%] w-[250px] h-[250px] rounded-full border border-[#e62b1e]/8 pointer-events-none" />
  <div className="absolute bottom-[15%] right-[8%] w-[250px] h-[250px] rounded-full bg-[#e62b1e]/[0.02] blur-[50px] pointer-events-none" />

  <div className="absolute top-[40%] right-[15%] w-[120px] h-[120px] rounded-full border border-[#e62b1e]/6 pointer-events-none" />

  {/* 6. نقاط حمراء ساطعة — أفكار TEDx */}
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.2]"
    style={{
      backgroundImage: `radial-gradient(circle, rgba(230,43,30,0.5) 1.5px, transparent 1.5px)`,
      backgroundSize: "56px 56px",
    }}
  />

  {/* 7. خطوط مائلة حمراء خفيفة — طاقة وحركة */}
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.03]"
    style={{
      backgroundImage: `
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 80px,
          rgba(230,43,30,0.4) 80px,
          rgba(230,43,30,0.4) 81px
        )
      `,
    }}
  />

  {/* 8. خطوط مائلة معاكسة */}
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.02]"
    style={{
      backgroundImage: `
        repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 120px,
          rgba(230,43,30,0.3) 120px,
          rgba(230,43,30,0.3) 121px
        )
      `,
    }}
  />

  {/* 9. شرائح حمراء مائلة — ديناميكية */}
  <div className="absolute top-[18%] left-[-10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#e62b1e]/20 to-transparent rotate-[-8deg] pointer-events-none" />
  <div className="absolute bottom-[22%] right-[-10%] w-[45%] h-[1px] bg-gradient-to-r from-transparent via-[#e62b1e]/15 to-transparent rotate-[6deg] pointer-events-none" />

  {/* 10. مربعات ومثلثات حمراء — زخرفة هندسية */}
  <div className="absolute top-[22%] right-[18%] w-5 h-5 bg-[#e62b1e]/10 rotate-45 pointer-events-none" />
  <div className="absolute bottom-[28%] left-[12%] w-3 h-3 bg-[#e62b1e]/8 rotate-12 pointer-events-none" />
  <div className="absolute top-[48%] left-[6%] w-6 h-6 bg-[#e62b1e]/6 rotate-[30deg] pointer-events-none" />
  <div className="absolute bottom-[42%] right-[14%] w-4 h-4 bg-[#e62b1e]/9 rotate-[-15deg] pointer-events-none" />
  <div className="absolute top-[8%] right-[35%] w-2 h-2 rounded-full bg-[#e62b1e]/15 pointer-events-none" />
  <div className="absolute bottom-[8%] left-[30%] w-2.5 h-2.5 rounded-full bg-[#e62b1e]/12 pointer-events-none" />

  {/* ═══════════════════════════════════════════════════════════════
      التوهجات الموجودة (محفوظة)
      ═══════════════════════════════════════════════════════════════ */}

  {/* توهج مركزي علوي */}
  <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#e62b1e]/[0.09] rounded-full blur-[120px] pointer-events-none" />

  {/* توهج جانبي أيسر */}
  <div className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] bg-[#e62b1e]/[0.05] rounded-full blur-[100px] pointer-events-none" />

  {/* توهج سفلي يميني */}
  <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[300px] bg-[#e62b1e]/[0.06] rounded-full blur-[100px] pointer-events-none" />

  {/* تأثير Vignette */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

  {/* خط TEDx سفلي */}
  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e62b1e]/40 to-transparent" />

  {/* ═══════════════════════════════════════════════════════════════
      المحتوى — فوق كل شيء
      ═══════════════════════════════════════════════════════════════ */}
  <div className="container-padding relative z-10 max-w-7xl mx-auto text-center">
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e62b1e] mb-6">
        <span className="w-8 h-px bg-[#e62b1e]" />
        {ctaLabel}
        <span className="w-8 h-px bg-[#e62b1e]" />
      </span>
    </motion.div>

    <ScrollReveal delay={0.05}>
      <div className="flex justify-center mb-6">
        <TrackingEyes size={50} className="mx-auto" />
      </div>
    </ScrollReveal>

    <motion.h2
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6"
    >
      {joinUs}
    </motion.h2>
    <motion.p
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed px-4"
    >
      {ctaDescription}
    </motion.p>

    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none"
    >
      <AnimatedSlidingButton
        href="/apply"
        variant="primary"
        className="w-full sm:w-auto min-w-[160px] shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)]"
      >
        {applyButton}
      </AnimatedSlidingButton>

      <AnimatedSlidingButton
        href="/tickets"
        variant="primary"
        className="w-full sm:w-auto min-w-[160px] bg-black text-white border-black hover:bg-black/90 hover:border-black/90 shadow-sm"
      >
        {ticketsButton}
      </AnimatedSlidingButton>
    </motion.div>
  </div>
</div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN FOOTER
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-zinc-50 border-t border-zinc-100">
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #e62b1e 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container-padding py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
              {/* 1. Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-2xl font-black text-zinc-900 tracking-tight">
                      TEDx
                    </span>
                    <span className="text-lg font-bold text-zinc-500 tracking-tight">
                      AlFalah
                    </span>
                    <span className="text-lg font-bold text-[#e62b1e] tracking-tight">
                      Youth
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-sm">
                    {brandDescription}
                  </p>
                  <div className="space-y-3 mb-6">
                    <a
                      href={`mailto:${emailAddress}`}
                      className="flex items-center gap-3 text-sm text-zinc-400 hover:text-[#e62b1e] transition-colors group"
                    >
                      <Mail
                        size={15}
                        className="text-[#e62b1e] group-hover:scale-110 transition-transform"
                      />
                      <span>{emailAddress}</span>
                    </a>
                    {phoneNumber && (
                      <a
                        href={`tel:${phoneNumber}`}
                        className="flex items-center gap-3 text-sm text-zinc-400 hover:text-[#e62b1e] transition-colors group"
                      >
                        <Phone
                          size={15}
                          className="text-[#e62b1e] group-hover:scale-110 transition-transform"
                        />
                        <span>{phoneNumber}</span>
                      </a>
                    )}
                    <div className="flex items-start gap-3 text-sm text-zinc-400">
                      <MapPin
                        size={15}
                        className="text-[#e62b1e] mt-0.5 shrink-0"
                      />
                      <span>{venueAddress}</span>
                    </div>
                  </div>
                  {socialLinks && socialLinks.length > 0 && (
                    <div className="flex items-center gap-2">
                      {socialLinks.map((social) => (
                        <SocialLinkItem
                          key={social.platform}
                          platform={social.platform}
                          url={social.url}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* 2. Quick Links */}
              <div>
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
                    {quickLinksHeading}
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

              {/* 3. More Links */}
              <div>
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
                    {moreHeading}
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

              {/* 4. License */}
              <div>
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
                    {licenseHeading}
                  </h3>
                  <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-lg font-black text-zinc-900">
                        TEDx
                      </span>
                      <span className="text-sm font-bold text-[#e62b1e]">
                        AlFalah
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {licenseNotice}
                    </p>
                    <a
                      href="https://www.ted.com/about/programs-initiatives/tedx-program"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#e62b1e] hover:underline font-medium"
                    >
                      {isRTL ? "تعرّف على برنامج TEDx" : "Learn about TEDx"}
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
          BOTTOM BAR
          ═══════════════════════════════════════════════════════════════ */}
  {/* ═══════════════════════════════════════════════════════════════
    BOTTOM BAR — بنفس هوية TEDx الداكنة
    ═══════════════════════════════════════════════════════════════ */}
<div className="relative bg-black border-t border-zinc-800/60 overflow-hidden">
  {/* نمط شبكة TEDx خفيف */}
  <div
    className="absolute inset-0 opacity-[0.03] pointer-events-none"
    style={{
      backgroundImage: `linear-gradient(rgba(230,43,30,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(230,43,30,0.5) 1px, transparent 1px)`,
      backgroundSize: "48px 48px",
    }}
  />
  
  {/* توهج أحمر علوي خفيف — متسق مع باقي الأقسام */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[80px] bg-tedx-red/10 rounded-full blur-[80px] pointer-events-none" />

  {/* توهج أحمر سفلي خفيف */}
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[60px] bg-tedx-red/8 rounded-full blur-[60px] pointer-events-none" />

  {/* خط TEDx علوي */}
  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e62b1e]/30 to-transparent" />

  <div className="container-padding py-5 relative z-10">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="text-zinc-400">© {new Date().getFullYear()} TEDxAlFalah Youth</span>
          <span className="hidden sm:inline text-zinc-700">·</span>
          <span className="text-zinc-500">{copyright}</span>
          <span className="hidden sm:inline text-zinc-700">·</span>
          <Link
            href="/terms"
            className="text-zinc-400 hover:text-[#e62b1e] transition-colors underline underline-offset-2 decoration-zinc-700 hover:decoration-[#e62b1e]"
          >
            {termsLink}
          </Link>
        </div>
        <button
          onClick={scrollToTop}
          className="group flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          <span className="uppercase tracking-widest hidden sm:inline">
            {backToTop}
          </span>
          <div className="w-8 h-8 rounded-full border border-zinc-700 group-hover:border-[#e62b1e] group-hover:bg-[#e62b1e]/10 group-hover:shadow-[0_0_15px_rgba(230,43,30,0.2)] flex items-center justify-center transition-all duration-300">
            <ArrowUpRight
              size={14}
              className={`${isRTL ? "rotate-[-135deg]" : "rotate-[-45deg]"} group-hover:rotate-0 transition-transform duration-300`}
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