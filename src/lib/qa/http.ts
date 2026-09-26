import { NextResponse } from "next/server";

/** يعيد استجابة JSON مع تعطيل التخزين المؤقت (لا نريد نسخاً قديمة). */
export function qaJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** يبني كائن خطأ موحّد. */
export function qaError(message: string, status: number, details?: unknown): NextResponse {
  return qaJson(details ? { error: message, details } : { error: message }, status);
}

/**
 * يُرجِع استجابة الخطأ المناسبة لخطأ منطقي معروف داخل دالة التعديل.
 * يُستخدم في try/catch حول mutate* لتفادي إرجاع 500 عام.
 */
export function qaErrorFromKnown(message: string): NextResponse | null {
  switch (message) {
    case "no-active-session":
      return qaError("No active session right now", 409);
    case "not-accepting":
      return qaError("This session is not accepting questions", 409);
    case "session-not-found":
      return qaError("Session not found", 404);
    case "question-not-found":
      return qaError("Question not found", 404);
    case "poll-not-found":
      return qaError("Poll not found", 404);
    case "poll-closed":
      return qaError("Poll is closed", 409);
    case "invalid-option":
      return qaError("Invalid option", 400);
    case "already-voted":
      return qaError("You have already voted on this poll", 409);
    case "attendee-not-registered":
      // لا نميّز بين "معرّف غير موجود" و"معرّف من جلسة أخرى" حتى لا نكشف
      // للمهاجم أي المعرّفات صالحة.
      return qaError("Join the session before participating", 403);
    case "already-submitted":
      return qaError("You have already submitted a survey for this session", 409);
    case "question-not-approved":
      // لا نميّز بين غير المعتمد والمرفوض — نفس الرسالة حتى لا نكشف
      // حالة سؤال بعينه لغير مصرّح له.
      return qaError("Question not found", 404);
    case "not-voted":
      return qaError("No vote recorded for this question", 409);
    case "answer-quota-reached":
      return qaError("You have reached the answer limit for this session", 429);
    case "question-not-answerable":
      // سؤال مرفوض أو محذوف: نستخدم نفس رسالة «غير موجود» حتى لا نكشف
      // عن وجود سؤال مرفوض لغير المصرّح له.
      return qaError("Question not found", 404);
    case "answer-not-found":
      return qaError("Answer not found", 404);
    default:
      return null;
  }
}
