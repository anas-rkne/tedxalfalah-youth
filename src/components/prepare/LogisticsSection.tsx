"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Shield, Camera, HeartPulse, Train, Car, Info, Sparkles } from "lucide-react";

const fadeUpContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function LogisticsSection() {
  const t = useTranslations("page.prepare");
  const prohibitedItems = t.raw("security.prohibitedItems") as string[];

  return (
    <div className="relative z-20">
      {/* Dress Code & Transportation (Alternating Layout) */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 space-y-32">
          {/* Dress Code */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1 relative"
            >
              <div className="aspect-[4/5] rounded-[2.5rem] bg-zinc-900 border border-white/10 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-tedx-red/20 to-transparent opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border border-white/20 rounded-full flex items-center justify-center absolute rotate-45">
                    <div className="w-48 h-48 border border-white/10 rounded-full" />
                  </div>
                  <Sparkles className="w-16 h-16 text-white/50" />
                </div>
              </div>

              {/* Tooltip Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-10 lg:-right-10 right-6 max-w-xs p-6 rounded-3xl bg-zinc-900 border border-tedx-red/30 box-glow backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Info className="w-5 h-5 text-tedx-red" />
                  <span className="font-bold text-white tracking-wide">
                    {t("dressCode.tipTitle")}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {t("dressCode.tipBody")}
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <span className="inline-block px-3 py-1 bg-tedx-red/10 border border-tedx-red/20 text-tedx-red text-[10px] font-bold uppercase tracking-[0.2em] mb-4 rounded">
                {t("dressCode.badge")}
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-6">
                {t("dressCode.title")}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-semibold">
                {t("dressCode.body")}
              </p>
              <div className="mt-8 inline-block px-6 py-3 rounded border border-white/20 bg-white/[0.02] font-bold tracking-[0.2em] text-[10px] text-white">
                SMART CASUAL
              </div>
            </motion.div>
          </div>

          {/* Transportation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 bg-tedx-red/10 border border-tedx-red/20 text-tedx-red text-[10px] font-bold uppercase tracking-[0.2em] mb-4 rounded">
                {t("transportation.badge")}
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-6">
                {t("transportation.title")}
              </h2>

              <motion.div
                variants={fadeUpContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4 mt-8"
              >
                <motion.div
                  variants={fadeUpItem}
                  className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 items-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {t("transportation.parkingNote")}
                  </p>
                </motion.div>
                <motion.div
                  variants={fadeUpItem}
                  className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 items-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Train className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {t("transportation.transitNote")}
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] rounded-[2.5rem] border border-white/10 bg-zinc-900 overflow-hidden flex items-center justify-center"
            >
              {/* Abstract map lines */}
              <svg
                className="absolute inset-0 w-full h-full opacity-20"
                viewBox="0 0 400 400"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 0,200 C 100,200 150,100 250,100 C 350,100 350,300 400,300"
                  fill="none"
                  stroke="#E62B1E"
                  strokeWidth="4"
                  strokeDasharray="8 8"
                />
                <circle cx="250" cy="100" r="8" fill="#E62B1E" />
              </svg>
              <motion.div
                animate={{ x: [0, 400] }}
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                className="absolute left-0 top-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_#fff]"
                style={{ marginTop: -8 }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* House Rules & Photo (Grid Layout) */}
      <section className="py-32 bg-black/50 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={fadeUpContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Security */}
            <motion.div
              variants={fadeUpItem}
              className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 transition-all duration-500 group relative"
            >
              <div className="absolute left-[-4px] top-10 w-2 h-2 rounded-full bg-tedx-red shadow-[0_0_10px_#E62B1E]" />
              <div className="w-10 h-10 rounded-lg bg-tedx-red flex items-center justify-center mb-6">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="inline-block px-3 py-1 bg-tedx-red/10 border border-tedx-red/20 text-tedx-red text-[10px] font-bold uppercase tracking-[0.2em] mb-4 rounded">
                {t("security.badge")}
              </span>
              <h3 className="text-2xl font-black tracking-tight uppercase mb-4 text-tedx-red">
                {t("security.title")}
              </h3>
              <p className="text-xs text-zinc-400 mb-8 font-semibold uppercase tracking-wider">
                {t("security.body")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prohibitedItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.02] flex gap-4 items-center"
                  >
                    <div className="w-6 h-6 rounded-full border border-red-500/30 flex items-center justify-center text-red-500 text-xs">
                      !
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Photography */}
            <motion.div
              variants={fadeUpItem}
              className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 transition-all duration-500 group flex flex-col relative"
            >
              <div className="absolute left-[-4px] top-10 w-2 h-2 rounded-full bg-zinc-800 border border-zinc-600" />
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-6">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-4 rounded">
                {t("photography.badge")}
              </span>
              <h3 className="text-2xl font-black tracking-tight uppercase mb-4">
                {t("photography.title")}
              </h3>
              <p className="text-xs text-zinc-400 mb-auto font-semibold uppercase tracking-wider">
                {t("photography.body")}
              </p>

              <div className="mt-8 p-4 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  Official Tag
                </p>
                <p className="text-sm font-black text-white uppercase">
                  {t("photography.hashtag")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Care & Wellbeing */}
      <section className="py-40 relative overflow-hidden flex items-center justify-center text-center">
        {/* Soft glowing background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/10 pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-24 h-24 mx-auto rounded-full bg-tedx-red/10 text-tedx-red flex items-center justify-center mb-8 box-glow"
          >
            <HeartPulse className="w-10 h-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-3 py-1 bg-tedx-red/10 border border-tedx-red/20 text-tedx-red text-[10px] font-bold uppercase tracking-[0.2em] mb-4 rounded">
              {t("care.badge")}
            </span>
            <h2 className="text-5xl font-black tracking-tight uppercase mb-6">
              {t("care.title")}
            </h2>
            <p className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-10 max-w-xl mx-auto">
              {t("care.body")}
            </p>

            <div className="inline-flex items-center gap-4 px-6 py-3 rounded bg-white/[0.02] border border-white/10">
              <Info className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
                {t("care.note")}
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
