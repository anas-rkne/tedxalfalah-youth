"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ApplicationRecord } from "../types";

const SIZE = 120;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * RADIUS;

const COLORS = {
  "young-speaker": "#3b82f6",
  expert: "#a855f7",
} as const;

export default function TrackComparisonChart({
  applications,
}: {
  applications: ApplicationRecord[];
}) {
  const t = useTranslations("admin");

  const { young, expert, total } = useMemo(() => {
    let young = 0;
    let expert = 0;
    for (const app of applications) {
      if (app.track === "expert") expert++;
      else young++;
    }
    return { young, expert, total: young + expert };
  }, [applications]);

  const youngPct = total > 0 ? young / total : 0;

  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        {t("statsBar.byTrack")}
      </p>
      <div className="relative">
        <svg width={SIZE} height={SIZE} role="img" aria-label="Track comparison">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={COLORS["young-speaker"]}
            strokeWidth={STROKE}
            strokeDasharray={`${youngPct * CIRCUM} ${(1 - youngPct) * CIRCUM}`}
            strokeDashoffset={CIRCUM * 0.25}
            strokeLinecap="round"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={COLORS.expert}
            strokeWidth={STROKE}
            strokeDasharray={`${(1 - youngPct) * CIRCUM} ${youngPct * CIRCUM}`}
            strokeDashoffset={CIRCUM * 0.25 - youngPct * CIRCUM}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-foreground">{total}</span>
        </div>
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: COLORS["young-speaker"] }}
          />
          {t("tracks.young-speaker")}: {young}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: COLORS.expert }}
          />
          {t("tracks.expert")}: {expert}
        </span>
      </div>
    </div>
  );
}
