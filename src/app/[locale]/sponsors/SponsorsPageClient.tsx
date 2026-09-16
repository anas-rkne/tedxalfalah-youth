"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Sponsor } from "@/lib/types";
import SafeImage from "@/components/ui/SafeImage";
import Modal from "@/components/ui/Modal";
import PartnerInquiryForm from "@/components/sponsors/PartnerInquiryForm";
import DarkHeroSection from "@/components/shared/DarkHeroSection";

/* ═══════════════════════════════════════════════════════════════
   SponsorLogoCard – بطاقة شعار موحّدة (كل الرعاة بنفس الحجم)
   ═══════════════════════════════════════════════════════════════ */
function SponsorLogoCard({ sponsor, index, isArabic }: { sponsor: Sponsor; index: number; isArabic: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  const inner = (
    <div
      className={`relative w-full aspect-[3/2] rounded-3xl bg-white border ${isArabic ? "font-arabic" : ""}
        border-zinc-200/80 overflow-hidden flex flex-col items-center justify-center gap-3
        transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        hover:border-tedx-red/25
        hover:shadow-[0_20px_50px_-20px_rgba(230,43,30,0.25)]
        hover:-translate-y-1.5`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* توهج خلفي عند hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(230,43,30,0.06), transparent 65%)",
        }}
      />

      {/* شبكة نقطية خفيفة */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #000 0.5px, transparent 0.5px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* الشعار */}
      <div className="relative z-10 flex items-center justify-center w-full h-full px-7 py-8">
        {sponsor.logoUrl ? (
          <SafeImage
            src={sponsor.logoUrl}
            alt={sponsor.name}
            fill
            unoptimized
            className="object-contain p-4 transition-all duration-500"
            sizes="(max-width: 640px) 160px, 240px"
          />
        ) : (
          <span className="text-lg font-bold text-zinc-300 uppercase tracking-[0.15em] text-center px-2">
            {sponsor.name}
          </span>
        )}
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
  );

  if (sponsor.websiteUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
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
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      {inner}
    </motion.div>
  );
}

interface SponsorsPageClientProps {
  sponsors: Sponsor[];
}

export default function SponsorsPageClient({ sponsors }: SponsorsPageClientProps) {
  const t = useTranslations("page.sponsors");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const shouldReduceMotion = useReducedMotion();

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* ═══════════ HERO ═══════════ */}
      <DarkHeroSection
        badgeLabel={t("hero.badge")}
        mainTitle={t("hero.titleLine1")}
        highlightTitle={t("hero.titleHighlight")}
        description={t("hero.description")}
        isArabic={isArabic}
        heroImage={undefined}
      />

      {/* ═══════════ جدار الشعارات — تنسيق موحّد ═══════════ */}
      <section className="relative bg-white overflow-hidden">
        {/* خلفية متوهجة */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(230,43,30,0.04), transparent 70%)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(249,115,22,0.03), transparent 70%)" }}
          />
        </div>

        {sponsors.length === 0 ? (
          <div className="relative z-10 py-32">
            <p className="text-center text-muted-foreground text-lg">{t("empty")}</p>
          </div>
        ) : (
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            {/* الشبكة الموحّدة */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {sponsors.map((sponsor, i) => (
                <SponsorLogoCard
                  key={sponsor.id}
                  sponsor={sponsor}
                  index={i}
                  isArabic={isArabic}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════ قسم كن شريكاً ═══════════ */}
      <section className="relative z-10 py-24 pb-32 px-4 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
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

      {/* ═══════════ Modal الشراكة ═══════════ */}
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