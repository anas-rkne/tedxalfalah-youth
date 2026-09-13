/**
 * POST /api/qa/admin/poll — إدارة الاستفتاءات الاختيارية.
 *
 * الإجراءات (action) داخل { sessionId }:
 *   create      { prompt, promptAr?, options[], optionsAr?[] } → إنشاء استفتاء
 *   start       { pollId }          → بدء التصويت (active=true)
 *   stop        { pollId }          → إيقاف التصويت (active=false)
 *   showResults { pollId, show }    → فتح/إخفاء النتائج
 *   delete      { pollId }          → حذف استفتاء
 *
 * الحماية: requireAdmin (JWT) + rate limit للمشرف.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateQaData, mutateBoth } from "@/lib/qa/storage";
import { newId } from "@/lib/qa/service";
import { escapeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    action: z.enum(["create", "start", "stop", "showResults", "delete"]),
    sessionId: z.string().min(1).max(200).optional(),
    pollId: z.string().min(1).max(200).optional(),
    prompt: z.string().trim().min(1).max(200).optional(),
    promptAr: z.string().trim().max(200).optional(),
    options: z.array(z.string().trim().min(1).max(120)).min(2).max(6).optional(),
    optionsAr: z.array(z.string().trim().max(120)).optional(),
    show: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.action === "create") {
      if (!v.sessionId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sessionId"], message: "sessionId required" });
      if (!v.prompt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["prompt"], message: "prompt required to create" });
      if (!v.options || v.options.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "At least 2 options required" });
    } else {
      if (!v.sessionId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sessionId"], message: "sessionId required" });
      if (!v.pollId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pollId"], message: "pollId required" });
      if (v.action === "showResults" && typeof v.show !== "boolean") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["show"], message: "show required" });
      }
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
  const { action, sessionId, pollId, prompt, promptAr, options, optionsAr, show } = parsed.data;

  const run = () => mutateQaData((data) => {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error("session-not-found");

    if (action === "create") {
      const cleanedOptions = (options as string[]).map((o) => escapeHtml(o));
      const cleanedOptionsAr = (optionsAr as string[] | undefined)?.map((o) => escapeHtml(o));
      const now = new Date().toISOString();
      const poll = {
        id: newId("p"),
        prompt: escapeHtml(prompt as string),
        promptAr: promptAr ? escapeHtml(promptAr) : undefined,
        options: cleanedOptions,
        optionsAr: cleanedOptionsAr,
        tallies: cleanedOptions.map(() => 0),
        active: false,
        showResults: false,
        createdAt: now,
      };
      session.polls.push(poll);
      return { id: poll.id };
    }

    const poll = session.polls.find((p) => p.id === pollId);
    if (!poll) throw new Error("poll-not-found");

    if (action === "start") {
      poll.active = true;
      poll.showResults = false;
    } else if (action === "stop") {
      poll.active = false;
      poll.showResults = true;
    } else if (action === "showResults") {
      poll.showResults = Boolean(show);
      if (poll.showResults) poll.active = false;
    } else if (action === "delete") {
      session.polls = session.polls.filter((p) => p.id !== pollId);
      return { deleted: true, id: pollId };
    }
    return { ok: true, id: pollId };
  });

  // عند الحذف نحتاج أيضًا حذف الأصوات المرتبطة بالاستفتاء
  const runWithVoteCleanup = async () => {
    if (action !== "delete") return run();
    return mutateBoth(({ data, votes }) => {
      const session = data.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error("session-not-found");
      session.polls = session.polls.filter((p) => p.id !== pollId);
      votes.votes = votes.votes.filter((v) => v.pollId !== pollId);
      return { deleted: true, id: pollId };
    });
  };

  let result;
  try {
    result = await runWithVoteCleanup();
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] poll admin failed:", err);
    return qaError("Poll operation failed", 500);
  }

  return qaJson({ ok: true, result });
}
