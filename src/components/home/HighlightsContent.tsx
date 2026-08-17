"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge";

interface HighlightsContentProps {
  isScheduleReady: boolean;
  mainHeading: string;
  mainSubtitle: string;
}

const easeOut = [0.23, 1, 0.32, 1] as const;

export default function HighlightsContent({
  isScheduleReady,
  mainHeading,
  mainSubtitle,
}: HighlightsContentProps) {
  const { isRTL } = useRTL();
  const shouldReduceMotion = useReducedMotion();

  if (!isScheduleReady) return null;

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      <div className="relative pb-12 md:pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
        </div>
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="container-padding relative z-10 max-w-5xl mx-auto text-center"
        >
          <div className="flex justify-center mb-4">
            <SectionBadge>{mainHeading}</SectionBadge>
          </div>
          <h2 className="heading-h1 tracking-[-0.03em] mt-5 heading-margin">{mainHeading}</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-border" />
            <div className="h-1 w-14 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
            <div className="h-px w-10 bg-border" />
          </div>
          <p className="text-muted-foreground mt-6 text-lg font-light max-w-2xl mx-auto leading-relaxed" dir={isRTL ? "rtl" : "ltr"}>
            {mainSubtitle}
          </p>
        </motion.div>
      </div>
    </section>
  );
}