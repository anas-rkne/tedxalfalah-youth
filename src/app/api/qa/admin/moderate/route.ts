/**
 * POST /api/qa/admin/moderate — إدارة الأسئلة (الموافقة/الرفض/التمييز/الإجابة/العرض).
 *
 * الإجراءات (action) داخل { sessionId }:
 *   approve      { questionId }                  → اعتماد سؤال للعرض على الشاشة
 *   reject       { questionId }                  → حجب سؤال
 *   feature      { questionId, featured }        → تمييز/إلغاء تمييز
 *   answer       { questionId }                  → تعليم السؤال بـ "تم الإجابة"
 *   setVisibility { questionId, showOnSpeaker?, showOnLive? } → تحكم منفصل بالعرض (المتحدث/الشاشة)
 *   setSpeaker   { enabled }                     → تفعيل/تعطيل شاشة المتحدث للجلسة
 *
 * الحماية: requireAdmin (JWT) + rate limit للمشرف.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateQaData } from "@/lib/qa/storage";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    action: z.enum(["approve", "reject", "feature", "answer", "setVisibility", "setSpeaker"]),
    sessionId: z.string().min(1).max(200),
    questionId: z.string().min(1).max(200).optional(),
    featured: z.boolean().optional(),
    showOnSpeaker: z.boolean().optional(),
    showOnLive: z.boolean().optional(),
    enabled: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (["approve", "reject", "feature", "answer", "setVisibility"].includes(v.action) && !v.questionId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["questionId"], message: "questionId is required" });
    }
    if (v.action === "feature" && typeof v.featured !== "boolean") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["featured"], message: "featured is required" });
    }
    if (v.action === "setVisibility" && typeof v.showOnSpeaker !== "boolean" && typeof v.showOnLive !== "boolean") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["visibility"], message: "showOnSpeaker or showOnLive is required" });
    }
    if (v.action === "setSpeaker" && typeof v.enabled !== "boolean") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["enabled"], message: "enabled is required" });
    }
  });

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.session.role !== "admin") {
    return qaError("Admin role required", 403);
  }

  const { allowed } = await checkAdminApiRateLimit(request);
  if (!allowed) return qaError("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return qaError("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return qaError("Invalid payload", 400, parsed.error.flatten());
  }
  const { action, sessionId, questionId, featured, showOnSpeaker, showOnLive, enabled } = parsed.data;

  let result;
  try {
    result = await mutateQaData((data) => {
      const session = data.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error("session-not-found");

      if (action === "setSpeaker") {
        session.speakerEnabled = Boolean(enabled);
        return { id: session.id, speakerEnabled: session.speakerEnabled };
      }

      const q = session.questions.find((x) => x.id === questionId);
      if (!q) throw new Error("question-not-found");

      const now = new Date().toISOString();
      if (action === "approve") {
        q.status = "approved";
        q.approvedAt = now;
      } else if (action === "reject") {
        q.status = "rejected";
      } else if (action === "feature") {
        q.featured = Boolean(featured);
      } else if (action === "answer") {
        q.answered = !q.answered;
      } else if (action === "setVisibility") {
        if (typeof showOnSpeaker === "boolean") q.showOnSpeaker = showOnSpeaker;
        if (typeof showOnLive === "boolean") q.showOnLive = showOnLive;
      }
      return {
        id: q.id,
        status: q.status,
        featured: q.featured,
        answered: q.answered,
        showOnSpeaker: q.showOnSpeaker,
        showOnLive: q.showOnLive,
      };
    });
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] moderate failed:", err);
    return qaError("Moderation failed", 500);
  }

  return qaJson({ ok: true, result });
}
