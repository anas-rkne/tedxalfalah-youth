/**
 * GET /api/qa/session/current — بيانات الجلسة النشطة للعرض العام.
 *
 * يُستخدم من صفحة شاشة العرض (/live/screen) وصفحة الجمهور (/live).
 * يعيد فقط ما هو مخصص للعرض العام:
 *   - الجلسة النشطة (title)
 *   - الأسئلة المعتمدة (approved) فقط
 *   - الاستفتاءات (نتائجها حسب showResults و active)
 *
 * الحماية: قراءة عام، مع Rate limit يمنع إغراق نقاط النهاية العامة.
 */
import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson } from "@/lib/qa/http";
import { readQaData } from "@/lib/qa/storage";
import { getActiveSession, normalizeData } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-current");
  if (!allowed) return qaError("Too many requests", 429);

  const data = normalizeData(await readQaData());
  const session = getActiveSession(data);

  if (!session) {
    return qaJson({
      active: false,
      settings: data.settings,
      session: null,
    });
  }

  const approvedQuestions = session.questions
    .filter((q) => q.status === "approved")
    .sort((a, b) => (a.featured === b.featured ? Number(b.votes) - Number(a.votes) : a.featured ? -1 : 1))
    .map((q) => ({ id: q.id, author: q.author, text: q.text, votes: q.votes, featured: q.featured }));

  const polls = session.polls.map((p) => ({
    id: p.id,
    prompt: p.prompt,
    promptAr: p.promptAr,
    options: p.options,
    optionsAr: p.optionsAr,
    active: p.active,
    showResults: p.showResults,
    // نحجب الاحصائيات الميدانية إلا إذا فُتحت النتائج
    tallies: p.showResults ? p.tallies : p.active ? null : p.tallies,
    totalVotes: p.showResults || !p.active ? p.tallies.reduce((a, b) => a + b, 0) : null,
  }));

  return qaJson({
    active: true,
    settings: data.settings,
    session: {
      id: session.id,
      title: session.title,
      titleAr: session.titleAr,
      acceptingQuestions: session.acceptingQuestions,
      attendeeCount: session.attendeeNames.length,
    },
    questions: approvedQuestions,
    polls,
  });
}
