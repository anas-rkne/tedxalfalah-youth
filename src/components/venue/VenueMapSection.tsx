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
    <section className="py-16 bg-tedx-gray-light">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <motion.div
          className="aspect-video w-full rounded-lg overflow-hidden mb-4 shadow-lg"
          initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
          whileInView={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <iframe
            title={mapTitle}
            src="https://www.google.com/maps?q=Dubai&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
          />
        </motion.div>
        <p className="text-sm text-tedx-gray">{directions}</p>
      </div>
    </section>
  );
}
