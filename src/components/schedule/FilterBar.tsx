"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mic, Coffee, Puzzle, CalendarDays } from "lucide-react";

export type FilterType = "all" | "talk" | "break" | "activation";

interface FilterBarProps {
  activeFilter: FilterType;
  onChange: (filter: FilterType) => void;
  labels: Record<string, string>;
}

const FILTERS: { key: FilterType; icon: typeof Mic }[] = [
  { key: "all", icon: CalendarDays },
  { key: "talk", icon: Mic },
  { key: "break", icon: Coffee },
  { key: "activation", icon: Puzzle },
];

const FilterBar = memo(function FilterBar({ activeFilter, onChange, labels }: FilterBarProps) {
  const t = useTranslations("common");

  const handleKeyDown = useCallback((e: React.KeyboardEvent, filter: FilterType) => {
    const currentIdx = FILTERS.findIndex((f) => f.key === activeFilter);
    let nextIdx = currentIdx;
    if (e.key === "ArrowRight") nextIdx = (currentIdx + 1) % FILTERS.length;
    else if (e.key === "ArrowLeft") nextIdx = (currentIdx - 1 + FILTERS.length) % FILTERS.length;
    else return;
    e.preventDefault();
    onChange(FILTERS[nextIdx].key);
  }, [activeFilter, onChange]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label={t("ui.filterSessions")}>
      {FILTERS.map(({ key, icon: Icon }) => {
        const isActive = activeFilter === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={(e) => handleKeyDown(e, key)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
              isActive
                ? "bg-tedx-red text-white shadow-[0_4px_15px_rgba(230,43,30,0.3)]"
                : "bg-transparent border border-border text-muted-foreground hover:border-tedx-red/30 hover:text-tedx-red"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="filter-indicator"
                className="absolute inset-0 rounded-full bg-tedx-red"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon size={14} className="relative z-10" />
            <span className="relative z-10">{labels[key]}</span>
          </button>
        );
      })}
    </div>
  );
});

export default FilterBar;
