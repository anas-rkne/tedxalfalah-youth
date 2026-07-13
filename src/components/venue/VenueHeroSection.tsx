"use client";

import { useScroll, useTransform } from "framer-motion";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

interface VenueHeroSectionProps {
  heroTitle: string;
  heroAlt: string;
}

export default function VenueHeroSection({
  heroTitle,
  heroAlt,
}: VenueHeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : 150]);
  const imageScale = useTransform(scrollY, [0, 500], [1, shouldReduceMotion ? 1 : 1.1]);

  return (
    <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
      <motion.div
        style={{ y: imageY, scale: imageScale }}
        className="absolute inset-0"
      >
        <Image
          src="/mock/hero-placeholder.svg"
          alt={heroAlt}
          fill
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-tedx-white text-center px-4">
          {heroTitle}
        </h1>
      </div>
    </section>
  );
}
