/**
 * POST /api/qa/survey — إرسال استبيان ما بعد الفعالية.
 *
 * يقبل { sessionId, attendeeId, nps (0-10), rating (1-5), comment? }.
 *
 * ما تم إصلاحه هنا:
 *  - 🔒 كان الملف يُكتب إلى مسار ثابت `store/qa-surveys.json` مُدمجاً مع
 *    `process.cwd()`، متجاهلاً `QA_DATA_DIR` — فكانت الردود في الإنتاج تُهبط
 *    داخل مجلد البناء الذي يُمسح مع كل رفع. الآن يمرّ عبر `resolveDataDir`
 *    في `storage.ts` مع جارس الإنتاج.
 *  - 🔒 كانت القراءة/الكتابة بلا قفل وبلا ذرّية، فكان طلبان متزامنان يضيع
 *    أحدهما. الآن `mutateSurveys` يقرأ ويكتب داخل القفل وبـ`tmp` + `rename`.
 *  - 🔒 كان `attendeeId` غير موثّق، فكان يكفي تخمينه لإرسال استبيان باسم
 *    شخص آخر أو لتجاوز منع الإرسال المزدوج. الآن يُتحقق من السجل.
 *  - 🔒 `GET` كان مكشوفاً بالكامل بلا مصادقة، فأي زائر كان يكفيه معرفة
 *    `sessionId` ليقرأ تعليقات الحاضرين ونسب رضاهم. الآن إداري فقط.
 *
 * الحماية: عام + Rate limit + التحقق من الأصل (POST) · مصادقة إدارية (GET).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit, checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { requireAdmin } from "@/lib/admin-auth";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { readSurveys, mutateSurveys, readQaData } from "@/lib/qa/storage";
import { findAttendee, getSessionById, newId } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  sessionId: z.string().min(1).max(200),
  attendeeId: z.string().min(1).max(200),
  nps: z.number().int().min(0).max(10),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-survey");
  if (!allowed) return qaError("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return qaError("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return qaError("Invalid survey data", 400, parsed.error.flatten());
  }

  const { sessionId, attendeeId, nps, rating, comment } = parsed.data;

  try {
    // القراءة والتحقق والكتابة كلها داخل القفل حتى لا يسبق ردّان متزامنان
    // أحدهما الآخر في كشف التكرار.
    const result = await mutateSurveys(async (store) => {
      // 1) الجلسة يجب أن موجودة فعلاً (يمنع أي sessionId مُختلق).
      const data = await readQaData();
      const session = getSessionById(data, sessionId);
      if (!session) throw new Error("session-not-found");

      // 2) الحاضر يجب أن يكون مسجَّلاً في هذه الجلسة — بدونه `attendeeId`
      //    مجرد نص يرسله العميل، ومنع الإرسال المزدوج بلا معنى.
      if (!findAttendee(session, attendeeId)) throw new Error("attendee-not-registered");

      // 3) منع الإرسال المزدوج لنفس الحاضر في نفس الجلسة.
      const existing = store.responses.find(
        (r) => r.sessionId === sessionId && r.attendeeId === attendeeId
      );
      if (existing) throw new Error("already-submitted");

      // 4) التعليق يُخزَّن خاماً — التهريب يحدث عند العرض/التصدير.
      const response = {
        id: newId("sv"),
        sessionId,
        attendeeId,
        nps,
        rating,
        comment: comment || undefined,
        createdAt: new Date().toISOString(),
      };
      store.responses.push(response);
      return response;
    });

    return qaJson({ ok: true, surveyId: result.id }, 201);
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] survey submit failed:", err);
    return qaError("Failed to submit survey", 500);
  }
}

/**
 * GET /api/qa/survey — قراءة ردود الاستبيان.
 *
 * 🔒 إداري فقط. كان مفتوحاً لأي زائر وبمجرد معرفة `sessionId`، فيكشف تعليقات
 * الحاضرين ونسب رضاهم.
 */
export async function GET(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  // `requireAdmin` يتحقق من صلاحية الجلسة لا من الدور. ردود الاستبيان
  // فيها تعليقات حرة ومقاييس رضا عن الحاضرين، وكل مسارات لوحة Q&A
  // الأخرى تتطلب دور admin صراحةً — فالفحص هنا لتوحيد السياسة.
  if (auth.session.role !== "admin") {
    return qaError("Admin role required", 403);
  }

  const { allowed } = await checkAdminApiRateLimit(request);
  if (!allowed) return qaError("Too many requests", 429);

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return qaError("sessionId required", 400);

  const store = await readSurveys();
  const responses = store.responses.filter((r) => r.sessionId === sessionId);

  const total = responses.length;
  const avgNps = total > 0 ? responses.reduce((s, r) => s + r.nps, 0) / total : 0;
  const avgRating = total > 0 ? responses.reduce((s, r) => s + r.rating, 0) / total : 0;
  const npsBreakdown = {
    promoters: responses.filter((r) => r.nps >= 9).length,
    passives: responses.filter((r) => r.nps >= 7 && r.nps <= 8).length,
    detractors: responses.filter((r) => r.nps <= 6).length,
  };
  const npsScore =
    total > 0 ? Math.round(((npsBreakdown.promoters - npsBreakdown.detractors) / total) * 100) : 0;

  return qaJson({
    ok: true,
    total,
    avgNps: Math.round(avgNps * 10) / 10,
    avgRating: Math.round(avgRating * 10) / 10,
    npsScore,
    npsBreakdown,
    // آخر 50 رداً فقط — الردود الأقدم تبقى محفوظة في الملف.
    responses: responses.slice(-50),
  });
}
