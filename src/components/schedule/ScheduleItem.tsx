"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRTL } from "@/hooks/useRTL";
import { Link } from "@/i18n/navigation";
import { Session } from "@/lib/types";
import { Mic, Coffee, Puzzle, ClipboardList, MapPin } from "lucide-react";

const TYPE_CONFIG: Record<
  Session["type"],
  { icon: typeof Mic; badgeClass: string; borderClass: string; dotClass: string }
> = {
  talk: {
    icon: Mic,
    badgeClass: "bg-tedx-red text-white",
    borderClass: "border-tedx-red",
    dotClass: "bg-tedx-red shadow-[0_0_10px_rgba(230,43,30,0.5)]",
  },
  break: {
    icon: Coffee,
    badgeClass: "bg-zinc-100 text-zinc-500",
    borderClass: "border-zinc-200",
    dotClass: "bg-zinc-300",
  },
  activation: {
    icon: Puzzle,
    badgeClass: "bg-black text-white",
    borderClass: "border-black",
    dotClass: "bg-zinc-800",
  },
  registration: {
    icon: ClipboardList,
    badgeClass: "bg-zinc-100 text-zinc-500",
    borderClass: "border-zinc-200",
    dotClass: "bg-zinc-300",
  },
};

interface ScheduleItemProps {
  session: Session;
  typeLabels: Record<string, string>;
  index: number;
}

const ScheduleItem = memo(function ScheduleItem({ session, typeLabels, index }: ScheduleItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();
  const config = TYPE_CONFIG[session.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.06 }}
      className="group relative"
    >
      <div
        className={`relative flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-2xl border ${config.borderClass} bg-card p-4 sm:p-6
          hover:shadow-[0_8px_30px_-12px_rgba(230,43,30,0.15)] hover:-translate-y-0.5
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden`}
      >
        {/* Hover glow */}
        <div
          className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 30% 20%, rgba(230,43,30,0.03), transparent 60%)",
          }}
        />

        {/* Time column */}
        <div className="flex sm:flex-col items-center sm:items-start gap-1 sm:gap-0 shrink-0 sm:w-28">
          <div className="flex items-center gap-1.5">
            <Icon size={14} className="text-tedx-red shrink-0 hidden sm:block" />
            <p className="font-bold text-sm text-foreground tabular-nums">
              {session.startTime} – {session.endTime}
            </p>
          </div>
          {session.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin size={10} className="shrink-0" />
              {session.location}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 relative z-10">
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full mb-2 ${config.badgeClass}`}
          >
            {typeLabels[session.type]}
          </span>
          <h3 className={`font-semibold text-base text-foreground ${isRTL ? "font-arabic" : ""}`}>
            {session.title}
          </h3>
          {session.speakerName && (
            <p className={`text-sm text-tedx-red mt-1 ${isRTL ? "font-arabic" : ""}`}>
              {session.speakerId ? (
                <Link
                  href={`/speakers#${session.speakerId}`}
                  className="hover:underline inline-flex items-center gap-1"
                >
                  {session.speakerName}
                </Link>
              ) : (
                session.speakerName
              )}
            </p>
          )}
          {session.description && (
            <p className={`text-sm text-muted-foreground mt-1.5 leading-relaxed ${isRTL ? "font-arabic" : ""}`}>
              {session.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default ScheduleItem;
