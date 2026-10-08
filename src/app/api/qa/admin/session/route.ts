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
import { newId, recomputeMeta } from "@/lib/qa/service";
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
    // عند الحذف نزيل أصوات الاستفتاءات **وأصوات الأسئلة** المرتبطة بالجلسة في
    // نفس القفل. قبل الإصلاح كانت أصوات الأسئلة لا وجود لها أصلاً، و`meta`
    // كان يُحسب بشكل مختلف عن بقية المسارات فينحرف بعد أي حذف.
    if (action === "delete") {
      result = await mutateBoth(({ data, votes }) => {
        const existed = data.sessions.some((s) => s.id === sessionId);
        if (!existed) throw new Error("session-not-found");
        data.sessions = data.sessions.filter((s) => s.id !== sessionId);
        votes.votes = votes.votes.filter((v) => v.sessionId !== sessionId);
        votes.questionVotes = (votes.questionVotes ?? []).filter(
          (v) => v.sessionId !== sessionId
        );
        data.meta = recomputeMeta(data, votes);
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
            attendees: [],
            attendeeNames: [],
          };
          data.sessions.push(session);
          return session;
        }

        const target = data.sessions.find((s) => s.id === sessionId);
        if (!target) throw new Error("session-not-found");

        /**
         * ⛔ F1 (قرار المشرف: «تمسح فور بدء جلسة جديدة»).
         *
* نتائج استطلاع منتهٍ كانت تبقى `showResults: true` إلى الأبد، فكان
         * المشروعور يعرضها بلا نهاية — وإن توتّرت لقطة قديمة (شبكة بطيئة،
         * تبويب خامل، نسخة محفوظة) بقيت نتائج الجلسة السابقة على الشاشة
         * الكبرى أمام الحضور الجدد، بلا وسيلة ليعرفوا أنها لجلسة انتهت.
         *
         * الإغلاق هنا لا يمسّ **البيانات**: `tallies` تبقى كما هي، فإعادة
         * فتح النتائج (`showResults`) متاحة متى أراد المشرف — والمراجعة
         * اللاحقة (تحليلات) لا تتأثر. المسح للعرض فقط.
         */
        const clearStaleResults = (keepSessionId: string) => {
          for (const s of data.sessions) {
            if (s.id === keepSessionId) continue;
            for (const p of s.polls) {
              if (!p.active && p.showResults) p.showResults = false;
            }
          }
        };

        if (action === "activate") {
          data.sessions.forEach((s) => (s.active = false));
          target.active = true;
          target.acceptingQuestions = true;
          clearStaleResults(target.id);
          return target;
        }

        if (action === "toggle") {
          if (typeof acceptingQuestions === "boolean") {
            // فتح/إغلاق استقبال الأسئلة فقط — لا يمسّ `active` إطلاقاً.
            target.acceptingQuestions = acceptingQuestions;
          } else if (target.active) {
            // «إنهاء»: إطفاء الجلسة النشطة نفسها.
            target.active = false;
            target.acceptingQuestions = false;
          } else {
            // ⚠️ تشغيل جلسة لم تكن نشطة: **يجب** إطفاء أي جلسة أخرى نشطة.
            //
            // هذا كان الثغرة الوحيدة للوصول إلى جلستين نشطتين: `activate`
            // كانت تُطفئ البقية، لكن `toggle` المجرّدة كانت تقلب `active`
            // وحدها. وبما أن `GET /session/current` يقرأ
            // `sessions.find(s => s.active)` — أي **الأولى** في ترتيب الملف لا
            // ما ضُغط عليه — كانت الأسئلة من جلسة وشاشة العرض من أخرى، بلا
            // خطأ ولا رسالة. أسوأ Forms of السلوك الصامت أمام الحضور.
            //
            // التوحيد مع `activate` مقصود: التبديل بين جلستين عملية عادية
            // يستطيع المشرف إتمامها بضغطة واحدة، فرفضها بـ409 كان سيُضيف
            // خطوة بلا فائدة. الحارس الحقيقي (تعارض غير متوقّع) موجود في
            // `enforceSingleActiveSession` على مستوى البيانات.
            data.sessions.forEach((s) => (s.active = false));
            target.active = true;
            target.acceptingQuestions = true;
            // ⛔ F1 نفسه هنا: التحويل بضغطة واحدة (وهو المسار الأكثر
            // استعمالاً في اللحظة الحاسمة) كان يُبقي نتائج الجلسة السابقة
            // `showResults: true` — أي أن «التنقل إلى جلسة جديدة» كان
            // بالضبط المسار الذي لا يمسح. التوحيد لا خيار فيه.
            clearStaleResults(target.id);
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
