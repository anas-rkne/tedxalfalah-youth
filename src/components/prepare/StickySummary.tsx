"use client";

import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";

export default function StickySummary() {
  const t = useTranslations("page.prepare");
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 800], [0, 1]);
  const y = useTransform(scrollY, [0, 800], [50, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
    >
      <div className="flex items-center justify-between h-12 px-10 bg-zinc-900 border-t border-white/5 text-[10px] uppercase tracking-[0.3em] font-medium text-zinc-500 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="text-white">
            TEDx<span className="font-normal opacity-70">AlFalahYouth</span>
          </span>
        </div>
        <div className="flex items-center gap-6 hidden md:flex">
          <div className="flex items-center gap-2">
            <span className="text-white">
              {t("timeAndPlace.dateValue")} &bull; {t("timeAndPlace.timeValue")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white">{t("timeAndPlace.venueValue")}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
