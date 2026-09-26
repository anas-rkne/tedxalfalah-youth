/**
 * POST /api/qa/admin/screen — تحكم المشرف فيما تعرضه الشاشة الكبيرة الآن.
 *
 * ⚠️ لماذا نقطة منفصلة عن `/admin/moderate`؟
 * `moderate` يقرّر عن **السؤال** (اعتماد/رفض/رؤية)، وهذا المسار يقرّر عن
 * **الشريحة** (ما يُعرض في هذه اللحظة). خلطهما كان سيجعل «وضع السؤال على
 * الشاشة» يغيّر حالة السؤال نفسه — والمخزون غير الشاشة.
 *
 * الإجراءات (action) داخل { sessionId }:
 *   setMode        { mode }                     → يدوي ⇄ تلقائي
 *   setSlide       { slide }                    → استبدال الشريحة كاملة
 *   next           { }                          → الشريحة التالية (يُحسب على الخادم)
 *   clear          { }                          → «بانتظار المشرف»
 *   createQuestion { text, author?, putOnScreen? } → سؤال إدارة معتمد فوراً
 *
 * ⚠️ كل الإجراءات **idempotent**: تأخذ القيمة النهائية صراحةً (نفس مبدأ
 * `moderate`) ولا تقلب الحالي. النقر المزدوج أو إعادة محاولة الشبكة تعطي
 * النتيجة نفسها بدل أن تبدّل الحالة في الاتجاه المعاكس.
 *
 * `next` يُحسب **هنا** لا في المتصفح: لو حاسبه كل جهاز لاختلف زر «التالي»
 * في اللوحة عن الشريحة على جهاز العرض. الترتيب واحد من `service.ts`.
 *
 * الحماية: requireAdmin (JWT) + `role === "admin"` + rate limit + Origin.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateQaData } from "@/lib/qa/storage";
import {
  newId,
  nextScreenSlide,
  normalizeScreen,
  recomputeMeta,
  screenEligibleQuestions,
} from "@/lib/qa/service";
import type { QaQuestion, QaScreenSlide } from "@/lib/qa/types";

export const dynamic = "force-dynamic";

const slideSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("question"), questionId: z.string().min(1).max(200) }),
  z.object({ kind: z.literal("poll"), pollId: z.string().min(1).max(200) }),
  z.object({ kind: z.literal("wordCloud") }),
  z.object({ kind: z.literal("hold") }),
]);

const schema = z
  .object({
    action: z.enum(["setMode", "setSlide", "next", "clear", "createQuestion"]),
    sessionId: z.string().min(1).max(200),
    mode: z.enum(["manual", "auto"]).optional(),
    slide: slideSchema.optional(),
    // سؤال الإدارة: نفس حدود سؤال الجمهور (2..300) عمداً حتى لا يخلق
    // الإدارة لا تكتب سؤالاً لا يستطيع الحضور سماعه في نفس المساحة على الشاشة.
    text: z.string().trim().min(2).max(300).optional(),
    author: z.string().trim().max(60).optional(),
    putOnScreen: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.action === "setMode" && !v.mode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mode"], message: "mode is required" });
    }
    if (v.action === "setSlide" && !v.slide) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slide"], message: "slide is required" });
    }
    if (v.action === "createQuestion" && !v.text) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["text"], message: "text is required" });
    }
  });

/** اسم افتراضي لمؤلف سؤال الإدارة حين لا يُكتب اسم. */
const DEFAULT_ADMIN_AUTHOR = "فريق التنظيم";

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
  const { action, sessionId, mode, slide, text, author, putOnScreen } = parsed.data;

  try {
    const result = await mutateQaData((data) => {
      const session = data.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error("session-not-found");
      const screen = normalizeScreen(session);
      const now = new Date().toISOString();

      // ── سؤال إدارة: «سؤال على المسرح» ───────────────────────────────
      // يدخل معتمداً لأن المشرف هو من كتبه — لا معنى لإرساله لنفسه
      // للمراجعة. يمكن دفعه للشاشة في الطلب نفسه.
      if (action === "createQuestion") {
        const question: QaQuestion = {
          id: newId("q"),
          author: author || DEFAULT_ADMIN_AUTHOR,
          text: text as string,
          votes: 0,
          status: "approved",
          createdAt: now,
          approvedAt: now,
          featured: false,
          showOnSpeaker: true,
          showOnLive: true,
          source: "admin",
          answers: [],
        };
        session.questions.push(question);
        data.meta = recomputeMeta(data);
        if (putOnScreen) {
          screen.mode = "manual";
          screen.slide = { kind: "question", questionId: question.id };
          screen.updatedAt = now;
        }
        return { question, screen };
      }

      // ── بقية الأفعال: كلها على حالة الجلسة فقط ───────────────────────
      if (action === "setMode") {
        screen.mode = mode as "manual" | "auto";
      } else if (action === "clear") {
        screen.slide = { kind: "hold" };
      } else if (action === "next") {
        screen.slide = nextScreenSlide(session, screen.slide);
      } else if (action === "setSlide") {
        screen.slide = slide as QaScreenSlide;
      }

      // ⚠️ حارس الأهلية: شريحة تشير إلى سؤال لم يعد مؤهَّلاً (مخفي، مرفوض،
      // أو «تم الإجابة») تُسقَط إلى `hold` بدل أن تتعلّق بمعرّف ميت.
      // إن رفض زر «على الشاشة» سؤالاً غير مؤهَّل، فصمتُنا يعني أن الشاشة تعرض
      // شيئاً غير ما طلبه المشرف — أسوأ من رسالة خطأ صريحة. لذا: 409 + hold.
      if (screen.slide.kind === "question") {
        const eligible = screenEligibleQuestions(session).some(
          (q) => q.id === (screen.slide as { questionId: string }).questionId
        );
        if (!eligible) {
          screen.slide = { kind: "hold" };
          screen.updatedAt = now;
          data.meta = recomputeMeta(data);
          return { screen, rejected: true };
        }
      }
      if (screen.slide.kind === "poll") {
        const pollId = (screen.slide as { pollId: string }).pollId;
        if (!session.polls.some((p) => p.id === pollId)) {
          screen.slide = { kind: "hold" };
          screen.updatedAt = now;
          return { screen, rejected: true };
        }
      }

      screen.updatedAt = now;
      return { screen, rejected: false };
    });

    if (result.rejected) {
      return qaError(
        "That item is not eligible for the screen (hidden, rejected, or already answered); screen cleared to hold",
        409
      );
    }
    return qaJson({ ok: true, result });
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] screen control failed:", err);
    return qaError("Screen control failed", 500);
  }
}
