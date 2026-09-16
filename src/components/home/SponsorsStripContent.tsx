"use client";

import { useRef, useState, useEffect, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, Ticket, Calendar } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge";
import SafeImage from "@/components/ui/SafeImage";
import DarkCTASection from "@/components/shared/DarkCTASection";

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  tier: string;
  websiteUrl?: string;
}

interface SponsorsStripContentProps {
  heading: string;
  badgeLabel: string;
  introText: string;
  sponsors: Sponsor[];
  stat1Number: string;
  stat1Label: string;
  stat2Number: string;
  stat2Label: string;
  stat3Number: string;
  stat3Label: string;
  ctaHeading: string;
  ctaDescription: string;
  ctaLabel: string;
}

/* ═══════════════════════════════════════════
   SponsorLogoCard – بطاقة شعار موحّدة (مطابقة لصفحة الشركاء)
   ═══════════════════════════════════════════ */
const SponsorLogoCard = memo(function SponsorLogoCard({ sponsor }: { sponsor: Sponsor }) {
  const [isHovered, setIsHovered] = useState(false);

  const inner = (
    <div
      className="relative w-full aspect-[3/2] rounded-3xl bg-white border border-zinc-200/80 overflow-hidden flex flex-col items-center justify-center
        transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        hover:border-tedx-red/25 hover:shadow-[0_20px_50px_-20px_rgba(230,43,30,0.25)] hover:-translate-y-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(230,43,30,0.06), transparent 65%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #000 0.5px, transparent 0.5px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 flex items-center justify-center w-full h-full px-6 py-7">
        {sponsor.logoUrl ? (
          <SafeImage
            src={sponsor.logoUrl}
            alt={sponsor.name}
            fill
            unoptimized
            className="object-contain p-4 transition-all duration-500"
            sizes="(max-width: 640px) 160px, 220px"
          />
        ) : (
          <span className="text-lg font-bold text-zinc-400 uppercase tracking-[0.15em] text-center px-2">
            {sponsor.name}
          </span>
        )}
      </div>

      <motion.div
        className="absolute bottom-0 left-1/2 h-[2px] rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, #e62b1e, transparent)" }}
        initial={{ width: 0, x: "-50%" }}
        animate={{ width: isHovered ? 80 : 0, x: "-50%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );

  if (sponsor.websiteUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <a
          href={sponsor.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={sponsor.name}
          className="group block w-full h-full"
        >
          {inner}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {inner}
    </motion.div>
  );
});

/* ═══════════════════════════════════════════
   AnimatedStatItem – عداد متحرك (مستقل + memo)
   ═══════════════════════════════════════════ */
const AnimatedStatItem = memo(function AnimatedStatItem({
  number,
  label,
  delay,
  shouldReduceMotion,
  icon,
}: {
  number: string;
  label: string;
  delay: number;
  shouldReduceMotion: boolean | null;
  icon: React.ReactNode;
}) {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(number.replace(/\D/g, '')) || 0;
  const suffix = number.replace(/[0-9]/g, '');
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion || hasAnimated.current) {
      setCount(numericValue);
      return;
    }
    hasAnimated.current = true;
    const timeout = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setCount(numericValue);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [numericValue, delay, shouldReduceMotion]);

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      className="relative group text-center px-4 py-6"
    >
      <motion.div
        initial={shouldReduceMotion ? {} : { scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.2, type: "spring", stiffness: 200 }}
        className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-tedx-red/10 flex items-center justify-center text-tedx-red group-hover:bg-tedx-red group-hover:text-white transition-all duration-500"
      >
        {icon}
      </motion.div>

      <div className="relative">
        <span className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 tracking-[-0.04em] tabular-nums">
          {count}{suffix}
        </span>
        <div className="absolute inset-0 -z-10 blur-3xl bg-tedx-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <p className="text-sm md:text-base text-zinc-400 mt-3 font-medium tracking-wide uppercase">
        {label}
      </p>

      <motion.div
        initial={shouldReduceMotion ? {} : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: delay + 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="mt-4 h-0.5 w-12 mx-auto bg-gradient-to-r from-transparent via-tedx-red/40 to-transparent origin-center"
      />
    </motion.div>
  );
});

/* ═══════════════════════════════════════════
   المكون الرئيسي
   ═══════════════════════════════════════════ */
export default function SponsorsStripContent({
  heading,
  badgeLabel,
  introText,
  sponsors,
  stat1Number,
  stat1Label,
  stat2Number,
  stat2Label,
  stat3Number,
  stat3Label,
  ctaHeading,
  ctaDescription,
  ctaLabel,
}: SponsorsStripContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();

  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      {/* ═══════ HERO HEADER ═══════ */}
      <div className="relative pb-12 md:pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-4">
              <SectionBadge>{badgeLabel}</SectionBadge>
            </div>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="heading-h1 tracking-[-0.03em] leading-[1.1] mt-6 heading-margin"
          >
            {heading}
          </motion.h2>

          <motion.div
            initial={shouldReduceMotion ? {} : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center justify-center gap-3 origin-center"
          >
            <div className="h-px w-10 bg-zinc-200" />
            <div className="h-1 w-14 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
            <div className="h-px w-10 bg-zinc-200" />
          </motion.div>

          <motion.p
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-zinc-400 mt-8 text-lg font-light max-w-2xl mx-auto leading-relaxed"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {introText}
          </motion.p>
        </div>
      </div>

      {/* ═══════ شبكة الشعارات (ثابتة — بلا تكرار) ═══════ */}
      <div className="container-padding relative pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {sponsors.map((sponsor) => (
              <SponsorLogoCard key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ STATS SECTION ═══════ */}
      <div className="container-padding relative pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            <div className="relative rounded-[32px] bg-gradient-to-b from-white to-zinc-50/80 border border-zinc-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, #e62b1e 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-tedx-red/[0.03] blur-3xl rounded-full" />

              <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
                <AnimatedStatItem
                  number={stat1Number}
                  label={stat1Label}
                  delay={0.1}
                  shouldReduceMotion={shouldReduceMotion}
                  icon={<Users className="w-5 h-5" />}
                />
                <AnimatedStatItem
                  number={stat2Number}
                  label={stat2Label}
                  delay={0.25}
                  shouldReduceMotion={shouldReduceMotion}
                  icon={<Ticket className="w-5 h-5" />}
                />
                <AnimatedStatItem
                  number={stat3Number}
                  label={stat3Label}
                  delay={0.4}
                  shouldReduceMotion={shouldReduceMotion}
                  icon={<Calendar className="w-5 h-5" />}
                />
              </div>

              <motion.div
                initial={shouldReduceMotion ? {} : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-tedx-red/30 to-transparent origin-center"
              />
            </div>
            <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-b from-tedx-red/[0.02] to-transparent blur-2xl" />
          </motion.div>
        </div>
      </div>

      {/* ═══════ CTA SECTION (مشترك) ═══════ */}
      <DarkCTASection
        heading={ctaHeading}
        description={ctaDescription}
        primaryButton={{ href: "/#contact", label: ctaLabel }}
      />
    </section>
  );
}