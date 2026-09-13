/**
 * POST /api/qa/poll/vote — تسجيل تصويت على استفتاء اختياري.
 *
 * يقبل { attendeeId, pollId, optionIndex }.
 * يمنع التصويت المزدوج من نفس الحضور بمعرّف حضور فريد.
 *
 * الحماية: عام + Rate limit + Turnstile + التحقق من الأصل.
 * ملاحظة: يستخدم mutateBoth لتحديث الملف الرئيسي وملف الأصوات في قفل واحد (ذرّي).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateBoth } from "@/lib/qa/storage";
import { getActiveSession } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  attendeeId: z.string().min(1).max(200),
  pollId: z.string().min(1).max(200),
  optionIndex: z.number().int().min(0),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-vote");
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

  const isHuman = await verifyTurnstile(parsed.data.turnstileToken);
  if (!isHuman) return qaError("Verification failed. Please try again.", 403);

  const { attendeeId, pollId, optionIndex } = parsed.data;

  let result;
  try {
    result = await mutateBoth(({ data, votes }) => {
      const session = getActiveSession(data);
      if (!session) throw new Error("no-active-session");

      const poll = session.polls.find((p) => p.id === pollId);
      if (!poll) throw new Error("poll-not-found");
      if (!poll.active) throw new Error("poll-closed");
      if (optionIndex >= poll.options.length) throw new Error("invalid-option");

      // منع التصويت المزدوج من نفس الحضور
      const already = votes.votes.some(
        (v) => v.pollId === pollId && v.voterId === attendeeId
      );
      if (already) throw new Error("already-voted");

      poll.tallies[optionIndex] = (poll.tallies[optionIndex] ?? 0) + 1;
      votes.votes.push({ sessionId: session.id, pollId, voterId: attendeeId, optionIndex });

      data.meta = {
        ...data.meta,
        totalVotes: data.sessions.reduce(
          (sum, s) => sum + s.polls.reduce((a, p) => a + p.tallies.reduce((x, y) => x + y, 0), 0),
          0
        ),
      };

      return {
        ok: true,
        pollId,
        optionIndex,
        tallies: [...poll.tallies],
        total: poll.tallies.reduce((a, b) => a + b, 0),
      };
    });
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] vote submit failed:", err);
    return qaError("Failed to record vote", 500);
  }

  return qaJson(result, 200);
}
