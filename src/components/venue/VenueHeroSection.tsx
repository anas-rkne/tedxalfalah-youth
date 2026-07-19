"use client";

import { useScroll, useTransform } from "framer-motion";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

interface VenueHeroSectionProps {
  heroTitle: string;
  heroAlt: string;
  heroImage?: string;   // صورة اختيارية، إن لم تُمرَّر نستخدم الافتراضية
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

  // ✅ الصورة المعتمدة: التي يمررها المستخدم، أو الصورة الافتراضية من public
  const imageSrc = heroImage || "/public/images/venue-hero.webp";

  return (
    <section className="relative h-[65vh] min-h-[420px] overflow-hidden">
      {/* الصورة مع parallax */}
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

      {/* تدرج أنيق */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* شريط TEDx أحمر في الأسفل */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent, #e62b1e, transparent)",
        }}
      />

      {/* المحتوى */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <span
          className="text-xs font-semibold tracking-[0.15em] uppercase text-white/50 mb-4
            px-4 py-1.5 border border-white/15 rounded-full backdrop-blur-md"
        >
          The Venue
        </span>
        <h1 className="font-bold text-white text-center leading-[1.1] tracking-[-0.02em] drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)] max-w-[800px]"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          {heroTitle}
        </h1>
      </div>

      {/* سهم التمرير */}
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