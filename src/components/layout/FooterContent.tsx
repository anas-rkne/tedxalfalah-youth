"use client";

import { Link } from "@/i18n/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import TrackingEyes from "@/components/ui/TrackingEyes";
import AnimatedSocialIcon from "@/components/ui/AnimatedSocialIcon";
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
  
  // ✅ الخصائص الجديدة التي ستمررها من ملف الترجمة
  licenseHeading: string;
  venueAddress: string;
  phoneNumber?: string;
  
  socialLinks?: SocialLink[];
  licenseNotice?: string;
}

function SocialLinkItem({ platform, url }: { platform: string; url: string }) {
  // ... (كما هو في الكود الخاص بك)
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
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={labels[platform as keyof typeof labels]} className="group flex items-center justify-center w-10 h-10 rounded-full border border-zinc-200 hover:border-[#e62b1e] hover:bg-[#e62b1e]/5 transition-all duration-300 active:scale-95">
      <span className="text-zinc-400 group-hover:text-[#e62b1e] transition-colors duration-300">
        {icons[platform as keyof typeof icons]}
      </span>
    </a>
  );
}

function QuickLinkItem({ label, href }: { label: string; href: string }) {
  // ... (كما هو في الكود الخاص بك)
  return (
    <li>
      <Link href={href} className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#e62b1e] transition-colors duration-200 py-1">
        <span className="w-0 h-px bg-[#e62b1e] group-hover:w-3 transition-all duration-300" />
        {label}
        <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      </Link>
    </li>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  // ... (كما هو في الكود الخاص بك)
  const shouldReduceMotion = useReducedMotion();
  const [count, setCount] = useState(shouldReduceMotion ? value : 0);
  useEffect(() => {
    if (shouldReduceMotion) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value, shouldReduceMotion]);
  return <span className="tabular-nums">{count}{suffix}</span>;
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
  // ✅ استقبال القيم الجديدة من الـ props
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
    <footer className="relative w-full overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* ... (CTA BANNER كما هو) ... */}
      <div className="relative py-16 sm:py-20 md:py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-800" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(230,43,30,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(230,43,30,0.5) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#e62b1e]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-[#e62b1e]/5 rounded-full blur-2xl" />

        <div className="container-padding relative z-10 max-w-7xl mx-auto text-center">

          <motion.div initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e62b1e] mb-6">
              <span className="w-8 h-px bg-[#e62b1e]" />{ctaLabel}<span className="w-8 h-px bg-[#e62b1e]" />
            </span>
          </motion.div>

          <ScrollReveal delay={0.05}>
            <div className="flex justify-center mb-6">
              <TrackingEyes size={50} className="mx-auto" />
            </div>
          </ScrollReveal>

          <motion.h2 initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            {joinUs}
          </motion.h2>
          <motion.p initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed px-4">
            {ctaDescription}
          </motion.p>

          <motion.div initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none">
            <AnimatedSlidingButton href="/apply" variant="primary" className="w-full sm:w-auto min-w-[160px] shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)]">
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
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #e62b1e 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="container-padding py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
              
              {/* 1. Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <motion.div initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-2xl font-black text-zinc-900 tracking-tight">TEDx</span>
                    <span className="text-lg font-bold text-zinc-500 tracking-tight">AlFalah</span>
                    <span className="text-lg font-bold text-[#e62b1e] tracking-tight">Youth</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-sm">{brandDescription}</p>
                  <div className="space-y-3 mb-6">
                    <a href={`mailto:${emailAddress}`} className="flex items-center gap-3 text-sm text-zinc-400 hover:text-[#e62b1e] transition-colors group"><Mail size={15} className="text-[#e62b1e] group-hover:scale-110 transition-transform" /><span>{emailAddress}</span></a>
                    {/* ✅ استخدام phoneNumber القادم من الـ props */}
                    {phoneNumber && (<a href={`tel:${phoneNumber}`} className="flex items-center gap-3 text-sm text-zinc-400 hover:text-[#e62b1e] transition-colors group"><Phone size={15} className="text-[#e62b1e] group-hover:scale-110 transition-transform" /><span>{phoneNumber}</span></a>)}
                    {/* ✅ استخدام venueAddress القادم من الـ props */}
                    <div className="flex items-start gap-3 text-sm text-zinc-400"><MapPin size={15} className="text-[#e62b1e] mt-0.5 shrink-0" /><span>{venueAddress}</span></div>
                  </div>
                  {socialLinks && socialLinks.length > 0 && (<div className="flex items-center gap-2">{socialLinks.map((social) => (<SocialLinkItem key={social.platform} platform={social.platform} url={social.url} />))}</div>)}
                </motion.div>
              </div>

              {/* 2. Quick Links */}
              <div><motion.div initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}><h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">{quickLinksHeading}</h3><ul className="space-y-1">{firstHalfLinks.map((link) => (<QuickLinkItem key={link.href} label={link.label} href={link.href} />))}</ul></motion.div></div>

              {/* 3. More Links */}
              <div><motion.div initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}><h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">{moreHeading}</h3><ul className="space-y-1">{secondHalfLinks.map((link) => (<QuickLinkItem key={link.href} label={link.label} href={link.href} />))}</ul></motion.div></div>

              {/* 4. License */}
              <div>
                <motion.div initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}>
                  {/* ✅ استبدال النص الثابت بـ licenseHeading القادم من الـ props */}
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
                    {licenseHeading}
                  </h3>
                  <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-lg font-black text-zinc-900">TEDx</span>
                      <span className="text-sm font-bold text-[#e62b1e]">AlFalah</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">{licenseNotice}</p>
                    <a href="https://www.ted.com/about/programs-initiatives/tedx-program" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#e62b1e] hover:underline font-medium">{isRTL ? "تعرّف على برنامج TEDx" : "Learn about TEDx"}<ExternalLink size={10} /></a>
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
      <div className="relative bg-zinc-900 border-t border-zinc-800">
        <div className="container-padding py-5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span>© {new Date().getFullYear()} TEDxAlFalah Youth</span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span>{copyright}</span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <Link href="/terms" className="hover:text-[#e62b1e] transition-colors underline underline-offset-2 decoration-zinc-700 hover:decoration-[#e62b1e]">{termsLink}</Link>
              </div>
              <button onClick={scrollToTop} className="group flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors">
                <span className="uppercase tracking-widest hidden sm:inline">{backToTop}</span>
                <div className="w-8 h-8 rounded-full border border-zinc-700 group-hover:border-[#e62b1e] group-hover:bg-[#e62b1e]/10 flex items-center justify-center transition-all duration-300">
                  <ArrowUpRight size={14} className={`${isRTL ? 'rotate-[-135deg]' : 'rotate-[-45deg]'} group-hover:rotate-0 transition-transform duration-300`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}