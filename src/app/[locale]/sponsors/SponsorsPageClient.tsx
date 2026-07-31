"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Sponsor } from "@/lib/types";
import SafeImage from "@/components/ui/SafeImage";
import Modal from "@/components/ui/Modal";
import PartnerInquiryForm from "@/components/sponsors/PartnerInquiryForm";

/* ═══════════════════════════════════════════════════════════════
   مكون بطاقة شعار – يدعم العربية والألوان الموحدة
   ═══════════════════════════════════════════════════════════════ */
function SponsorCard({
  sponsor,
  index,
  tierLabel,
  isArabic,
}: {
  sponsor: Sponsor;
  index: number;
  tierLabel: string;
  isArabic: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // تكوين الأبعاد والألوان حسب التصنيف (جميعها بدرجات #e62b1e)
  const tierConfig = {
    Platinum: {
      size: "col-span-2 row-span-2",
      height: "h-48 sm:h-56",
      badgeClass: "bg-tedx-red/10 text-tedx-red border-tedx-red/20",
    },
    Gold: {
      size: "col-span-1 row-span-1",
      height: "h-32 sm:h-36",
      badgeClass: "bg-tedx-red/5 text-tedx-red border-tedx-red/10",
    },
    Silver: {
      size: "col-span-1 row-span-1",
      height: "h-32 sm:h-36",
      badgeClass: "bg-tedx-red/5 text-tedx-red/80 border-tedx-red/10",
    },
    Supporter: {
      size: "col-span-1 row-span-1",
      height: "h-28 sm:h-32",
      badgeClass: "bg-zinc-100 text-zinc-500 border-zinc-200",
    },
  };

  const config = tierConfig[sponsor.tier as keyof typeof tierConfig] || tierConfig.Supporter;

  return (
    <motion.div
      className={`${config.size}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <a
        href={sponsor.websiteUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block w-full h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`relative w-full ${config.height} rounded-2xl bg-white
            border border-zinc-200/80
            shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]
            flex flex-col items-center justify-center gap-3
            transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
            overflow-hidden
            hover:border-tedx-red/20 
            hover:shadow-[0_12px_40px_-12px_rgba(230,43,30,0.15)]
            hover:-translate-y-1`}
        >
          {/* توهج خلفي عند hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "radial-gradient(circle at 50% 30%, rgba(230,43,30,0.05), transparent 60%)",
            }}
          />

          {/* شارة التصنيف */}
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${config.badgeClass}`}>
            {tierLabel}
          </div>

          {/* شعار الداعم */}
          <div className="relative z-10 flex items-center justify-center w-full px-8 flex-1 min-h-0">
            {sponsor.logoUrl ? (
              <SafeImage
                src={sponsor.logoUrl}
                alt={sponsor.name}
                width={200}
                height={120}
                unoptimized
                className="object-contain max-w-full max-h-full"
              />
            ) : (
              <span
                className={`font-bold text-zinc-300 uppercase tracking-[0.15em] ${
                  sponsor.tier === "Platinum" ? "text-xl" : "text-base"
                }`}
              >
                {sponsor.name.substring(0, 4)}
              </span>
            )}
          </div>

          {/* اسم الشريك (يعرض العربية أو الإنجليزية حسب اللغة) */}
          <div className="relative z-10 text-center w-full px-4">
            <span
              className={`text-zinc-500 group-hover:text-zinc-700 transition-colors duration-300 block truncate ${
                sponsor.tier === "Platinum" ? "text-sm sm:text-base font-semibold" : "text-xs sm:text-sm"
              } ${isArabic ? "font-arabic" : ""}`}
            >
              {sponsor.name}
            </span>
          </div>

          {/* خط TEDx سفلي يظهر عند hover */}
          <motion.div
            className="absolute bottom-0 left-1/2 h-[2px] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #e62b1e, transparent)" }}
            initial={{ width: 0, x: "-50%" }}
            animate={{ width: isHovered ? 80 : 0, x: "-50%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </a>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   المكون الرئيسي
   ═══════════════════════════════════════════════════════════════ */
interface SponsorsPageClientProps {
  sponsors: Sponsor[];
}

export default function SponsorsPageClient({ sponsors }: SponsorsPageClientProps) {
  const t = useTranslations("page.sponsors");
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const backgroundY = useTransform(smoothProgress, [0, 1], ["0%", "15%"]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.5]);
  const titleY = useTransform(smoothProgress, [0, 0.15], [60, 0]);

  const platinum = sponsors.filter((s) => s.tier === "Platinum");
  const gold = sponsors.filter((s) => s.tier === "Gold");
  const silver = sponsors.filter((s) => s.tier === "Silver");
  const supporter = sponsors.filter((s) => s.tier === "Supporter");

  // ترجمات التصنيفات
  const tierLabels = {
    platinum: t("tiers.platinum.name"),
    gold: t("tiers.gold.name"),
    silver: t("tiers.silver.name"),
    supporter: t("tiers.supporter.name"),
  };

  return (
    <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* خلفية بارالكس ناعمة */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: backgroundY }}>
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.03), transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.02), transparent 70%)" }}
        />
      </motion.div>

      {/* شبكة نقطية خفيفة */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.015,
          backgroundImage: "radial-gradient(circle, #000 0.5px, transparent 0.5px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 flex flex-col">
        {/* العنوان */}
        <motion.div className="text-center pt-28 pb-16 px-4" style={{ opacity: titleOpacity, y: titleY }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-tedx-red mb-6 px-5 py-2.5 bg-red-50/80 border border-red-100/60 rounded-full backdrop-blur-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tedx-red opacity-40" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-tedx-red" />
            </span>
            {t("hero.badge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={`text-5xl sm:text-6xl md:text-7xl font-bold text-zinc-900 tracking-[-0.03em] mb-6 ${isArabic ? "font-arabic" : ""}`}
          >
            {t("hero.titleLine1")}{" "}
            <span className="relative inline-block">
              <span className="text-tedx-red">{t("hero.titleHighlight")}</span>
              <span
                className="absolute -bottom-2 left-0 right-0 h-[3px] rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, rgba(230,43,30,0.4), transparent)" }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed font-light ${isArabic ? "font-arabic" : ""}`}
          >
            {t("hero.description")}
          </motion.p>
        </motion.div>

        {/* جدار الشعارات */}
        <div className="max-w-5xl mx-auto px-4 pb-20">
          {/* بلاتيني */}
          {platinum.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-tedx-red px-4 py-1.5 bg-tedx-red/10 border border-tedx-red/20 rounded-full">
                  {t("tiers.platinum.name")}
                </span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platinum.map((sponsor, i) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    index={i}
                    tierLabel={tierLabels.platinum}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ذهبي */}
          {gold.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-tedx-red px-4 py-1.5 bg-tedx-red/5 border border-tedx-red/10 rounded-full">
                  {t("tiers.gold.name")}
                </span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gold.map((sponsor, i) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    index={i + platinum.length}
                    tierLabel={tierLabels.gold}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* فضي */}
          {silver.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-tedx-red/80 px-4 py-1.5 bg-tedx-red/5 border border-tedx-red/10 rounded-full">
                  {t("tiers.silver.name")}
                </span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {silver.map((sponsor, i) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    index={i + platinum.length + gold.length}
                    tierLabel={tierLabels.silver}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* داعم */}
          {supporter.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-500 px-4 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full">
                  {t("tiers.supporter.name")}
                </span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {supporter.map((sponsor, i) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    index={i + platinum.length + gold.length + silver.length}
                    tierLabel={tierLabels.supporter}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

{/* ═══════════════════════════════════════════════════════════════
    إحصائيات TEDx — تصميم "الأرقام النابضة"
    ═══════════════════════════════════════════════════════════════ */}
<motion.div
  className="py-20 md:py-28 px-4 relative overflow-hidden"
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
>
  {/* خلفية داكنة مع نمط TEDx */}
  <div className="absolute inset-0 bg-zinc-950 z-0" />
  <div 
    className="absolute inset-0 opacity-[0.04] z-0"
    style={{
      backgroundImage: `radial-gradient(circle at 1px 1px, #e62b1e 1px, transparent 0)`,
      backgroundSize: "32px 32px",
    }}
  />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-tedx-red/[0.06] rounded-full blur-[100px] pointer-events-none z-0" />

  <div className="max-w-5xl mx-auto relative z-10">
    
    {/* رأس القسم */}
    <div className="text-center mb-14 md:mb-18">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tedx-red/10 border border-tedx-red/20 mb-5"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tedx-red opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-tedx-red" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-tedx-red">
          {isArabic ? "الأرقام تتحدث" : "By The Numbers"}
        </span>
      </motion.div>
    </div>

    {/* شبكة الإحصائيات */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-zinc-800/60">
      {[
        { 
          num: "12+", 
          labelKey: "stats.partners",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          )
        },
        { 
          num: "5", 
          labelKey: "stats.countries",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          )
        },
        { 
          num: "3", 
          labelKey: "stats.years",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          )
        },
      ].map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="group relative text-center px-6 py-8 md:py-10"
        >
          {/* أيقونة */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-tedx-red mb-5 group-hover:bg-tedx-red group-hover:text-white group-hover:border-tedx-red transition-all duration-500">
            {stat.icon}
          </div>

          {/* الرقم */}
          <div className="relative inline-block">
            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-[-0.04em] tabular-nums">
              {stat.num}
            </span>
            {/* توهج خلفي للرقم */}
            <div className="absolute inset-0 -z-10 blur-3xl bg-tedx-red/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* التسمية */}
          <div className={`mt-3 text-sm md:text-base font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors duration-300 uppercase tracking-wide ${isArabic ? "font-arabic" : ""}`}>
            {t(stat.labelKey)}
          </div>

          {/* خط زخرفي سفلي */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 h-[2px] w-10 mx-auto bg-gradient-to-r from-transparent via-tedx-red/50 to-transparent origin-center"
          />
        </motion.div>
      ))}
    </div>

    {/* شريط TEDx سفلي متحرك */}
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12 md:mt-16 h-px bg-gradient-to-r from-transparent via-tedx-red/30 to-transparent origin-center"
    />
  </div>
</motion.div>
      </div>

      {/* قسم كن شريكاً */}
{/* قسم كن شريكاً – بطاقة داكنة + مسافة سفلية للفوتور */}
<section className="relative z-10 py-24 pb-32 px-4 bg-white overflow-hidden">
  <div className="max-w-4xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="p-10 md:p-14 rounded-[32px] bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative overflow-hidden text-center"
    >
      {/* توهجات حمراء خلفية */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-tedx-red/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-tedx-red/5 rounded-full blur-2xl" />

      <div className="relative z-10">
        <h2 className={`text-3xl sm:text-4xl font-bold mb-4 text-white ${isArabic ? "font-arabic" : ""}`}>
          {t("cta.heading")}{" "}
          <span className="text-tedx-red">{t("cta.headingHighlight")}</span>
        </h2>

        <p className={`text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed text-lg ${isArabic ? "font-arabic" : ""}`}>
          {t("cta.description")}
        </p>

        <div className="flex justify-center">
          <button
            onClick={() => setIsPartnerModalOpen(true)}
            className="group inline-flex items-center gap-3 px-10 py-4 bg-tedx-red text-white font-semibold rounded-full 
              hover:bg-red-700 transition-all duration-300 cursor-pointer
              shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)] hover:shadow-[0_12px_40px_-12px_rgba(230,43,30,0.6)]
              hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className={isArabic ? "font-arabic" : ""}>{t("cta.button")}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isArabic ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  </div>
</section>
      {/* Modal الشراكة */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title={t("cta.heading") + " " + t("cta.headingHighlight")}
      >
        <PartnerInquiryForm />
      </Modal>
    </div>
  );
}