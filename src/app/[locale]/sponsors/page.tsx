"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   أنواع البيانات
   ═══════════════════════════════════════════════════════════════ */
interface Sponsor {
  id: number;
  name: string;
  nameAr: string;
  logoUrl: string;
  website: string;
  tier: "platinum" | "gold" | "silver";
}

/* ═══════════════════════════════════════════════════════════════
   بيانات تجريبية — استبدلها بالشعارات الحقيقية
   ═══════════════════════════════════════════════════════════════ */
const SPONSORS: Sponsor[] = [
  { id: 1, name: "Emirates Airlines", nameAr: "طيران الإمارات", logoUrl: "/images/sponsors/emirates.svg", website: "https://emirates.com", tier: "platinum" },
  { id: 2, name: "Dubai Holding", nameAr: "دبي القابضة", logoUrl: "/images/sponsors/dubai-holding.svg", website: "https://dubaiholding.com", tier: "platinum" },
  { id: 3, name: "Emaar", nameAr: "إعمار", logoUrl: "/images/sponsors/emaar.svg", website: "https://emaar.com", tier: "gold" },
  { id: 4, name: "Dubai Future Foundation", nameAr: "مؤسسة دبي للمستقبل", logoUrl: "/images/sponsors/dff.svg", website: "https://dubainfuture.ae", tier: "gold" },
  { id: 5, name: "Majid Al Futtaim", nameAr: "مجيد الفطيم", logoUrl: "/images/sponsors/maf.svg", website: "https://majidalfuttaim.com", tier: "gold" },
  { id: 6, name: "Careem", nameAr: "كريم", logoUrl: "/images/sponsors/careem.svg", website: "https://careem.com", tier: "silver" },
  { id: 7, name: "Noon", nameAr: "نون", logoUrl: "/images/sponsors/noon.svg", website: "https://noon.com", tier: "silver" },
  { id: 8, name: "Talabat", nameAr: "طلبات", logoUrl: "/images/sponsors/talabat.svg", website: "https://talabat.com", tier: "silver" },
  { id: 9, name: "Dubai Holding", nameAr: "دبي القابضة", logoUrl: "/images/sponsors/dubai-holding.svg", website: "https://dubaiholding.com", tier: "silver" },
  { id: 10, name: "Emaar", nameAr: "إعمار", logoUrl: "/images/sponsors/emaar.svg", website: "https://emaar.com", tier: "silver" },
  { id: 11, name: "Dubai Future Foundation", nameAr: "مؤسسة دبي للمستقبل", logoUrl: "/images/sponsors/dff.svg", website: "https://dubainfuture.ae", tier: "silver" },
  { id: 12, name: "Majid Al Futtaim", nameAr: "مجيد الفطيم", logoUrl: "/images/sponsors/maf.svg", website: "https://majidalfuttaim.com", tier: "silver" },
];

/* ═══════════════════════════════════════════════════════════════
   مكون بطاقة شعار
   ═══════════════════════════════════════════════════════════════ */
function SponsorCard({ sponsor, index }: { sponsor: Sponsor; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  const tierConfig = {
    platinum: {
      size: "col-span-2 row-span-2",
      height: "h-48 sm:h-56",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      badgeText: "بلاتيني",
    },
    gold: {
      size: "col-span-1 row-span-1",
      height: "h-32 sm:h-36",
      badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
      badgeText: "ذهبي",
    },
    silver: {
      size: "col-span-1 row-span-1",
      height: "h-32 sm:h-36",
      badge: "bg-slate-50 text-slate-600 border-slate-200",
      badgeText: "فضي",
    },
  };

  const config = tierConfig[sponsor.tier];

  return (
    <motion.div
      className={`${config.size}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <a
        href={sponsor.website}
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
            hover:border-[#e62b1e]/20 
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
          <div 
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${config.badge}`}
          >
            {config.badgeText}
          </div>

          {/* شعار placeholder */}
          <div className="relative z-10 text-center">
            <span className={`font-bold text-zinc-300 uppercase tracking-[0.15em] group-hover:text-[#e62b1e] transition-colors duration-500 ${
              sponsor.tier === "platinum" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
            }`}>
              {sponsor.name.substring(0, 4)}
            </span>
          </div>

          {/* اسم الشريك */}
          <div className="relative z-10 text-center">
            <span className={`text-zinc-500 group-hover:text-zinc-700 transition-colors duration-300 ${
              sponsor.tier === "platinum" ? "text-sm sm:text-base font-semibold" : "text-xs sm:text-sm"
            }`}>
              {sponsor.nameAr}
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
export default function SponsorsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const backgroundY = useTransform(smoothProgress, [0, 1], ["0%", "15%"]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.5]);
  const titleY = useTransform(smoothProgress, [0, 0.15], [60, 0]);

  const platinum = SPONSORS.filter((s) => s.tier === "platinum");
  const gold = SPONSORS.filter((s) => s.tier === "gold");
  const silver = SPONSORS.filter((s) => s.tier === "silver");

  return (
    <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* خلفية بارالكس ناعمة */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.03), transparent 70%)" }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.02), transparent 70%)" }}
        />
      </motion.div>

      {/* شبكة نقطية خفيفة جداً */}
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
        <motion.div
          className="text-center pt-28 pb-16 px-4"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#e62b1e] mb-6 px-5 py-2.5 bg-red-50/80 border border-red-100/60 rounded-full backdrop-blur-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e62b1e] opacity-40" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#e62b1e]" />
            </span>
            Our Partners
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-zinc-900 tracking-[-0.03em] mb-6"
          >
            شركاؤنا في{" "}
            <span className="relative inline-block">
              <span className="text-[#e62b1e]">النجاح</span>
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
            className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed font-light"
          >
            نفتخر بالتعاون مع رواد الصناعة الذين يشاركوننا رؤية المستقبل
          </motion.p>
        </motion.div>

        {/* جدار الشعارات — Masonry Grid */}
        <div className="max-w-5xl mx-auto px-4 pb-20">
          {/* بلاتيني */}
          {platinum.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-amber-600 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                  Platinum Partners
                </span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platinum.map((sponsor, i) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ذهبي */}
          {gold.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-yellow-600 px-4 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full">
                  Gold Partners
                </span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gold.map((sponsor, i) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} index={i + platinum.length} />
                ))}
              </div>
            </div>
          )}

          {/* فضي */}
          {silver.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                  Silver Partners
                </span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {silver.map((sponsor, i) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} index={i + platinum.length + gold.length} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* إحصائيات سريعة */}
        <motion.div
          className="py-16 px-4"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-3 divide-x divide-zinc-100">
              {[
                { num: "12+", label: "شريك", labelEn: "Partners" },
                { num: "5", label: "دولة", labelEn: "Countries" },
                { num: "3", label: "سنوات", labelEn: "Years" },
              ].map((stat, i) => (
                <div key={i} className="text-center px-4 py-2">
                  <div className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-2 tracking-[-0.02em]">
                    {stat.num}
                  </div>
                  <div className="text-sm font-medium text-zinc-500">{stat.label}</div>
                  <div className="text-[11px] text-zinc-300 uppercase tracking-[0.15em] mt-1">{stat.labelEn}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* قسم كن شريكاً */}
      <section className="relative z-10 py-24 px-4 bg-[#0a0a0e] overflow-hidden">
        {/* توهج خلفي */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(230,43,30,0.03), transparent 70%)" }}
        />

        <div className="max-w-2xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#e62b1e]/70 mb-6">
              <span className="w-8 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(230,43,30,0.3))" }} />
              Join Us
              <span className="w-8 h-px" style={{ background: "linear-gradient(90deg, rgba(230,43,30,0.3), transparent)" }} />
            </span>

            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-[-0.02em]">
              هل تريد أن تكون{" "}
              <span className="text-[#e62b1e]">شريكاً</span>؟
            </h2>

            <p className="text-zinc-500 mb-10 leading-relaxed max-w-md mx-auto text-lg">
              انضم إلى قائمة شركائنا وكن جزءاً من حدث يُلهم الجيل القادم
            </p>

            <a
              href="mailto:partnerships@tedxyouth.ae"
              className="group inline-flex items-center gap-3 px-10 py-4.5 bg-[#e62b1e] text-white font-semibold rounded-full 
                hover:bg-red-700 transition-all duration-300 
                shadow-[0_0_40px_-12px_rgba(230,43,30,0.4)] hover:shadow-[0_0_50px_-12px_rgba(230,43,30,0.6)]
                hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>تواصل معنا</span>
              <svg 
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
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
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}