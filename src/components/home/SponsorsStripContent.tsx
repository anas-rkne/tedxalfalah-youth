"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Sparkles, ArrowUpRight, Handshake, Award, Star, Users, Ticket, Calendar } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier?: "Platinum" | "Gold" | "Silver" | "Community";
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

/* ═══════════════════════════════════════════════════════════════
   مكون شارة التصنيف (تم تحديث الألوان)
   ═══════════════════════════════════════════════════════════════ */
function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    Platinum: "bg-gradient-to-r from-slate-700 to-slate-900 text-white",
    Gold: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white",
    Silver: "bg-gradient-to-r from-zinc-300 to-zinc-400 text-zinc-900",
    Community: "bg-muted text-muted-foreground",
  };

  const icons: Record<string, React.ReactNode> = {
    Platinum: <Award className="w-3 h-3" />,
    Gold: <Star className="w-3 h-3" />,
    Silver: <Star className="w-3 h-3" />,
    Community: <Handshake className="w-3 h-3" />,
  };

  return (
    <span
      className={`absolute top-3 ${tier === "Community" ? "left-3" : "right-3"} 
        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase
        ${styles[tier] || styles.Community}`}
    >
      {icons[tier]}
      {tier}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون بطاقة شريك
   ═══════════════════════════════════════════════════════════════ */
function SponsorCard({
  sponsor,
  index,
  shouldReduceMotion,
}: {
  sponsor: Sponsor;
  index: number;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="group relative"
    >
      <div
        className="relative w-full aspect-[4/3] bg-card rounded-2xl border border-border 
          shadow-sm
          hover:shadow-[0_12px_40px_-12px_rgba(230,43,30,0.15)]
          hover:border-tedx-red/30
          hover:-translate-y-1.5
          transition-all duration-500 ease-out
          overflow-hidden flex flex-col items-center justify-center p-6"
      >
        {/* شارة التصنيف */}
        {sponsor.tier && <TierBadge tier={sponsor.tier} />}

        {/* الشعار */}
        <div className="relative w-full h-16 flex items-center justify-center">
          <Image
            src={sponsor.logoUrl}
            alt={sponsor.name}
            fill
            className="object-contain filter grayscale group-hover:grayscale-0 
              opacity-60 group-hover:opacity-100
              transition-all duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>

        {/* اسم الشريك — يظهر عند hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 
          transition-transform duration-500 ease-out">
          <p className="text-center text-xs font-semibold text-foreground truncate">
            {sponsor.name}
          </p>
        </div>

        {/* خط TEDx سفلي */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-3/4 
          h-[2px] bg-gradient-to-r from-transparent via-tedx-red to-transparent
          transition-all duration-500 ease-out" />

        {/* توهج خلفي */}
        <div className="absolute inset-0 bg-gradient-to-t from-tedx-red/[0.02] to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون إحصائية TEDx — نسخة متحركة وحيوية (تم التحسين)
   ═══════════════════════════════════════════════════════════════ */
function StatItem({
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

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(numericValue);
      return;
    }
    const timer = setTimeout(() => {
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
    return () => clearTimeout(timer);
  }, [numericValue, delay, shouldReduceMotion]);

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      className="relative group text-center px-4 py-6"
    >
      {/* أيقونة متحركة */}
      <motion.div
        initial={shouldReduceMotion ? {} : { scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.2, type: "spring", stiffness: 200 }}
        className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#e62b1e]/10 flex items-center justify-center text-[#e62b1e] group-hover:bg-[#e62b1e] group-hover:text-white transition-all duration-500"
      >
        {icon}
      </motion.div>

      {/* الرقم مع تأثير العدّ */}
      <div className="relative">
        <span className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 tracking-[-0.04em] tabular-nums">
          {count}{suffix}
        </span>
        {/* توهج خلفي للرقم */}
        <div className="absolute inset-0 -z-10 blur-3xl bg-[#e62b1e]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* التسمية */}
      <p className="text-sm md:text-base text-zinc-400 mt-3 font-medium tracking-wide uppercase">
        {label}
      </p>

      {/* خط زخرفي سفلي */}
      <motion.div
        initial={shouldReduceMotion ? {} : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: delay + 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="mt-4 h-0.5 w-12 mx-auto bg-gradient-to-r from-transparent via-[#e62b1e]/40 to-transparent origin-center"
      />
    </motion.div>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);

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

  const tiers = ["Platinum", "Gold", "Silver", "Community"] as const;
  const sponsorsByTier = tiers.reduce(
    (acc, tier) => {
      acc[tier] = sponsors.filter((s) => s.tier === tier || (!s.tier && tier === "Community"));
      return acc;
    },
    {} as Record<string, Sponsor[]>
  );

  return (
    <section
      ref={containerRef}
      className="section-padding relative bg-background overflow-hidden"
    >
      {/* ═══════════════════════════════════════════════════════════════
          HERO HEADER
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative pb-12 md:pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 max-w-5xl mx-auto text-center">
          
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-4">
              <SectionBadge>
                {badgeLabel}
              </SectionBadge>
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
            <div className="h-px w-10 bg-border" />
            <div className="h-1 w-14 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
            <div className="h-px w-10 bg-border" />
          </motion.div>

          <motion.p
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground mt-8 text-lg font-light max-w-2xl mx-auto leading-relaxed"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {introText}
          </motion.p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SPONSORS GRID
          ═══════════════════════════════════════════════════════════════ */}
      <div className="container-padding relative pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto">
          {sponsorsByTier.Platinum.length > 0 && (
            <div className="mb-16">
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground px-4 py-1.5 bg-muted border border-border rounded-full">
                  Platinum Partners
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {sponsorsByTier.Platinum.map((sponsor, i) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} index={i} shouldReduceMotion={shouldReduceMotion} />
                ))}
              </div>
            </div>
          )}

          {sponsorsByTier.Gold.length > 0 && (
            <div className="mb-16">
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-amber-600 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  Gold Partners
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {sponsorsByTier.Gold.map((sponsor, i) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} index={i} shouldReduceMotion={shouldReduceMotion} />
                ))}
              </div>
            </div>
          )}

          {sponsorsByTier.Silver.length > 0 && (
            <div className="mb-16">
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground px-4 py-1.5 bg-muted border border-border rounded-full">
                  Silver Partners
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {sponsorsByTier.Silver.map((sponsor, i) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} index={i} shouldReduceMotion={shouldReduceMotion} />
                ))}
              </div>
            </div>
          )}

          {sponsorsByTier.Community.length > 0 && (
            <div>
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground px-4 py-1.5 bg-muted border border-border rounded-full">
                  Community Partners
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {sponsorsByTier.Community.map((sponsor, i) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} index={i} shouldReduceMotion={shouldReduceMotion} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STATS SECTION — تم التحسين بالكامل
          ═══════════════════════════════════════════════════════════════ */}
      <div className="container-padding relative pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            {/* الخلفية الرئيسية */}
            <div className="relative rounded-[32px] bg-gradient-to-b from-white to-zinc-50/80 border border-zinc-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
              
              {/* نمط نقاط زخرفي */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, #e62b1e 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* توهج أحمر علوي */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#e62b1e]/[0.03] blur-3xl rounded-full" />

              {/* شبكة الإحصائيات */}
              <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
                <StatItem 
                  number={stat1Number} 
                  label={stat1Label} 
                  delay={0.1} 
                  shouldReduceMotion={shouldReduceMotion}
                  icon={<Users className="w-5 h-5" />}
                />
                <StatItem 
                  number={stat2Number} 
                  label={stat2Label} 
                  delay={0.25} 
                  shouldReduceMotion={shouldReduceMotion}
                  icon={<Ticket className="w-5 h-5" />}
                />
                <StatItem 
                  number={stat3Number} 
                  label={stat3Label} 
                  delay={0.4} 
                  shouldReduceMotion={shouldReduceMotion}
                  icon={<Calendar className="w-5 h-5" />}
                />
              </div>

              {/* خط سفلي متحرك */}
              <motion.div
                initial={shouldReduceMotion ? {} : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#e62b1e]/30 to-transparent origin-center"
              />
            </div>

            {/* ظل خارجي ناعم */}
            <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-b from-[#e62b1e]/[0.02] to-transparent blur-2xl" />
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="container-padding relative pb-24 md:pb-32">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="p-10 md:p-14 rounded-[32px] bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-tedx-red/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-tedx-red/5 rounded-full blur-2xl" />

            <div className="relative z-10">
              <Handshake className="w-10 h-10 text-tedx-red mx-auto mb-4" />
              <h2 className="heading-h2 mb-4 text-white">{ctaHeading}</h2>
              <p className="text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">{ctaDescription}</p>
              
              <div className="flex justify-center">
                <AnimatedSlidingButton href="/contact" variant="primary" className="min-w-[160px] shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)]">
                  {ctaLabel}
                </AnimatedSlidingButton>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* نمط نقاط زخرفي */}
      <div
        className="h-16 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #e62b1e 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </section>
  );
}