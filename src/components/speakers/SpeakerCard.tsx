"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Speaker } from "@/lib/types";

interface SpeakerCardProps {
  speaker: Speaker;
  onClick: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   شارة "الموجة" — أعمدة صوتية حمراء نابضة
   ═══════════════════════════════════════════════════════════════ */
function WaveBadge({ value }: { value: string | number }) {
  const bars = [5, 10, 7, 12, 4];

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 bg-white/[0.08] backdrop-blur-md border border-white/[0.12] rounded-full">
      <div className="flex items-end gap-[2.5px] h-3.5">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            className="w-[2.5px] bg-red-500 rounded-full origin-bottom"
            animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.7, 1, 0.7] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.12,
            }}
            style={{ height: h }}
          />
        ))}
      </div>
      <span
        dir="ltr"
        className="text-[13px] font-bold text-white/90 tabular-nums tracking-tight min-w-[24px] text-center"
      >
        {value}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   نقطة حمراء نابضة للدلالة على الحالة النشطة
   ═══════════════════════════════════════════════════════════════ */
function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   بطاقة المتحدث — نسخة محسّنة وبسيطة
   ═══════════════════════════════════════════════════════════════ */
export default function SpeakerCard({ speaker, onClick }: SpeakerCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      id={`speaker-${speaker.id}`}
      onClick={onClick}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={shouldReduceMotion ? {} : { y: -6 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      className="group relative cursor-pointer text-start w-full aspect-[4/5] rounded-[18px] overflow-hidden
        shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08)]
        hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),0_8px_24px_-8px_rgba(0,0,0,0.3)]
        transition-shadow duration-500 ease-out"
    >
      {/* الصورة كخلفية */}
      <div className="absolute inset-0 overflow-hidden rounded-[18px]">
        <Image
          src={speaker.imageUrl}
          alt={speaker.name}
          fill
          className="object-cover transition-all duration-700 ease-out
            saturate-[0.85] contrast-[1.05]
            group-hover:saturate-[0.95] group-hover:contrast-[1.08] group-hover:scale-[1.06]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* تدرج خلفي لتحسين قراءة النصوص */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[18px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.88) 85%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      {/* شارة الحالة أعلى اليمين */}
      {speaker.shortDescriptor && (
        <div
          className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3.5 py-1.5
            bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-full
            transition-all duration-300 ease-out
            group-hover:bg-white/[0.14] group-hover:border-white/[0.2]"
        >
          <LiveDot />
          <span
            dir="ltr"
            className="text-[12px] font-medium text-white/85 tracking-wide"
          >
            {speaker.shortDescriptor}
          </span>
        </div>
      )}

      {/* المحتوى النصي أسفل البطاقة */}
      <div className="absolute inset-x-0 bottom-0 px-[20px] pb-[20px] pt-8 flex flex-col gap-1.5">
        {/* الاسم + شارة الموجة */}
        <div className="flex items-end justify-between gap-3">
          <h3 className="font-bold text-[20px] text-white leading-[1.15] tracking-[-0.02em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
            <span dir="ltr" className="inline-block">
              {speaker.name}
            </span>
          </h3>
          {speaker.wave && <WaveBadge value={speaker.wave} />}
        </div>

        {/* عنوان المحاضرة */}
        {speaker.talkTitle && (
          <p className="text-[13px] text-white/50 leading-[1.4] truncate mt-0.5">
            <span dir="ltr" className="inline-block">
              {speaker.talkTitle}
            </span>
          </p>
        )}

        {/* فاصل متدرج */}
        <div
          className="h-px my-2"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* شريط سفلي متوهج يظهر عند التحويم */}
      <div
        className="absolute bottom-0 left-[20px] right-[20px] h-[2px] rounded-full opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 origin-left transition-all duration-500 ease-out"
        style={{
  background: "linear-gradient(90deg, #e62b1e, rgba(230,43,30,0.4), transparent)",
        }}
      />
    </motion.div>
  );
}