/**
 * GET /api/qa/admin/analytics — تحليلات شاملة للجلسة.
 *
 * يعيد: إحصائيات الأسئلة، التصويتات، المشاعر، التصنيفات، التوقيت.
 *
 * الحماية: requireAdmin (JWT).
 */
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson } from "@/lib/qa/http";
import { readQaData } from "@/lib/qa/storage";
import { normalizeData } from "@/lib/qa/service";

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

  const sessionId = request.nextUrl.searchParams.get("sessionId");

  const data = normalizeData(await readQaData());

  let session = null;
  if (sessionId) {
    session = data.sessions.find((s) => s.id === sessionId) ?? null;
  } else {
    session = data.sessions[data.sessions.length - 1] ?? null;
  }

  if (!session) {
    return qaError("No session found", 404);
  }

  const questions = session.questions;
  const totalQuestions = questions.length;
  const approved = questions.filter((q) => q.status === "approved");
  const pending = questions.filter((q) => q.status === "pending");
  const rejected = questions.filter((q) => q.status === "rejected");
  const answered = questions.filter((q) => q.answered);
  const featured = questions.filter((q) => q.featured);
  const anonymous = questions.filter((q) => q.anonymous);

  // المشاعر
  const sentiment = {
    positive: questions.filter((q) => q.sentiment === "positive").length,
    negative: questions.filter((q) => q.sentiment === "negative").length,
    neutral: questions.filter((q) => q.sentiment === "neutral").length,
  };

  // التصنيفات
  const tagCounts = new Map<string, number>();
  for (const q of questions) {
    const tag = q.tag || "untagged";
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const tags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  // أعلى الأسئلة تصويتاً
  const topQuestions = [...approved]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10)
    .map((q) => ({ id: q.id, text: q.text, author: q.author, votes: q.votes, featured: q.featured }));

  // التوزيع الزمني (أسئلة لكل ساعة)
  const hourly = new Map<number, number>();
  for (const q of questions) {
    const hour = new Date(q.createdAt).getHours();
    hourly.set(hour, (hourly.get(hour) ?? 0) + 1);
  }
  const timeline = Array.from(hourly.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  // الاستفتاءات
  const polls = session.polls.map((p) => ({
    id: p.id,
    prompt: p.prompt,
    totalVotes: p.tallies.reduce((a, b) => a + b, 0),
    active: p.active,
  }));

  return qaJson({
    ok: true,
    session: { id: session.id, title: session.title, createdAt: session.createdAt },
    stats: {
      totalQuestions,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      answered: answered.length,
      featured: featured.length,
      anonymous: anonymous.length,
      totalVotes: approved.reduce((s, q) => s + q.votes, 0),
      attendeeCount: session.attendeeNames.length,
    },
    sentiment,
    tags,
    topQuestions,
    timeline,
    polls,
  });
}
