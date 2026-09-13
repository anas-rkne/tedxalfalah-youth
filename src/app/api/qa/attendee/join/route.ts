/**
 * POST /api/qa/attendee/join — تسجيل حضور خفيف للحاضر.
 *
 * يقبل { name } (اسم أو رمز اختياري). يُضاف الاسم مرة واحدة فقط
 * (لا تكرار) إلى الجلسة النشطة، ويعيد معرّف حضور بسيطاً يُستخدم
 * لتوثيق التصويت على الاستفتاءات (منع التصويت المزدوج من نفس الحضور).
 *
 * الحماية: عام + Rate limit + Turnstile + التحقق من الأصل.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateQaData } from "@/lib/qa/storage";
import { getActiveSession, newId } from "@/lib/qa/service";
import { escapeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-join");
  if (!allowed) return qaError("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return qaError("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return qaError("Invalid name", 400, parsed.error.flatten());
  }

  const isHuman = await verifyTurnstile(parsed.data.turnstileToken);
  if (!isHuman) return qaError("Verification failed. Please try again.", 403);

  const rawName = parsed.data.name;
  const displayName = escapeHtml(rawName);

  let result;
  try {
    result = await mutateQaData((data) => {
      const session = getActiveSession(data);
      if (!session) throw new Error("no-active-session");

      if (!session.attendeeNames.includes(displayName)) {
        session.attendeeNames.push(displayName);
        data.meta = {
          ...data.meta,
          totalAttendees: data.sessions.reduce((sum, s) => sum + s.attendeeNames.length, 0),
        };
      }
      return { attendeeId: newId("atn"), sessionId: session.id };
    });
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] join failed:", err);
    return qaError("Failed to register attendance", 500);
  }

  return qaJson({ ok: true, ...result }, 200);
}
