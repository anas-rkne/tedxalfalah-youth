"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ApplicationRecord } from "../types";

const DAYS = 14;
const CHART_W = 560;
const CHART_H = 140;
const PAD = { top: 8, right: 8, bottom: 24, left: 28 };

const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function toDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function DailyTrendChart({
  applications,
  locale = "en",
}: {
  applications: ApplicationRecord[];
  locale?: string;
}) {
  const t = useTranslations("admin");

  const { bars, maxVal } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const keys: string[] = [];
    const labels: string[] = [];
    const dayLabels = locale === "ar" ? DAY_LABELS_AR : DAY_LABELS_EN;
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      keys.push(d.toISOString().slice(0, 10));
      labels.push(dayLabels[d.getDay()]);
    }

    const counts = new Map<string, number>();
    for (const app of applications) {
      const key = toDateKey(app.timestamp);
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    }

    const bars = keys.map((key, i) => ({
      key,
      label: labels[i],
      count: counts.get(key) || 0,
    }));
    const maxVal = Math.max(1, ...bars.map((b) => b.count));
    return { bars, maxVal };
  }, [applications, locale]);

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const barW = Math.floor(plotW / DAYS) - 2;
  const gap = plotW / DAYS;

  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        {t("statsBar.daily")}
      </p>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Daily submissions chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD.top + plotH * (1 - frac);
          const val = Math.round(maxVal * frac);
          return (
            <g key={frac}>
              <line
                x1={PAD.left}
                y1={y}
                x2={CHART_W - PAD.right}
                y2={y}
                stroke="#e4e4e7"
                strokeWidth={0.5}
              />
              <text
                x={PAD.left - 4}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-400"
                fontSize={9}
              >
                {val}
              </text>
            </g>
          );
        })}

        {bars.map((bar, i) => {
          const x = PAD.left + i * gap + (gap - barW) / 2;
          const h = maxVal > 0 ? (bar.count / maxVal) * plotH : 0;
          const y = PAD.top + plotH - h;
          return (
            <g key={bar.key}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={3}
                className="fill-tedx-red"
                opacity={0.85}
              />
              {bar.count > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 3}
                  textAnchor="middle"
                  className="fill-zinc-600"
                  fontSize={8}
                  fontWeight={600}
                >
                  {bar.count}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={CHART_H - 4}
                textAnchor="middle"
                className="fill-zinc-400"
                fontSize={7}
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
