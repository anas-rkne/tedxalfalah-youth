"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { TeamMember } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════
   أيقونة LinkedIn
   ═══════════════════════════════════════════════════════════════ */
function LinkedInIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   شارة الحالة الحية – حمراء مع ظل أحمر
   ═══════════════════════════════════════════════════════════════ */
function LiveBadge() {
  return (
    <span className="absolute top-3.5 right-3.5 flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
    </span>
  );
}

interface TeamMemberCardProps {
  member: TeamMember;
}

/* ═══════════════════════════════════════════════════════════════
   بطاقة عضو الفريق – تصميم داكن عصري
   ═══════════════════════════════════════════════════════════════ */
export default function TeamMemberCard({ member }: TeamMemberCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="group relative rounded-3xl bg-white/[0.03] border border-white/[0.06] p-7 pb-5 overflow-hidden cursor-pointer
        hover:bg-white/[0.05] hover:border-white/[0.12]
        hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)]
        transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      whileHover={shouldReduceMotion ? {} : { y: -6 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* توهج خلفي عند التمرير */}
      <div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08), transparent 60%)",
        }}
      />

      <LiveBadge />

      {/* الصورة */}
      <div className="relative w-[88px] h-[88px] mx-auto mb-[18px]">
        <div
          className="absolute -inset-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "conic-gradient(from 180deg, rgba(99,102,241,0.4), rgba(168,85,247,0.3), rgba(236,72,153,0.2), rgba(99,102,241,0.4))",
            animation: "spin-border 3s linear infinite",
          }}
        />
        <div className="relative w-full h-full rounded-full overflow-hidden bg-[#1a1a20]">
          <Image
            src={member.imageUrl}
            alt={member.name}
            fill
            className="object-cover transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]
              saturate-[0.7] brightness-[0.9]
              group-hover:saturate-100 group-hover:brightness-100 group-hover:scale-[1.08]"
            sizes="88px"
          />
        </div>
      </div>

      <h3 className="font-bold text-base text-zinc-100 text-center tracking-[-0.01em] leading-[1.3]">
        {member.name}
      </h3>

      <p className="text-[13px] font-medium text-slate-400/70 text-center mt-1">
        {member.role}
      </p>

      <div
        className="h-px my-3.5"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
        }}
      />

      {member.linkedinUrl ? (
        <a
          href={member.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
              bg-blue-500/[0.08] border border-blue-500/[0.12]
              text-blue-400/80 text-xs font-semibold
              hover:bg-blue-500/[0.15] hover:border-blue-500/[0.25] hover:text-blue-400
              transition-all duration-300"
          >
            <LinkedInIcon size={14} />
            LinkedIn
          </span>
        </a>
      ) : member.quote ? (
        <p className="text-xs text-slate-400/45 text-center leading-relaxed italic px-2">
          <span className="text-indigo-400/40 text-lg font-serif mr-0.5">"</span>
          {member.quote}
        </p>
      ) : null}
    </motion.div>
  );
}