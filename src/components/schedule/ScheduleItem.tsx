"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRTL } from "@/hooks/useRTL";
import { Link } from "@/i18n/navigation";
import { Session } from "@/lib/types";

const TYPE_STYLES: Record<
  Session["type"],
  { badgeClass: string; borderClass: string }
> = {
  talk: {
    badgeClass: "bg-tedx-red text-tedx-white",
    borderClass: "border-tedx-red",
  },
  break: {
    badgeClass: "bg-tedx-gray-light text-tedx-gray",
    borderClass: "border-gray-200",
  },
  activation: {
    badgeClass: "bg-tedx-black text-tedx-white",
    borderClass: "border-tedx-black",
  },
  registration: {
    badgeClass: "bg-tedx-gray-light text-tedx-gray",
    borderClass: "border-gray-200",
  },
};

interface ScheduleItemProps {
  session: Session;
  typeLabels: Record<string, string>;
  index: number;
}

export default function ScheduleItem({ session, typeLabels, index }: ScheduleItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();
  const style = TYPE_STYLES[session.type];

  return (
    <motion.div
      className={`flex flex-col sm:flex-row gap-2 sm:gap-6 border-s-4 ${style.borderClass} bg-tedx-white rounded-e-lg p-4 sm:p-5 shadow-sm`}
      initial={shouldReduceMotion ? {} : { opacity: 0, x: isRTL ? 20 : -20 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
      whileHover={shouldReduceMotion ? {} : { y: -3, boxShadow: "0 8px 25px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
    >
      <div className="sm:w-32 flex-shrink-0">
        <p className="font-bold text-sm">
          {session.startTime} – {session.endTime}
        </p>
        {session.location && (
          <p className="text-xs text-tedx-gray mt-0.5">{session.location}</p>
        )}
      </div>

      <div className="flex-1">
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-1 ${style.badgeClass}`}
        >
          {typeLabels[session.type]}
        </span>
        <h3 className="font-semibold">{session.title}</h3>
        {session.speakerName && (
          <p className="text-sm text-tedx-red mt-0.5">
            {session.speakerId ? (
              <Link
                href={`/speakers#${session.speakerId}`}
                className="hover:underline"
              >
                {session.speakerName}
              </Link>
            ) : (
              session.speakerName
            )}
          </p>
        )}
        {session.description && (
          <p className="text-sm text-tedx-gray mt-1">{session.description}</p>
        )}
      </div>
    </motion.div>
  );
}
