"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect"; // استيراد مُسمى

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
}

interface SponsorsStripContentProps {
  heading: string;
  sponsors: Sponsor[];
}

export default function SponsorsStripContent({
  heading,
  sponsors,
}: SponsorsStripContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const duplicatedSponsors = [...sponsors, ...sponsors];

  if (sponsors.length === 0) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-white dark:bg-black pt-20 pb-16">
        <p className="text-gray-500 text-lg">No sponsors yet.</p>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center bg-white pt-20 pb-16 overflow-hidden dark:bg-black"
    >
      {/* خلفية Ripple Effect (دون طبقة شفافة بيضاء) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <BackgroundRippleEffect rows={10} cols={30} cellSize={48} />
      </div>

      {/* توهج خلفي ناعم */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-red-500/5 blur-3xl pointer-events-none z-0" />

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 w-full flex flex-col items-center gap-8 md:gap-12">
        <ScrollReveal>
          <Link href="/sponsors">
            <h2 className="text-center text-sm md:text-base font-semibold uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors dark:text-gray-400 dark:hover:text-red-500">
              {heading}
            </h2>
          </Link>
        </ScrollReveal>

        <div className="w-full overflow-hidden relative">
          <motion.div
            className="flex gap-12 md:gap-16 whitespace-nowrap"
            animate={
              shouldReduceMotion ? {} : { x: ["0%", `-${sponsors.length * 100}%`] }
            }
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
            whileHover={
              shouldReduceMotion ? {} : { animationPlayState: "paused" }
            }
          >
            {duplicatedSponsors.map((sponsor, index) => (
              <div
                key={`${sponsor.id}-${index}`}
                className="relative w-24 h-12 md:w-32 md:h-16 grayscale hover:grayscale-0 transition-all duration-300"
              >
                <Image
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 96px, 128px"
                />
              </div>
            ))}
          </motion.div>

          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none dark:from-black" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-r from-transparent to-white pointer-events-none dark:to-black" />
        </div>
      </div>
    </section>
  );
}