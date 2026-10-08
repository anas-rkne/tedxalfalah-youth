"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, Users, MessageSquare, ThumbsUp, Tag, Smile, Meh, Frown } from "lucide-react";
import Button from "@/components/ui/Button";
import SurveyInbox from "@/components/qa/SurveyInbox";

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
  /**
   * استدعاؤه عند 401/403 ليتفكك المشرف من اللوحة الأم.
   *
   * ⚠️ بدونه كان هذا القسم يعرض "Unauthorized" كنص أحمر صغير في أسفل
   * الصفحة، بينما اللوحة الرئيسية تبدو سليمة — فيظن المشرف أن البيانات
   * ناقصة، بينما الجلسة منتهية أصلاً ولا تنفع فيها إعادة التحميل.
   */
  onUnauthorized?: () => void;
}

export default function AnalyticsDashboard({ token, sessionId, onUnauthorized }: Props) {
  const t = useTranslations("qa");
  const [data, setData] = useState<AnalyticsData | null>(null);
  /**
   * ⚠️ `true` لا `false`: مع `false` كانت أول صورة تُرسم قبل أن يبدأ
   * `useEffect` تُظهر «لا بيانات» ثم تنقلب إلى «جارٍ التحميل» إطاراً
   * واحداً. على شبكة القاعة البطيئة تلاحِظ الومضة، فيُقرأ الصفرُ
   * حقيقةً زائفة: «لا بيانات» بينما الطلب لم يصل بعد.
   */
  const [loading, setLoading] = useState(true);
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
        // 401/403 = التوكن منتهٍ: مسار مختلف عن فشل جلب عادي.
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) onUnauthorized?.();
          return;
        }
        if (!res.ok) throw new Error(json.error || `Failed (HTTP ${res.status})`);
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("analytics.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [token, sessionId, refreshKey, onUnauthorized]);

  if (error) {
    /**
     * ⚠️ كان سطراً أحمر مجرّداً بلا زر: المشرف في القاعة وخطؤه الشبكي
     * لا يعرف ما يفعل، و«تحديث» الخاص باللوحة أعلى الصفحة بعيد. فصار
     * الخطأ نفسه يحمل زر إعادة المحاولة — وبه `loading` فلا يُضغط مرتين.
     */
    return (
      <div className="flex flex-wrap items-center gap-3" role="alert" data-testid="qa-analytics-error">
        <span className="text-red-600 text-sm">{error}</span>
        <Button
          variant="outline"
          size="sm"
          data-testid="qa-analytics-retry"
          loading={loading}
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          {t("analytics.retry")}
        </Button>
{/*
        🎯 صندوق ردود الاستبيان كان الفجوة F2 كاملة: `/api/qa/survey`
        يقرأ التعليقات والمقاييس ومفاتيح ترجمتها موجودة، ولا شيء يعرضها.
        يُركَّب هنا لا في لوحة المشرف منفصلاً، ليأخذ نفس التوكن ونفس
        `data.session.id` (وهو فعّال، بخلاف `sessionId` prop قد يكون
        فارغاً — و`GET /api/qa/survey` يرفض بـ400 بلا `sessionId`).
      */}
      </div>
  );
}

  if (!data) {
    // ⚠️ كان `"Loading..." : "No data"` نصّين حرفيين: إنجليزيّان داخل
    // لوحة تُعرض في جلسة عربية، وغير قابلين للترجمة أصلاً.
    return (
      <p className="text-muted-foreground text-sm" data-testid="qa-analytics-empty">
        {loading ? t("analytics.loading") : t("analytics.noData")}
      </p>
    );
  }

  const { stats, sentiment, tags, topQuestions, timeline } = data;
  const maxTimeline = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="space-y-6" data-testid="qa-analytics">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t("survey.adminTitle")}
        </h2>
        {/* ⚠️ كان `Refresh` مكتوباً بالنص الحرفي: يظهر إنجليزياً في
            الواجهة العربية، ويكسر أي اختبار يفحص الترجمة. */}
        <Button
          variant="outline"
          size="sm"
          data-testid="qa-analytics-refresh"
          onClick={() => setRefreshKey((k) => k + 1)}
          loading={loading}
        >
          {t("refresh")}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          testId="qa-stat-total-questions"
          icon={<MessageSquare className="h-4 w-4" />}
          label={t("analytics.totalQuestions")}
          value={stats.totalQuestions}
        />
        <StatCard
          testId="qa-stat-attendees"
          icon={<Users className="h-4 w-4" />}
          label={t("analytics.attendees")}
          value={stats.attendeeCount}
        />
        <StatCard
          testId="qa-stat-total-votes"
          icon={<ThumbsUp className="h-4 w-4" />}
          label={t("analytics.totalVotes")}
          value={stats.totalVotes}
        />
        <StatCard
          testId="qa-stat-tags"
          icon={<Tag className="h-4 w-4" />}
          label={t("analytics.tags")}
          value={tags.length}
        />
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

      {/* 🎯 صندوق ردود الاستبيان كان الفجوة F2 كاملة: `/api/qa/survey`
          يقرأ التعليقات والمقاييس ومفاتيح ترجمتها موجودة، ولا شيء يعرضها.
          يُركَّب هنا لا في لوحة المشرف منفصلاً، ليأخذ نفس التوكن ونفس
          `data.session.id` (وهو فعّال دائماً، بخلاف `sessionId` prop الذي
          قد يكون فارغاً — و`GET /api/qa/survey` يرفض بـ400 بلا `sessionId`). */}
      <SurveyInbox
        token={token}
        sessionId={data.session.id}
        onUnauthorized={onUnauthorized}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  testId: string;
}) {
  return (
    <div data-testid={testId} className="rounded-xl border border-border bg-card p-3 text-center">
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
