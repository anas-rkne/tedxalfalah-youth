/**
 * POST /api/qa/admin/answer — اعتماد/رفض جواب مفتوح.
 *
 * نفس مبدأ `moderate`: الإجراء **idempotent** (يأخذ الحالة النهائية صراحةً
 * ولا يقلب الحالي) فإعادة المحاولة أو نقرة مزدوجة تعطي النتيجة نفسها.
 *
 * ⚠️ الإجابة `approved` تظهر للمتحدث **فقط** — لا تُضاف إلى الشاشة الكبيرة
 * ولا صفحة الجمهور. سببها أن هذه أداة إرشاد للمتحدث لا قناة نشر.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateQaData } from "@/lib/qa/storage";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  sessionId: z.string().min(1).max(200),
  questionId: z.string().min(1).max(200),
  answerId: z.string().min(1).max(200),
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
  const { action, sessionId, questionId, answerId } = parsed.data;

  try {
    const result = await mutateQaData((data) => {
      const session = data.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error("session-not-found");
      const question = session.questions.find((q) => q.id === questionId);
      if (!question) throw new Error("question-not-found");
      const answer = (question.answers ?? []).find((a) => a.id === answerId);
      if (!answer) throw new Error("answer-not-found");

      if (action === "approve") {
        answer.status = "approved";
        answer.approvedAt = new Date().toISOString();
      } else {
        answer.status = "rejected";
        answer.approvedAt = undefined;
      }
      return answer;
    });

    return qaJson({ ok: true, answer: { id: result.id, status: result.status } });
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] answer moderation failed:", err);
    return qaError("Answer moderation failed", 500);
  }
}
