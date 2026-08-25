"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ApplicationRecord } from "../types";

const BAR_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
];

const SOURCE_LABELS_EN: Record<string, string> = {
  "Social Media": "Social Media",
  "Friend/Family": "Friend/Family",
  School: "School",
  "Partner Organization": "Partner Org",
  Other: "Other",
};

const SOURCE_LABELS_AR: Record<string, string> = {
  "Social Media": "التواصل",
  "Friend/Family": "صديق/عائلة",
  School: "المدرسة",
  "Partner Organization": "شريك",
  Other: "أخرى",
};

export default function SourceBreakdownChart({
  applications,
  locale = "en",
}: {
  applications: ApplicationRecord[];
  locale?: string;
}) {
  const t = useTranslations("admin");

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of applications) {
      const src = app.howHeardAboutUs || "Other";
      counts.set(src, (counts.get(src) || 0) + 1);
    }
    const labels = locale === "ar" ? SOURCE_LABELS_AR : SOURCE_LABELS_EN;
    return [...counts.entries()]
      .map(([source, count], i) => ({
        source,
        label: labels[source] || source,
        count,
        color: BAR_COLORS[i % BAR_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [applications, locale]);

  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        {t("statsBar.bySource")}
      </p>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.source} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-right text-muted-foreground truncate shrink-0">
              {row.label}
            </span>
            <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(row.count / maxCount) * 100}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
            <span className="w-6 text-right font-semibold tabular-nums">
              {row.count}
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            —
          </p>
        )}
      </div>
    </div>
  );
}
