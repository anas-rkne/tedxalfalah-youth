/**
 * POST /api/qa/question/vote — التصويت على سؤال مفتوح.
 *
 * ⚠️ لماذا هذه النقطة جديدة؟
 * كان الحقل `QaQuestion.votes` يُنشأ دائماً عند 0 ولا توجد **أي** نقطة تصويت
 * على الأسئلة في النظام. أي أن الفرز في شاشة العرض، و`topQuestions` في لوحة
 * التحليلات، و`meta.totalVotes` — كلها كانت تعرض أرقاماً ثابتة لا تعكس الواقع.
 * واستيراد أيقونة `Vote` في واجهة الحضور كان بلا استخدام فعلي.
 *
 * يقبل { attendeeId, questionId }.
 *
 * القواعد:
 *  - الحاضر يجب أن يكون مسجَّلاً في الجلسة النشطة (سجل الخادم، لا العميل).
 *  - السؤال يجب أن يكون `approved` فقط. المرفوض والمعلّق يُعامَلان كـ"غير موجود"
 *    حتى لا نكشف حالة سؤال بعينه لمن لا صلاحية له.
 *  - صوت واحد لكل (سؤال، حاضر) — التكرار خطأ 409.
 *  - يُحفظ السجل في ملف الأصوات منفصل، و`q.votes` عدّاد مشتقّ يُحدَّث في نفس
 *    المعاملة الذرّية، ثم يُعاد حساب `meta` من المصدر.
 *
 * الحماية: عام + Rate limit + التحقق من الأصل.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateBoth } from "@/lib/qa/storage";
import { findAttendee, getActiveSession, getSessionById, recomputeMeta } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  attendeeId: z.string().min(1).max(200),
  questionId: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-question-vote");
  if (!allowed) return qaError("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return qaError("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return qaError("Invalid vote", 400, parsed.error.flatten());
  }

  const { attendeeId, questionId } = parsed.data;

  try {
    const result = await mutateBoth(({ data, votes }) => {
      const session = getActiveSession(data);
      if (!session) throw new Error("no-active-session");

      if (!findAttendee(session, attendeeId)) throw new Error("attendee-not-registered");

      const question = session.questions.find((q) => q.id === questionId);
      if (!question) throw new Error("question-not-found");
      // المعلّق والمرفوض يُعامَلان كغير موجود: لا نكشف حالة سؤال لمن لا صلاحية له،
      // ولا نسمح بالتصويت قبل أن يراه الحضور أصلاً.
      if (question.status !== "approved") throw new Error("question-not-approved");

      const already = votes.questionVotes.some(
        (v) => v.questionId === questionId && v.voterId === attendeeId
      );
      if (already) throw new Error("already-voted");

      votes.questionVotes.push({ sessionId: session.id, questionId, voterId: attendeeId });
      question.votes = (question.votes ?? 0) + 1;

      data.meta = recomputeMeta(data, votes);

      return { questionId, votes: question.votes };
    });

    return qaJson({ ok: true, ...result }, 200);
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] question vote failed:", err);
    return qaError("Failed to record vote", 500);
  }
}

/**
 * DELETE /api/qa/question/vote — سحب صوتpreviously cast.
 *
 * الحاضر قد يغيّر رأيه، وقطع الطريق الوحيد أمامه عند النقر على سؤال بالخطأ
 * أمر غير معقول. السجل يُحذف و`q.votes` و`meta` يُعاد حسابهما ذرّياً.
 */
export async function DELETE(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-question-vote");
  if (!allowed) return qaError("Too many requests", 429);

  const { searchParams } = new URL(request.url);
  const attendeeId = searchParams.get("attendeeId") ?? "";
  const questionId = searchParams.get("questionId") ?? "";
  if (!attendeeId || !questionId) {
    return qaError("attendeeId and questionId are required", 400);
  }

  try {
    const result = await mutateBoth(({ data, votes }) => {
      const session = getActiveSession(data);
      if (!session) throw new Error("no-active-session");
      if (!findAttendee(session, attendeeId)) throw new Error("attendee-not-registered");

      const idx = votes.questionVotes.findIndex(
        (v) => v.questionId === questionId && v.voterId === attendeeId
      );
      if (idx === -1) throw new Error("not-voted");

      const [removed] = votes.questionVotes.splice(idx, 1);
      const owner = getSessionById(data, removed.sessionId);
      const question = owner?.questions.find((q) => q.id === questionId);
      if (question) {
        question.votes = Math.max(0, (question.votes ?? 0) - 1);
      }

      data.meta = recomputeMeta(data, votes);

      return { questionId, votes: question?.votes ?? 0 };
    });

    return qaJson({ ok: true, ...result }, 200);
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] question vote undo failed:", err);
    return qaError("Failed to undo vote", 500);
  }
}
