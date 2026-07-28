"use client";

import { useState, memo } from "react";
import { Session } from "@/lib/types";
import FilterBar, { FilterType } from "@/components/schedule/FilterBar";
import ScheduleTimeline from "@/components/schedule/ScheduleTimeline";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface SchedulePageClientProps {
  sessions: Session[];
  typeLabels: Record<string, string>;
  filterLabels: Record<string, string>;
  periodLabels: {
    morning: string;
    afternoon: string;
    evening: string;
  };
}

const SchedulePageClient = memo(function SchedulePageClient({
  sessions,
  typeLabels,
  filterLabels,
  periodLabels,
}: SchedulePageClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  return (
    <>
      <div className="mb-12">
        <FilterBar
          activeFilter={activeFilter}
          onChange={setActiveFilter}
          labels={filterLabels}
        />
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-6 opacity-20">📅</div>
          <p className="text-muted-foreground text-lg font-light">Full schedule coming soon.</p>
        </div>
      ) : (
        <>
          <ScheduleTimeline
            sessions={sessions}
            typeLabels={typeLabels}
            activeFilter={activeFilter}
            periodLabels={periodLabels}
          />

          <ScrollReveal>
            <div className="mt-16 text-center">
              <AnimatedSlidingButton href="/tickets" variant="primary" className="min-w-[180px]">
                Get Your Ticket
              </AnimatedSlidingButton>
            </div>
          </ScrollReveal>
        </>
      )}
    </>
  );
});

export default SchedulePageClient;
