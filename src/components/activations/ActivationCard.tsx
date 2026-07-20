"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Activation } from "@/lib/types";

interface ActivationCardProps {
  activation: Activation;
  index: number;
}

/* ═══════════════════════════════════════════════════════════════
   أيقونة الموقع
   ═══════════════════════════════════════════════════════════════ */
function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   بطاقة التفعيل — تصميم عصري بدون توهج أحمر
   ═══════════════════════════════════════════════════════════════ */
export default function ActivationCard({
  activation,
  index,
}: ActivationCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isReversed = index % 2 === 1;

  return (
    <>
      <motion.div
        className={`group flex flex-col md:flex-row gap-8 md:gap-12 items-center ${
          isReversed ? "md:flex-row-reverse" : ""
        }`}
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 40 }}
        whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
          delay: shouldReduceMotion ? 0 : index * 0.1,
        }}
      >
        {/* ═══════ الصورة ═══════ */}
        <div className="relative w-full md:w-[55%] aspect-[16/10] rounded-[20px] overflow-hidden flex-shrink-0">
          <Image
            src={activation.imageUrl}
            alt={activation.name}
            fill
            className="object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] saturate-[0.85] contrast-[1.02] group-hover:saturate-[0.95] group-hover:contrast-[1.04] group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 55vw"
          />

          {/* تدرج أسفل الصورة */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)",
            }}
          />

          {/* رقم البطاقة */}
          <span className="absolute bottom-4 left-5 text-[13px] font-bold text-white/70 tracking-wide font-mono">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* إطار داخلي */}
          <div className="absolute inset-0 rounded-[20px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] group-hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-shadow duration-400 pointer-events-none" />
        </div>

        {/* ═══════ المحتوى النصي ═══════ */}
        <div className="w-full md:w-[45%] flex-1">
          <h2 className="font-bold text-2xl text-zinc-900 leading-[1.25] tracking-[-0.02em] mb-2">
            {activation.name}
          </h2>

          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e62b1e] tracking-[0.02em] mb-4 px-3 py-1 bg-[#e62b1e]/[0.05] border border-[#e62b1e]/[0.08] rounded-full">
            <LocationIcon />
            {activation.locationInVenue}
          </span>

          <p className="text-[15px] text-zinc-600 leading-[1.8]">
            {activation.description}
          </p>
        </div>
      </motion.div>

      {/* فاصل بين البطاقات (ما عدا الأخيرة) */}
      <div
        className="hidden md:block h-px mt-20"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)",
        }}
      />
    </>
  );
}