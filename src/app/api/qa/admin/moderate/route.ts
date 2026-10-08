/**
 * POST /api/qa/admin/moderate — إدارة الأسئلة (الموافقة/الرفض/التمييز/الإجابة/العرض).
 *
 * الإجراءات (action) داخل { sessionId }:
 *   approve      { questionId }                  → اعتماد سؤال للعرض على الشاشة
 *   reject       { questionId }                  → حجب سؤال
 *   feature      { questionId, featured }        → تمييز/إلغاء تمييز
 *   answer       { questionId, answered }        → تعليم السؤال بـ"تم الإجابة" (أو التراجع)
 *   setVisibility { questionId, showOnSpeaker?, showToAudience?, showOnProjector? }
 *                               → تحكم منفصل بالعرض (المتحدث/الجمهور/المشروعور)
 *   setSpeaker   { enabled }                     → تفعيل/تعطيل شاشة المتحدث للجلسة
 *
 * ⚠️ الفصل بين الجمهور والمشروعور:
 *   `showToAudience` = يظهر في هاتف الحاضر ضمن «أسئلتي المعروضة».
 *   `showOnProjector` = يظهر على الشاشة الكبرى وشاشة المتحدث.
 *   الحقل القديم `showOnLive` ما زال مقبولاً للطلب، ويعني «اضبط الوجهين معاً»
 *   (مسار الإقلاع للّوحات القديمة). لا يُكتب بعد اليوم.
 *
 * ⚠️ إخفاء سؤال عن الجمهور **لا** يُسقط شريحته من الشاشة الكبرى: فقط إخفاؤه
 *   عن المشروعور (أو رفضه أو تعليمه «تم الإجابة») يفعل. قبل الفصل كان أي
 *   تغيير رؤية يمسح الشريحة، فإخفاء سؤال مؤقتاً عن الحضور كان يمحو شريحة
 *   المتحدث من الشاشة بلا رجعة.
 *
 * ⚠️ كل الإجراءات **idempotent**: تأخذ القيمة النهائية صراحةً بدل أن تقلب
 * القيمة الحالية. `answer` كان يقلب `q.answered` فقط، فأي نقرتين سريعتين (نقر
 * مزدوج، أو إعادة محاولة الشبكة) كانتا تنعكسان الحالة وترجع السؤال المكتمل إلى
 * قائمة المتحدث — وهو عكس ما يريده المتحدث تماماً. الآن `answered` مطلوب.
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
import {
  applyVisibilityChange,
  isAudienceVisible,
  isProjectorVisible,
  reconcileScreenSlide,
} from "@/lib/qa/service";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    action: z.enum(["approve", "reject", "feature", "answer", "setVisibility", "setSpeaker"]),
    sessionId: z.string().min(1).max(200),
    questionId: z.string().min(1).max(200).optional(),
    featured: z.boolean().optional(),
    answered: z.boolean().optional(),
    showOnSpeaker: z.boolean().optional(),
    showToAudience: z.boolean().optional(),
    showOnProjector: z.boolean().optional(),
    // ⚠️ مقبول للتوافق مع اللوحة القديمة (Phase 3 تحوّلها للحقلين) — يعامل
    // كـ«اضبط الوجهين معاً». يبقى `q.showOnLive` للتقرير القديم فقط.
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
    if (v.action === "answer" && typeof v.answered !== "boolean") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["answered"], message: "answered is required" });
    }
    if (
      v.action === "setVisibility" &&
      typeof v.showOnSpeaker !== "boolean" &&
      typeof v.showToAudience !== "boolean" &&
      typeof v.showOnProjector !== "boolean" &&
      typeof v.showOnLive !== "boolean"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibility"],
        message: "showOnSpeaker / showToAudience / showOnProjector is required",
      });
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
  const { action, sessionId, questionId, featured, answered, showOnSpeaker, showToAudience, showOnProjector, showOnLive, enabled } = parsed.data;

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
      // سؤال أُسقط للتو من المشروعور ⇒ يجب أن تُسقط الشريحة المثبَّتة.
      //
      // ⚠️ لا يكفي مقارنة `action === "setVisibility"`، لأن إخفاء سؤال عن
      // **الجمهور فقط** لا يمسّ الشريحة بحال. كان المسار يُسقط الشريحة على
      // أي تغيير رؤية، فكل «إخفاء مؤقت عن سيارات الناس» كان يمسح شريحة
      // المتحدث من الشاشة الكبرى — إجراء لا رجعة فيه بمغض الطرف.
      let droppedFromProjector = false;

      if (action === "approve") {
        q.status = "approved";
        q.approvedAt = now;
      } else if (action === "reject") {
        q.status = "rejected";
        droppedFromProjector = true;
      } else if (action === "feature") {
        q.featured = Boolean(featured);
      } else if (action === "answer") {
        // القيمة النهائية تُؤخذ من الطلب، لا من عكس القيمة الحالية.
        q.answered = answered === true;
        droppedFromProjector = q.answered;
      } else if (action === "setVisibility") {
        ({ droppedFromProjector } = applyVisibilityChange(q, {
          speaker: showOnSpeaker,
          audience: showToAudience,
          projector: showOnProjector,
          legacyLive: showOnLive,
        }));
      }

      // ⚠️ أي إجراء يجعل السؤال غير مؤهَّل (رفض، «تم الإجابة»، إخفاؤه من
      // **المشروعور**) يُسقط الشريحة المثبَّتة فوراً. بلا هذا كانت اللوحة تكتب
      // «المعروض الآن: السؤال X» بعد أن خبّأه المشرف، فيُظنّ أن الزر تعطّل.
      if (droppedFromProjector) {
        reconcileScreenSlide(session);
      }
      return {
        id: q.id,
        status: q.status,
        featured: q.featured,
        answered: q.answered,
        showOnSpeaker: q.showOnSpeaker,
        showToAudience: isAudienceVisible(q),
        showOnProjector: isProjectorVisible(q),
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
