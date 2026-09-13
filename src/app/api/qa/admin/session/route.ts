/**
 * POST /api/qa/admin/session — إدارة جلسات الأسئلة (الإنتاج/البدء).
 *
 * الإجراءات (action):
 *   create     { title, titleAr? }                 → إنشاء جلسة جديدة
 *   activate   { sessionId }                       → تفعيل جلسة (تعطيل غيرها)
 *   toggle     { sessionId, acceptingQuestions? }  → فتح/إغلاق استقبال أسئلة
 *   delete     { sessionId }                       → حذف جلسة وأسئلتها
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
import type { QaSession } from "@/lib/qa/types";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    action: z.enum(["create", "activate", "toggle", "delete"]),
    title: z.string().trim().min(1).max(200).optional(),
    titleAr: z.string().trim().max(200).optional(),
    sessionId: z.string().min(1).max(200).optional(),
    acceptingQuestions: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.action === "create" && !v.title) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title"], message: "title is required to create" });
    }
    if (["activate", "toggle", "delete"].includes(v.action) && !v.sessionId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sessionId"], message: "sessionId is required" });
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
  const { action, title, titleAr, sessionId, acceptingQuestions } = parsed.data;

  let result;
  try {
    // عند الحذف نزيل أيضًا أصوات الاستفتاءات المرتبطة بالجلسة في نفس القفل.
    if (action === "delete") {
      result = await mutateBoth(({ data, votes }) => {
        const existed = data.sessions.some((s) => s.id === sessionId);
        if (!existed) throw new Error("session-not-found");
        data.sessions = data.sessions.filter((s) => s.id !== sessionId);
        votes.votes = votes.votes.filter((v) => v.sessionId !== sessionId);
        data.meta = {
          totalAttendees: data.sessions.reduce((sum, s) => sum + s.attendeeNames.length, 0),
          totalQuestions: data.sessions.reduce((sum, s) => sum + s.questions.length, 0),
          totalVotes: votes.votes.length,
        };
        return { deleted: true, id: sessionId };
      });
    } else {
      result = await mutateQaData((data) => {
        if (action === "create") {
          const session: QaSession = {
            id: newId("sess"),
            title: title as string,
            titleAr,
            active: false,
            acceptingQuestions: false,
            createdAt: new Date().toISOString(),
            questions: [],
            polls: [],
            attendeeNames: [],
          };
          data.sessions.push(session);
          return session;
        }

        const target = data.sessions.find((s) => s.id === sessionId);
        if (!target) throw new Error("session-not-found");

        if (action === "activate") {
          data.sessions.forEach((s) => (s.active = false));
          target.active = true;
          target.acceptingQuestions = true;
          return target;
        }

        if (action === "toggle") {
          if (typeof acceptingQuestions === "boolean") {
            target.acceptingQuestions = acceptingQuestions;
          } else {
            target.active = !target.active;
            if (!target.active) target.acceptingQuestions = false;
          }
          return target;
        }

        return null;
      });
    }
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] session admin failed:", err);
    return qaError("Session operation failed", 500);
  }

  return qaJson({ ok: true, result }, 200);
}
