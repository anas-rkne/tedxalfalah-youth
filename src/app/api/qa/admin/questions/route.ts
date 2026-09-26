/**
 * GET /api/qa/admin/questions — استعراض بيانات الجلسات للإدارة.
 *
 * يعيد كل الجلسات مع أسئلتها بكل الحالات (pending/approved/rejected)
 * واستفتاءاتها وأسماء الحاضرين — للوحة الإدارة.
 *
 * الحماية: requireAdmin (JWT) + rate limit للمشرف.
 */
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson } from "@/lib/qa/http";
import { readQaData } from "@/lib/qa/storage";
import { normalizeData, normalizeScreen } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.session.role !== "admin") {
    return qaError("Admin role required", 403);
  }

  const { allowed } = await checkAdminApiRateLimit(request);
  if (!allowed) return qaError("Too many requests", 429);

  const data = normalizeData(await readQaData());

  // صورة عامة (بدون إزالة أي حالة) للإدارة
  const sessions = data.sessions.map((s) => ({
    id: s.id,
    title: s.title,
    titleAr: s.titleAr,
    active: s.active,
    acceptingQuestions: s.acceptingQuestions,
    speakerEnabled: s.speakerEnabled ?? true,
    createdAt: s.createdAt,
    questions: s.questions.map((q) => ({
      id: q.id,
      author: q.author,
      text: q.text,
      votes: q.votes,
      status: q.status,
      featured: q.featured,
      createdAt: q.createdAt,
      approvedAt: q.approvedAt,
      answered: q.answered,
      showOnSpeaker: q.showOnSpeaker ?? true,
      showOnLive: q.showOnLive ?? true,
      // شارة المصدر: بدونها لا يعرف المشرف أي سؤال كتبه بنفسه وأيها من
      // الجمهور — والقرار «هل هذا سؤال حقيقي من القاعة؟» يتعذّر.
      source: q.source ?? "audience",
      // كل الحالات عمداً: المشرف هو المراجع الوحيد للإجابات، وبدون ذلك
      // كان الحاضر يضغط «اكتب جواباً» ولا يجد له أحداً.
      answers: (q.answers ?? []).map((a) => ({
        id: a.id,
        author: a.author,
        text: a.text,
        status: a.status,
        createdAt: a.createdAt,
      })),
    })),
    polls: s.polls.map((p) => ({
      id: p.id,
      prompt: p.prompt,
      promptAr: p.promptAr,
      options: p.options,
      optionsAr: p.optionsAr,
      tallies: p.tallies,
      active: p.active,
      showResults: p.showResults,
      createdAt: p.createdAt,
    })),
    attendeeNames: s.attendeeNames,
    // `normalizeScreen` حتى لو كان الملف قديماً بلا `screen`: اللوحة تعرض
    // «يدوي/بانتظار» بدل undefined، فلا ينهار العرض عند أول فتح.
    screen: normalizeScreen(s),
  }));

  return qaJson({
    settings: data.settings,
    meta: data.meta,
    sessions,
  });
}
