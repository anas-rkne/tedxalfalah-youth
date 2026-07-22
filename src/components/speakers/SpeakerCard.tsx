"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Speaker } from "@/lib/types";
import { ArrowUpRight } from "lucide-react";

interface SpeakerCardProps {
  speaker: Speaker;
  onClick: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   Wave Badge — تصميم زجاجي أنيق
   ═══════════════════════════════════════════════════════════════ */
function WaveBadge({ value }: { value: string | number }) {
  const bars = [6, 12, 8, 14, 5];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md border border-white/10 rounded-full shadow-inner">
      <div className="flex items-end gap-[3px] h-3.5">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            // تم استخدام كود اللون الأحمر الصريح لضمان عمله في أي بيئة، يمكنك تعديله إلى bg-tedx-red
            className="w-[2px] bg-[#e62b1e] rounded-full origin-bottom"
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
            style={{ height: h }}
          />
        ))}
      </div>
      <span
        dir="ltr"
        className="text-[12px] font-semibold text-white tabular-nums tracking-wider"
      >
        {value}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Live Indicator — تأثير نبض ناعم ومضيء
   ═══════════════════════════════════════════════════════════════ */
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e62b1e] opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e62b1e] shadow-[0_0_10px_rgba(230,43,30,0.8)]" />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Speaker Card — Modern Premium Edition (Glassmorphism)
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
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover="hover" // استخدام Variants للتحكم بتأثيرات الـ Hover بشكل أنظف
      className="group relative cursor-pointer text-start w-full aspect-[3/4] rounded-[24px] overflow-hidden
        bg-neutral-900 shadow-lg isolation-auto border border-white/5"
    >
      {/* الصورة مع تأثير التكبير الناعم (Ken Burns) */}
      <motion.div
        variants={{
          hover: { scale: 1.05, filter: "saturate(1.1) brightness(0.95)" }
        }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 w-full h-full"
      >
        <Image
          src={speaker.imageUrl}
          alt={speaker.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </motion.div>

      {/* تدرج لوني عميق للقراءة (Bottom Scrim) */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* تدرج علوي خفيف للـ Badges */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60" />

      {/* القسم العلوي: الشارات (Badges) */}
      <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
        {speaker.shortDescriptor ? (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5
              bg-black/30 backdrop-blur-md border border-white/10 rounded-full
              transition-all duration-300 group-hover:bg-black/50"
          >
            <LiveDot />
            <span
              dir="ltr"
              className="text-[11px] font-semibold text-white uppercase tracking-widest"
            >
              {speaker.shortDescriptor}
            </span>
          </div>
        ) : <div />}
        
        {/* ظهور شارة الموجة عند الهوفر فقط لتقليل الازدحام البصري */}
        {speaker.wave && (
          <div className="transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-[0.22,1,0.36,1]">
            <WaveBadge value={speaker.wave} />
          </div>
        )}
      </div>

      {/* القسم السفلي: معلومات المتحدث (Glass Panel) */}
      <div className="absolute inset-x-0 bottom-0 p-4 z-10 flex flex-col justify-end">
        <motion.div
          variants={{
            hover: { y: 0, backgroundColor: "rgba(255,255,255,0.08)" }
          }}
          initial={{ y: 8 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-5 overflow-hidden
            shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <h3 className="font-bold text-[22px] text-white leading-tight tracking-tight drop-shadow-sm">
                <span dir="ltr" className="inline-block">
                  {speaker.name}
                </span>
              </h3>

              {speaker.talkTitle && (
                <p className="text-[14px] text-white/70 leading-snug line-clamp-2">
                  <span dir="ltr" className="inline-block">
                    {speaker.talkTitle}
                  </span>
                </p>
              )}
            </div>

            {/* زر التفاعل الدائري */}
            <div
              className="w-12 h-12 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center
                border border-white/20 group-hover:bg-[#e62b1e] group-hover:border-[#e62b1e] 
                group-hover:shadow-[0_0_20px_rgba(230,43,30,0.5)]
                transition-all duration-300 ease-out"
            >
              <ArrowUpRight
                size={22}
                className="text-white transform group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}