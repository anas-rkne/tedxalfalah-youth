"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquareQuote, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * صندوق ردود الاستبيان للمشرف — الإغلاق الفعلي لفجوة F2.
 *
 * 🎯 الفجوة: الردود تُخزَّن وتُقرأ من `/api/qa/survey`، ومفاتيح الترجمة
 * لعرضها كانت مكتوبة (`avgNps`, `promoters`, ...) منذ البداية، ولا شيء
 * يعرضها. فكان السؤال وجدت: الحاضر يملأ استمارة، والملف يمتلئ، **والمشرف
 * لا يعرف أن أحداً أجاب**. لا واجهة ⇒ صفر اكتشاف ⇒ صفر تحسين.
 *
 * ⛔ لا يُعرض المقياس بلا الردود الحرة: `npsScore` وحده رقمٌ مجرّد يُقرأ
 * كحكم على الفعالية من خمس إجابات. لذا التوزيع (promoters/passives/
 * detractors) والتعليقات معاً، والردود مرتّبة من الأحدث.
 */
interface SurveyResponse {
  id: string;
  attendeeId: string;
  nps: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface SurveyData {
  total: number;
  avgNps: number;
  avgRating: number;
  npsScore: number;
  npsBreakdown: { promoters: number; passives: number; detractors: number };
  responses: SurveyResponse[];
}

interface Props {
  token: string;
  /** مطلوب: `GET /api/qa/survey` يرفض بلا `sessionId` بـ400. */
  sessionId?: string;
  onUnauthorized?: () => void;
}

export default function SurveyInbox({ token, sessionId, onUnauthorized }: Props) {
  const t = useTranslations("qa");
  const [data, setData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // ⛔ بلا `setLoading` هنا: بلا `sessionId` نُعيد `null` أصلاً، فلا حالة
    //    تُعرض. و`setState` متزامن داخل التأثير يرسم مرّة ثانية (قاعدة
    //    react-hooks/eslint) بلا فائدة تُرى.
    if (!sessionId) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/qa/survey?sessionId=${encodeURIComponent(sessionId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const text = await res.text().catch(() => "");
        const json = text ? JSON.parse(text) : {};
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) onUnauthorized?.();
          return;
        }
        if (!res.ok) throw new Error(json.error || `Failed (HTTP ${res.status})`);
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("survey.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, sessionId, refreshKey, onUnauthorized, t]);

  if (!sessionId) return null;

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-4" data-testid="qa-survey-error" role="alert">
        <p className="text-red-600 text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          data-testid="qa-survey-retry"
          loading={loading}
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          {t("survey.retry")}
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="qa-survey-loading">
        {loading ? t("analytics.loading") : ""}
      </p>
    );
  }

  const { total, avgNps, avgRating, npsScore, npsBreakdown, responses } = data;

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3" data-testid="qa-survey-inbox">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4" />
          {t("survey.inbox")}
        </h3>
        <Button
          variant="outline"
          size="sm"
          data-testid="qa-survey-refresh"
          loading={loading}
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground text-sm" data-testid="qa-survey-empty">
          {t("survey.empty")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SurveyStat testId="qa-survey-total" label={t("survey.total")} value={total} />
            <SurveyStat testId="qa-survey-nps" label={t("survey.npsScore")} value={npsScore} />
            <SurveyStat testId="qa-survey-avg-nps" label={t("survey.avgNps")} value={avgNps} />
            <SurveyStat testId="qa-survey-avg-rating" label={t("survey.avgRating")} value={avgRating} />
            <div className="rounded-lg bg-muted/40 p-2 text-center text-xs" data-testid="qa-survey-breakdown">
              <span className="text-green-600">{t("survey.promoters")}: {npsBreakdown.promoters}</span>
              {" · "}
              <span className="text-amber-600">{t("survey.passives")}: {npsBreakdown.passives}</span>
              {" · "}
              <span className="text-red-600">{t("survey.detractors")}: {npsBreakdown.detractors}</span>
            </div>
          </div>

          {/* ⚠️ الأحدث أولاً: الخادم يقصّ آخر 50 رداً ويردّها بترتيب
              الإرسال (الأقدم أولاً)، والمشرف يقرأ ردود آخر فعالية. */}
          <ul className="space-y-2" data-testid="qa-survey-responses">
            {[...responses].reverse().map((r) => (
              <li
                key={r.id}
                data-testid="qa-survey-response"
                className="rounded-lg border border-border p-2 text-sm flex flex-col gap-1"
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span data-testid="qa-survey-response-nps">NPS {r.nps}/10</span>
                  <span data-testid="qa-survey-response-rating">{t("survey.rating")} {r.rating}/5</span>
                  <span className="ml-auto">{new Date(r.createdAt).toLocaleTimeString()}</span>
                </div>
                {r.comment ? (
                  <p className="text-foreground" data-testid="qa-survey-comment">
                    {r.comment}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic" data-testid="qa-survey-comment-empty">
                    {t("survey.noComment")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function SurveyStat({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2 text-center" data-testid={testId}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}