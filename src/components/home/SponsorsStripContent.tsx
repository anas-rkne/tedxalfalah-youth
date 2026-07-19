"use client";

import { useRef } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";

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

  if (sponsors.length === 0) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-white pt-20 pb-16">
        <p className="text-gray-500 text-lg">No sponsors yet.</p>
      </section>
    );
  }

  // تأثيرات الظهور المتدرج للبطاقات
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }, // ظهور واحد تلو الآخر
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section
      ref={containerRef}
      className="relative flex flex-col items-center justify-center bg-white pt-24 pb-20 overflow-hidden"
    >
      <div className="relative z-10 w-full flex flex-col items-center gap-10 md:gap-14">
        
        {/* عنوان القسم */}
        <ScrollReveal>
          <div className="text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">
              {heading}
            </h2>
            <div className="w-12 h-1 bg-red-600 mx-auto mt-4 rounded-full" />
            <p className="text-gray-500 mt-6 text-lg font-light max-w-2xl mx-auto leading-relaxed">
              نفتخر بشراكاتنا مع المؤسسات الرائدة التي تدعم رؤيتنا وتشاركنا شغف نشر الأفكار.
            </p>
          </div>
        </ScrollReveal>

        {/* ✅ شبكة الشركاء الثابتة والأنيقة */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 mt-4"
        >
          {sponsors.map((sponsor) => (
            <motion.div
              key={sponsor.id}
              variants={cardVariants}
              className="group relative w-full aspect-[2/1] bg-white rounded-2xl border border-gray-100/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center p-6 md:p-8"
            >
              {/* تحويل الشعار إلى "أبيض وأسود" صافٍ، ثم يعود لونه عند التمرير */}
              <div className="relative w-full h-full filter  transition-all duration-500">
                <Image
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}