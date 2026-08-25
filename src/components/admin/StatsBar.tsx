"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ApplicationRecord } from "./types";
import DailyTrendChart from "./charts/DailyTrendChart";
import TrackComparisonChart from "./charts/TrackComparisonChart";
import SourceBreakdownChart from "./charts/SourceBreakdownChart";

const OPEN_KEY = "tedx-admin-stats-open";

export default function StatsBar({
  applications,
  locale = "en",
}: {
  applications: ApplicationRecord[];
  locale?: string;
}) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(OPEN_KEY) !== "false";
  });

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(OPEN_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="rounded-[20px] border border-border bg-card mb-6 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-foreground hover:bg-zinc-50 transition-colors cursor-pointer"
      >
        <span>{t("statsBar.title")}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <DailyTrendChart applications={applications} locale={locale} />
          <TrackComparisonChart applications={applications} />
          <SourceBreakdownChart applications={applications} locale={locale} />
        </div>
      )}
    </div>
  );
}
