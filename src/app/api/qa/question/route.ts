/**
 * POST /api/qa/question — إرسال سؤال مفتوح من الحاضر.
 *
 * يقبل { attendeeId, name, text }. يُضاف السؤال بحالة "pending"
 * بانتظار موافقة المشرف قبل عرضه على الشاشة.
 *
 * الحماية: عام + Rate limit + Turnstile + التحقق من الأصل + تعقيم النص.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { distance } from "fastest-levenshtein";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateQaData } from "@/lib/qa/storage";
import { getActiveSession, newId } from "@/lib/qa/service";
import { escapeHtml } from "@/lib/sanitize";
import type { QaQuestion } from "@/lib/qa/types";

export const dynamic = "force-dynamic";

/**
 * يحسب مدى التشابه بين نصين (0 = متطابقان، 1 = مختلفان تمامًا).
 * يُستخدم Levenshtein distance مُقسّمة على أطول نص.
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance(a, b) / maxLen;
}

/** تحليل مشاعر بسيط بالكلمات المفتاحية (عربي + إنكليزي). */
function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positiveWords = [
    "ممتاز", "رائع", "جميل", "أحب", "شكراً", "مفيد", "مذهل",
    "excellent", "amazing", "great", "love", "wonderful", "good", "best",
    "fantastic", "brilliant", "awesome", "nice", "happy", "inspire", "inspired",
    "إبداع", "مبدع", "متفوق", "مُلهم",
  ];
  const negativeWords = [
    "سيء", "مشكلة", "غلط", "خطأ", "محزن", "لا أستطيع",
    "bad", "terrible", "awful", "horrible", "worst", "hate", "stupid",
    "disappointing", "poor", "wrong", "problem", "fail", "مشكل", "صعب",
  ];
  let pos = 0;
  let neg = 0;
  for (const w of positiveWords) if (lower.includes(w)) pos++;
  for (const w of negativeWords) if (lower.includes(w)) neg++;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

const schema = z.object({
  attendeeId: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(60).optional(),
  text: z.string().trim().min(2).max(300),
  anonymous: z.boolean().optional(),
  tag: z.string().trim().max(40).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-question");
  if (!allowed) return qaError("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return qaError("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return qaError("Invalid question", 400, parsed.error.flatten());
  }

  const isHuman = await verifyTurnstile(parsed.data.turnstileToken);
  if (!isHuman) return qaError("Verification failed. Please try again.", 403);

  const safeText = escapeHtml(parsed.data.text);
  const isAnonymous = parsed.data.anonymous === true;
  const safeAuthor = isAnonymous ? "Anonymous" : escapeHtml(parsed.data.name?.trim() || "Anonymous");
  const tag = parsed.data.tag ? escapeHtml(parsed.data.tag) : undefined;

  // تحليل المشاعر
  const sentiment = analyzeSentiment(safeText);

  let created;
  let duplicateOf: string | null = null;
  try {
    created = await mutateQaData((data) => {
      const session = getActiveSession(data);
      if (!session) throw new Error("no-active-session");
      if (!session.acceptingQuestions) throw new Error("not-accepting");

      // كشف المكرر: مقارنة النص الجديد مع الأسئلة المعتمدة والقيد الانتظار
      const activeQuestions = session.questions.filter(
        (q) => q.status === "approved" || q.status === "pending"
      );
      for (const existing of activeQuestions) {
        const sim = similarity(safeText.toLowerCase(), existing.text.toLowerCase());
        if (sim >= 0.75) {
          duplicateOf = existing.id;
          // لا نُضيف السؤال — نُعيد معلومات المكرر
          return { id: existing.id, status: existing.status, featured: existing.featured, duplicate: true };
        }
      }

      const q: QaQuestion = {
        id: newId("q"),
        author: safeAuthor,
        text: safeText,
        votes: 0,
        status: "pending",
        createdAt: new Date().toISOString(),
        featured: false,
        anonymous: isAnonymous,
        sentiment,
        tag,
      };
      session.questions.push(q);
      data.meta = {
        ...data.meta,
        totalQuestions: data.sessions.reduce((sum, s) => sum + s.questions.length, 0),
      };
      return q;
    });
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] question submit failed:", err);
    return qaError("Failed to submit question", 500);
  }

  if (duplicateOf) {
    return qaJson({ ok: true, duplicate: true, duplicateOf });
  }

  return qaJson({ ok: true, question: { id: created.id, status: created.status } }, 201);
}
