"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Ticket, IdCard, Smartphone, Shirt } from "lucide-react";

const icons: Record<string, React.ReactNode> = {
  ticket: <Ticket className="w-6 h-6" />,
  id: <IdCard className="w-6 h-6" />,
  charger: <Smartphone className="w-6 h-6" />,
  clothes: <Shirt className="w-6 h-6" />,
};

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

export function TimeAndPlace() {
  const t = useTranslations("page.prepare");

  return (
    <section className="py-32 relative z-20">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16"
        >
          <span className="inline-block px-3 py-1 bg-tedx-red/10 border border-tedx-red/20 text-tedx-red text-[10px] font-bold uppercase tracking-[0.2em] mb-4 rounded">
            {t("timeAndPlace.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
            {t("timeAndPlace.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Info Cards */}
          <div className="space-y-6">
            {[
              { icon: Calendar, label: t("timeAndPlace.dateLabel"), value: t("timeAndPlace.dateValue"), delay: 0.1 },
              { icon: Clock, label: t("timeAndPlace.timeLabel"), value: t("timeAndPlace.timeValue"), delay: 0.2 },
              { icon: MapPin, label: t("timeAndPlace.venueLabel"), value: t("timeAndPlace.venueValue"), delay: 0.3 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay, duration: 0.6 }}
                className="group flex items-center gap-4 p-6 bg-zinc-900/50 rounded-2xl border border-white/5 backdrop-blur-sm transition-all duration-500"
              >
                <div className="w-10 h-10 rounded-lg bg-tedx-red flex items-center justify-center flex-shrink-0 transition-all duration-500">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold text-white">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Floating Map Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl overflow-hidden border border-white/5 aspect-square lg:aspect-auto lg:h-full bg-zinc-800 grayscale opacity-50 contrast-125"
          >
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#222,#222_10px,#1a1a1a_10px,#1a1a1a_20px)] flex items-center justify-center">
              <div className="relative">
                <div className="w-4 h-4 bg-tedx-red rounded-full relative z-10" />
                <motion.div
                  animate={{ scale: [1, 3], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className="absolute inset-0 bg-tedx-red rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function WhatToBring() {
  const t = useTranslations("page.prepare");
  const items = t.raw("whatToBring.items") as { id: number; icon: string; title: string; desc: string }[];

  return (
    <section className="py-32 relative z-20 bg-black/50">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <span className="inline-block px-3 py-1 bg-tedx-red/10 border border-tedx-red/20 text-tedx-red text-[10px] font-bold uppercase tracking-[0.2em] mb-4 rounded">
            {t("whatToBring.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
            {t("whatToBring.title")}
          </h2>
          <p className="text-zinc-400 mt-4 max-w-xl mx-auto">
            Check off these items to ensure you have a seamless experience.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-4"
        >
          {items.map((item, i) => (
            <ChecklistItem key={item.id} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ChecklistItem({ item }: { item: { id: number; icon: string; title: string; desc: string } }) {
  const [checked, setChecked] = useState(false);

  return (
    <motion.div
      variants={fadeUpItem}
      onClick={() => setChecked(!checked)}
      className={`group flex items-center gap-6 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
        checked
          ? "bg-white/[0.05] border-tedx-red/30"
          : "bg-white/[0.02] border-white/5 hover:border-white/10"
      }`}
    >
      {/* Custom Checkbox */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          checked
            ? "border-tedx-red bg-tedx-red text-white"
            : "border-white/20 text-transparent group-hover:border-white/40"
        }`}
      >
        <motion.svg
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </motion.svg>
      </div>

      <div
        className={`w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          checked ? "text-tedx-red" : "text-zinc-400 group-hover:text-white"
        }`}
      >
        {icons[item.icon]}
      </div>

      <div>
        <p
          className={`text-sm font-bold transition-colors duration-300 ${
            checked ? "text-white" : "text-zinc-200"
          }`}
        >
          {item.title}
        </p>
        <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
          {item.desc}
        </p>
      </div>
    </motion.div>
  );
}
