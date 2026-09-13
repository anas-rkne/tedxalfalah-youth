"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, Users, MessageSquare, ThumbsUp, Tag, Smile, Meh, Frown } from "lucide-react";
import Button from "@/components/ui/Button";

interface AnalyticsData {
  session: { id: string; title: string; createdAt: string };
  stats: {
    totalQuestions: number;
    approved: number;
    pending: number;
    rejected: number;
    answered: number;
    featured: number;
    anonymous: number;
    totalVotes: number;
    attendeeCount: number;
  };
  sentiment: { positive: number; negative: number; neutral: number };
  tags: Array<{ tag: string; count: number }>;
  topQuestions: Array<{ id: string; text: string; author: string; votes: number; featured: boolean }>;
  timeline: Array<{ hour: number; count: number }>;
  polls: Array<{ id: string; prompt: string; totalVotes: number; active: boolean }>;
}

interface Props {
  token: string;
  sessionId?: string;
}

export default function AnalyticsDashboard({ token, sessionId }: Props) {
  const t = useTranslations("qa");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = sessionId ? `?sessionId=${sessionId}` : "";
        const res = await fetch(`/api/qa/admin/analytics${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text().catch(() => "");
        const json = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(json.error || `Failed (HTTP ${res.status})`);
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [token, sessionId, refreshKey]);

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">{loading ? "Loading..." : "No data"}</p>;
  }

  const { stats, sentiment, tags, topQuestions, timeline } = data;
  const maxTimeline = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t("survey.adminTitle")}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label={t("analytics.totalQuestions")} value={stats.totalQuestions} />
        <StatCard icon={<Users className="h-4 w-4" />} label={t("analytics.attendees")} value={stats.attendeeCount} />
        <StatCard icon={<ThumbsUp className="h-4 w-4" />} label={t("analytics.totalVotes")} value={stats.totalVotes} />
        <StatCard icon={<Tag className="h-4 w-4" />} label={t("analytics.tags")} value={tags.length} />
      </div>

      {/* Status Breakdown */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">{t("analytics.statusBreakdown")}</h3>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600">{t("analytics.approved")}: {stats.approved}</span>
          <span className="text-amber-600">{t("analytics.pending")}: {stats.pending}</span>
          <span className="text-red-600">{t("analytics.rejected")}: {stats.rejected}</span>
          <span className="text-blue-600">{t("analytics.answered")}: {stats.answered}</span>
          <span className="text-zinc-500">{t("analytics.anonymous")}: {stats.anonymous}</span>
        </div>
      </div>

      {/* Sentiment */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">{t("analytics.sentiment")}</h3>
        <div className="flex gap-6">
          <SentimentBar icon={<Smile className="h-4 w-4 text-green-500" />} label={t("analytics.positive")} count={sentiment.positive} total={stats.totalQuestions} />
          <SentimentBar icon={<Meh className="h-4 w-4 text-amber-500" />} label={t("analytics.neutral")} count={sentiment.neutral} total={stats.totalQuestions} />
          <SentimentBar icon={<Frown className="h-4 w-4 text-red-500" />} label={t("analytics.negative")} count={sentiment.negative} total={stats.totalQuestions} />
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">{t("analytics.topTags")}</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t.tag} className="px-2 py-1 rounded-full bg-muted text-xs font-medium">
                {t.tag}: {t.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">{t("analytics.timeline")}</h3>
          <div className="flex items-end gap-1 h-24">
            {timeline.map((t) => (
              <div key={t.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-red-500/70 rounded-t"
                  style={{ height: `${(t.count / maxTimeline) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{t.hour}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Questions */}
      {topQuestions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">{t("analytics.topQuestions")}</h3>
          <div className="space-y-2">
            {topQuestions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-5">#{i + 1}</span>
                <span className="flex-1 truncate">{q.text}</span>
                <span className="text-red-400 font-bold">{q.votes}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="flex items-center justify-center text-muted-foreground mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function SentimentBar({ icon, label, count, total }: { icon: React.ReactNode; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span>{label}</span>
      <span className="font-bold">{count}</span>
      <span className="text-muted-foreground">({pct}%)</span>
    </div>
  );
}
