"use client";

import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function PrepareHero() {
  const t = useTranslations("page.prepare");
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 400]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background X Parallax */}
      <motion.div
        style={{ y: y1, opacity: 0.02 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <span className="text-[40rem] font-black text-white leading-none tracking-tighter">X</span>
      </motion.div>

      {/* Main Content Parallax */}
      <motion.div
        style={{ y: y2 }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-block px-3 py-1 bg-tedx-red/10 border border-tedx-red/20 text-tedx-red text-[10px] font-bold uppercase tracking-[0.2em] mb-6 rounded"
        >
          {t("hero.badge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-[0.9]"
        >
          {t("hero.title")} <br />
          <span className="text-tedx-red">
            {t("hero.highlight")}.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-sm md:text-base text-zinc-400 max-w-lg mt-6 leading-relaxed"
        >
          {t("hero.description")}
        </motion.p>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-tedx-red" />
        </motion.div>
      </motion.div>
    </section>
  );
}
