"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import SectionContainer from "@/components/ui/SectionContainer";
import SectionBadge from "@/components/ui/SectionBadge"; // ✅ استيراد الشارة الموحدة

interface VenueGallerySectionProps {
  count: number;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const childVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function VenueGallerySection({ count }: VenueGallerySectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("page.venue");

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <SectionContainer>
        {/* عنوان المجموعة - ✅ تم استبدال الشارة بـ SectionBadge */}
        <div className="flex items-center gap-4 mb-8">
          {/* الخط الأيسر */}
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          {/* الشارة الحمراء النابضة */}
          <SectionBadge>
            {t("photoGallery.title")}
          </SectionBadge>
          
          {/* الخط الأيمن */}
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? {} : "hidden"}
          whileInView={shouldReduceMotion ? {} : "visible"}
          viewport={{ once: true, amount: 0.2 }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <motion.div
              key={i}
              className={`
                relative rounded-2xl overflow-hidden cursor-pointer bg-muted
                ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-[16/10]"}
              `}
              variants={shouldReduceMotion ? {} : childVariants}
              whileHover={
                shouldReduceMotion
                  ? {}
                  : { scale: 1.03 }
              }
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Image
                src="/mock/activation-placeholder.svg"
                alt={t("photoGallery.alt", { number: i + 1 })}
                fill
                className="object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                  saturate-[0.7] brightness-[0.85]
                  group-hover:saturate-[0.9] group-hover:brightness-[0.95] group-hover:scale-[1.08]"
                sizes={
                  i === 0
                    ? "(max-width: 768px) 100vw, 66vw"
                    : "(max-width: 768px) 50vw, 33vw"
                }
              />

              {/* تدرج داكن أسفل - تم تعديله ليكون أكثر شفافية */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)",
                }}
              />

              {/* رقم الصورة */}
              <span className="absolute bottom-4 left-4 text-xs font-semibold text-white/80 tracking-wide
                opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
                {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>

              {/* إطار داخلي - تم تحديثه ليكون مناسباً للخلفية الفاتحة */}
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] group-hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] transition-shadow duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </SectionContainer>
    </section>
  );
}