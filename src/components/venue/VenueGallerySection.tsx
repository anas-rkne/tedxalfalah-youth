"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import SectionContainer from "@/components/ui/SectionContainer";

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
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function VenueGallerySection({ count }: VenueGallerySectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("page.venue");

  return (
    <section className="py-16 bg-tedx-gray-light">
      <SectionContainer>
        <h2 className="text-2xl font-bold mb-6">{t("photoGallery.title")}</h2>
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
              className="relative aspect-video rounded-lg overflow-hidden"
              variants={shouldReduceMotion ? {} : childVariants}
              whileHover={shouldReduceMotion ? {} : {
                scale: 1.08,
                zIndex: 50,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >

              <Image
                src="/mock/activation-placeholder.svg"
                alt={t("photoGallery.alt", { number: i + 1 })}
                fill
                className="object-cover"
              />
            </motion.div>
          ))}
        </motion.div>
      </SectionContainer>
    </section>
  );
}
