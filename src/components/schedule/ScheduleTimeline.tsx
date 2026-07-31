"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Session } from "@/lib/types";
import ScheduleItem from "./ScheduleItem";
import { FilterType } from "./FilterBar";
import { useRTL } from "@/hooks/useRTL";

interface ScheduleTimelineProps {
  sessions: Session[];
  typeLabels: Record<string, string>;
  activeFilter: FilterType;
  periodLabels: {
    morning: string;
    afternoon: string;
    evening: string;
  };
}

function getPeriod(startTime: string): "morning" | "afternoon" | "evening" {
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 16) return "afternoon";
  return "evening";
}

function formatPeriodLabel(
  label: string,
  isRTL: boolean
) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-tedx-red/40 to-transparent" />
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-tedx-red shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-tedx-red/40 to-transparent" />
    </div>
  );
}

const ScheduleTimeline = memo(function ScheduleTimeline({
  sessions,
  typeLabels,
  activeFilter,
  periodLabels,
}: ScheduleTimelineProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();

  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    function update() {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return sessions;
    return sessions.filter((s) => s.type === activeFilter);
  }, [sessions, activeFilter]);

  const grouped = useMemo(() => {
    const groups: { period: "morning" | "afternoon" | "evening"; sessions: Session[] }[] = [];
    const seen = new Set<string>();

    for (const session of filtered) {
      const period = getPeriod(session.startTime);
      const existing = groups.find((g) => g.period === period);
      if (existing) {
        existing.sessions.push(session);
      } else {
        groups.push({ period, sessions: [session] });
      }
    }
    return groups;
  }, [filtered]);

  const isLive = (startTime: string, endTime: string) => {
    if (!currentTime) return false;
    return currentTime >= startTime && currentTime <= endTime;
  };

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 opacity-30">📅</div>
        <p className="text-muted-foreground text-lg font-light">
          {activeFilter === "all"
            ? "No sessions yet. Stay tuned!"
            : `No ${activeFilter} sessions found.`}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {grouped.map((group) => (
        <div key={group.period} className="mb-12 last:mb-0">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            {formatPeriodLabel(periodLabels[group.period], isRTL)}
          </motion.div>

          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute start-[18px] sm:start-[26px] top-0 bottom-0 w-px bg-gradient-to-b from-tedx-red/30 via-tedx-red/20 to-transparent hidden sm:block" />

            <div className="flex flex-col gap-5">
              {group.sessions.map((session, idx) => {
                const live = isLive(session.startTime, session.endTime);
                return (
                  <div key={session.id} className="relative flex items-start gap-4 sm:gap-6">
                    {/* Timeline dot - desktop */}
                    <div className="hidden sm:flex flex-col items-center shrink-0 pt-2">
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-background ${
                          live
                            ? "bg-tedx-red shadow-[0_0_12px_rgba(230,43,30,0.6)] animate-pulse"
                            : "bg-zinc-300 group-hover:bg-tedx-red transition-colors duration-300"
                        }`}
                      />
                    </div>

                    {/* Card */}
                    <div className="flex-1 min-w-0">
                      {live && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tedx-red opacity-50" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-tedx-red" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-tedx-red">
                            LIVE
                          </span>
                        </div>
                      )}
                      <ScheduleItem
                        session={session}
                        typeLabels={typeLabels}
                        index={idx}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default ScheduleTimeline;
