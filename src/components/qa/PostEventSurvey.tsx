"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star, Send, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface Props {
  sessionId: string;
  attendeeId: string;
  onClose?: () => void;
}

export default function PostEventSurvey({ sessionId, attendeeId, onClose }: Props) {
  const t = useTranslations("qa");
  const [nps, setNps] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (nps === null || rating === 0) {
      setError(t("survey.fillRequired"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/qa/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, attendeeId, nps, rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("survey.submitError"));
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("survey.thanks")}</h2>
        <p className="text-muted-foreground">{t("survey.thanksMessage")}</p>
        {onClose && (
          <Button className="mt-6" variant="outline" onClick={onClose}>
            {t("survey.close")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center mb-1">{t("survey.title")}</h2>
      <p className="text-center text-muted-foreground text-sm mb-6">{t("survey.subtitle")}</p>

      {/* NPS */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{t("survey.npsQuestion")}</label>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setNps(i)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                nps === i
                  ? i <= 6
                    ? "bg-red-500 text-white"
                    : i <= 8
                    ? "bg-amber-500 text-white"
                    : "bg-green-500 text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{t("survey.notLikely")}</span>
          <span>{t("survey.veryLikely")}</span>
        </div>
      </div>

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{t("survey.ratingQuestion")}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-1"
            >
              <Star
                className={`h-8 w-8 transition ${
                  star <= (hoveredStar || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{t("survey.commentOptional")}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t("survey.commentPlaceholder")}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
        <div className="text-right text-xs text-muted-foreground">{comment.length}/500</div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <Button className="w-full" loading={sending} loadingText={t("survey.submitting")} onClick={handleSubmit}>
        <Send className="h-4 w-4 mr-2" />
        {t("survey.submit")}
      </Button>
    </div>
  );
}
