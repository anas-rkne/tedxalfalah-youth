"use client";

import { motion, useReducedMotion } from "framer-motion";

interface VenueMapSectionProps {
  title: string;
  mapTitle: string;
  directions: string;
}

export default function VenueMapSection({
  title,
  mapTitle,
  directions,
}: VenueMapSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0e]">
      <div className="max-w-6xl mx-auto">
        {/* عنوان المجموعة */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
            }}
          />
          <span className="text-[13px] font-semibold text-slate-400/60 uppercase tracking-[0.08em] whitespace-nowrap px-4 py-1.5 bg-slate-400/[0.06] border border-slate-400/[0.08] rounded-full">
            {title}
          </span>
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
            }}
          />
        </div>

        {/* الخريطة */}
        <motion.div
          className="relative w-full rounded-[20px] overflow-hidden border border-white/[0.06] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
          initial={shouldReduceMotion ? {} : { scale: 0.95, opacity: 0 }}
          whileInView={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* إطار داخلي */}
          <div className="absolute inset-0 rounded-[20px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] pointer-events-none z-10" />

          <iframe
            title={mapTitle}
            src="https://www.google.com/maps?q=Dubai&output=embed"
            width="100%"
            height="100%"
            className="aspect-video w-full"
            style={{ border: 0 }}
            loading="lazy"
          />
        </motion.div>

        {/* تعليمات الوصول */}
        <div className="flex items-start gap-3 mt-5 px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-[#e62b1e]/10 border border-[#e62b1e]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e62b1e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <p className="text-sm text-slate-400/70 leading-relaxed">
            {directions}
          </p>
        </div>
      </div>
    </section>
  );
}