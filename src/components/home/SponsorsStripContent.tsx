"use client";

import { useRef, useState, useEffect, useCallback, memo } from "react";
import { motion, useReducedMotion, useAnimationFrame } from "framer-motion";
import { Handshake, Users, Ticket, Calendar } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge";
import SafeImage from "@/components/ui/SafeImage";
import DarkCTASection from "@/components/shared/DarkCTASection";

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier?: "Platinum" | "Gold" | "Silver" | "Community" | "Supporter";
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
        className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#e62b1e]/10 flex items-center justify-center text-[#e62b1e] group-hover:bg-[#e62b1e] group-hover:text-white transition-all duration-500"
      >
        {icon}
      </motion.div>

      <div className="relative">
        <span className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 tracking-[-0.04em] tabular-nums">
          {count}{suffix}
        </span>
        <div className="absolute inset-0 -z-10 blur-3xl bg-[#e62b1e]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <p className="text-sm md:text-base text-zinc-400 mt-3 font-medium tracking-wide uppercase">
        {label}
      </p>

      <motion.div
        initial={shouldReduceMotion ? {} : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: delay + 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="mt-4 h-0.5 w-12 mx-auto bg-gradient-to-r from-transparent via-[#e62b1e]/40 to-transparent origin-center"
      />
    </motion.div>
  );
});

/* ═══════════════════════════════════════════
   SponsorMarquee – SafeImage + memo
   ═══════════════════════════════════════════ */
const SponsorMarquee = memo(function SponsorMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const baseVelocity = useRef(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const xPosition = useRef(0);

  const tripleSponsors = [...sponsors, ...sponsors, ...sponsors];

  const getSetWidth = useCallback(() => {
    if (!containerRef.current) return 0;
    const items = containerRef.current.querySelectorAll('.marquee-item');
    if (items.length === 0) return 0;
    return Array.from(items)
      .slice(0, sponsors.length)
      .reduce((acc, item) => acc + (item as HTMLElement).offsetWidth + 64, 0);
  }, [sponsors.length]);

  useAnimationFrame((_, delta) => {
    if (shouldReduceMotion || isHovered || !containerRef.current) return;
    const setWidth = getSetWidth();
    if (setWidth === 0) return;
    const moveBy = (baseVelocity.current * delta) / 16;
    xPosition.current -= moveBy;
    if (Math.abs(xPosition.current) >= setWidth) {
      xPosition.current = 0;
    }
    containerRef.current.style.transform = `translateX(${xPosition.current}px)`;
  });

  if (sponsors.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden border-y border-zinc-100 py-8 md:py-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        ref={containerRef}
        className="flex items-center gap-16 md:gap-20 w-max"
        style={{ willChange: 'transform' }}
      >
        {tripleSponsors.map((sponsor, index) => (
          <div
            key={`${sponsor.id}-${index}`}
            className="marquee-item relative w-32 md:w-40 h-16 md:h-20 flex-shrink-0 flex items-center justify-center group/logo"
          >
            {sponsor.logoUrl ? (
              <SafeImage
                src={sponsor.logoUrl}
                alt={sponsor.name}
                fill
                unoptimized
                className="object-contain filter grayscale opacity-60 group-hover/logo:grayscale-0 group-hover/logo:opacity-100 transition-all duration-300"
                sizes="160px"
              />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">
                {sponsor.name?.charAt(0) || "?"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
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
    return (
      <section className="section-padding flex min-h-[40vh] items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-light">No sponsors yet.</p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      {/* ═══════ HERO HEADER ═══════ */}
      <div className="relative pb-12 md:pb-16">
        {/* خلفية متوهجة (مطابقة لجميع الأقسام) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#e62b1e]/5 blur-3xl" />
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
            <div className="h-1 w-14 bg-gradient-to-r from-[#e62b1e] to-red-400 rounded-full" />
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

      {/* ═══════ SPONSORS MARQUEE ═══════ */}
      <div className="container-padding relative pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto">
          <SponsorMarquee sponsors={sponsors} />
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
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#e62b1e]/[0.03] blur-3xl rounded-full" />

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
                className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#e62b1e]/30 to-transparent origin-center"
              />
            </div>
            <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-b from-[#e62b1e]/[0.02] to-transparent blur-2xl" />
          </motion.div>
        </div>
      </div>

      {/* ═══════ CTA SECTION (مشترك) ═══════ */}
      <DarkCTASection
        heading={ctaHeading}
        description={ctaDescription}
        primaryButton={{ href: "/contact", label: ctaLabel }}
  
      />


    </section>
  );
}