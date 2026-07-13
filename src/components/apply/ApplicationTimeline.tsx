"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const stageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const, delay: i * 0.08 },
  }),
};

export default function ApplicationTimeline() {
  const t = useTranslations("page.apply.timeline");
  const stages = Array.from({ length: 11 }, (_, i) => ({
    stageNumber: i + 1,
    title: t(`stage${i + 1}.title`),
    dateLabel: t(`stage${i + 1}.dateLabel`),
    description: t(`stage${i + 1}.description`),
  }));

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-col md:flex-row md:min-w-[1400px] gap-8 md:gap-0">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.stageNumber}
            className="flex md:flex-col items-start md:items-center gap-4 md:gap-0 md:flex-1 relative"
            custom={index}
            variants={stageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* connector line */}
            {index < stages.length - 1 && (
              <div className="hidden md:block absolute top-4 left-1/2 w-full h-px bg-gray-300" />
            )}

            <div className="flex-shrink-0 relative z-10 w-8 h-8 rounded-full bg-tedx-red text-tedx-white flex items-center justify-center text-sm font-bold">
              {stage.stageNumber}
            </div>

            <div className="md:mt-4 md:text-center md:px-2">
              <h3 className="font-semibold text-sm">{stage.title}</h3>
              <p className="text-xs text-tedx-red mb-1">{stage.dateLabel}</p>
              <p className="text-xs text-tedx-gray">{stage.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
