"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Speaker } from "@/lib/types";

interface SpeakerCardProps {
  speaker: Speaker;
  onClick: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   شارة حالة نابضة — نسخة أنظف وأقل ضجيجاً
   ═══════════════════════════════════════════════════════════════ */
function StatusBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-xl border border-white/[0.08]">
      <span className="relative flex h-[6px] w-[6px]">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e62b1e] opacity-50" />
        <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-[#e62b1e]" />
      </span>
      <span className="text-[11px] font-semibold text-white/90 tracking-wide">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   بطاقة المتحدث — نسخة احترافية محسّنة
   ═══════════════════════════════════════════════════════════════ */
export default function SpeakerCard({ speaker, onClick }: SpeakerCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // ─── 3D Tilt Logic ───
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      id={`speaker-${speaker.id}`}
      onClick={onClick}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: shouldReduceMotion ? 0 : rotateX,
        rotateY: shouldReduceMotion ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative cursor-pointer w-full"
    >
      {/* ─── Outer Glow (soft, only on hover) ─── */}
      <div
        className={`absolute -inset-1.5 rounded-[22px] bg-gradient-to-b from-[#e62b1e]/10 via-[#e62b1e]/5 to-transparent blur-2xl transition-opacity duration-700 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* ─── Main Card Frame ─── */}
      <div
        className="relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-zinc-900/30 backdrop-blur-sm
          shadow-[0_4px_20px_-8px_rgba(0,0,0,0.35)]
          group-hover:shadow-[0_24px_60px_-15px_rgba(230,43,30,0.15),0_8px_32px_-8px_rgba(0,0,0,0.35)]
          transition-all duration-500 ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Dynamic Light Glare — follows mouse */}
        {!shouldReduceMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[18px]"
            style={{
              background: useTransform(
                [glareX, glareY],
                ([latestX, latestY]) =>
                  `radial-gradient(circle at ${latestX} ${latestY}, rgba(255,255,255,0.08) 0%, transparent 55%)`
              ),
            }}
          />
        )}

        {/* ─── Image Container ─── */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-[18px]">
          <Image
            src={speaker.imageUrl}
            alt={`صورة ${speaker.name}`}
            fill
            className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.05]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Gradient Overlay — Softer, more modern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.78) 88%, rgba(0,0,0,0.9) 100%)",
            }}
          />

          {/* ─── Top Right: Status Badge ─── */}
          {speaker.shortDescriptor && (
            <div className="absolute top-4 right-4 z-10">
              <StatusBadge label={speaker.shortDescriptor} />
            </div>
          )}

          {/* ─── Top Left: Arrow (appears smoothly on hover) ─── */}
          <div
            className={`absolute top-4 left-4 z-10 transition-all duration-500 ease-out ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 text-white transition-all duration-300 group-hover:bg-[#e62b1e] group-hover:border-[#e62b1e] group-hover:shadow-[0_0_20px_rgba(230,43,30,0.4)]">
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
            </div>
          </div>

          {/* ─── Bottom Content ─── */}
          <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16 z-10">
            {/* Speaker Name */}
            <h3
              className="text-[19px] sm:text-[21px] font-bold text-white leading-[1.15] tracking-[-0.02em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
              style={{ transform: "translateZ(20px)" }}
            >
              <span className="block w-full line-clamp-2 break-words">
                {speaker.name}
              </span>
            </h3>

            {/* Talk Title */}
            {speaker.talkTitle && (
              <p className="mt-2 text-[13px] sm:text-[14px] text-white/70 leading-relaxed line-clamp-2 font-medium">
                {speaker.talkTitle}
              </p>
            )}
          </div>
        </div>

        {/* ─── TEDx Bottom Accent Line ─── */}
        <div className="relative h-[2px] w-full overflow-hidden bg-zinc-800/40">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-[#e62b1e] to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "center" }}
          />
        </div>
      </div>
    </motion.div>
  );
}