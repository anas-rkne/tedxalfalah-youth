"use client";

import { useScroll, useTransform } from "framer-motion";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import SectionBadge from "@/components/ui/SectionBadge";

interface VenueHeroSectionProps {
  heroTitle: string;
  heroAlt: string;
  heroImage?: string;   // صورة اختيارية
}

export default function VenueHeroSection({
  heroTitle,
  heroAlt,
  heroImage,
}: VenueHeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const imageY = useTransform(
    scrollY,
    [0, 500],
    [0, shouldReduceMotion ? 0 : 150]
  );
  const imageScale = useTransform(
    scrollY,
    [0, 500],
    [1, shouldReduceMotion ? 1 : 1.1]
  );

  const imageSrc = heroImage || "/images/venue-hero.webp";

  return (
    <section className="relative h-[65vh] min-h-[420px] overflow-hidden">
      
      {/* الصورة مع Parallax */}
      <motion.div
        style={{ y: imageY, scale: imageScale }}
        className="absolute inset-0"
      >
        <Image
          src={imageSrc}
          alt={heroAlt}
          fill
          priority
          className="object-cover saturate-[0.8] contrast-[1.1]"
          sizes="100vw"
        />
      </motion.div>

      {/* تدرج مظلم لضمان قراءة النص */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* شريط TEDx الأحمر في الأسفل */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent, #e62b1e, transparent)",
        }}
      />

      {/* المحتوى - هيكلية متطابقة مع الفريق والمتحدثين */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-24">
        <div className="max-w-[1400px] mx-auto w-full relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6 md:gap-12 text-white">
          
          {/* الجهة اليسرى */}
          <div className="space-y-6">
            {/* ✅ تم تخصيص الـ Badge ليتطابق مع النمط الموجود في الصورة */}
            <div className="flex items-start">
              <SectionBadge className="bg-[#e62b1e]/20 border-[#e62b1e]/30 text-[#e62b1e]">
                TEDxVenue 2026
              </SectionBadge>
            </div>
            
            {/* ✅ العنوان الضخم مع التدرج اللوني في الجزء الثاني */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-none text-balance">
              THE VENUE <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#e62b1e]/50">
                OF INNOVATION.
              </span>
            </h1>
          </div>
          
          {/* الجهة اليمنى: شعار TEDx والوصف */}
          <div className="flex flex-col justify-center md:justify-end md:items-end items-start text-left md:text-right md:pb-4">
             <div className="text-[#e62b1e] font-black text-4xl italic leading-none hidden md:block">TEDx</div>
             <div className="text-[11px] font-medium tracking-[0.3em] opacity-50 mt-1 uppercase hidden md:block">Youth</div>
             <p className="text-gray-400 text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-xs md:max-w-sm mx-auto md:mx-0 mt-6 md:mt-8">
                A home for bold ideas and human connection.
             </p>
          </div>
        </div>
      </div>

      {/* سهم التمرير أسفل الصفحة */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-[11px] tracking-[0.1em] uppercase">Scroll</span>
        <div
          className="w-px h-10 animate-pulse"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)",
          }}
        />
      </div>
    </section>
  );
}