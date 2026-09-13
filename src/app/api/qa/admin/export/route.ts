/**
 * GET /api/qa/admin/export — تصدير بيانات الجلسة كملف CSV.
 *
 * يقبل: ?sessionId=xxx (اختياري — إن لم يُحدد يصدير أحدث جلسة)
 * يعيد: CSV download مع كل الأسئلة والتصويتات.
 *
 * الحماية: requireAdmin (JWT) + rate limit للمشرف.
 */
import { NextRequest } from "next/server";
import { requireAdmin, verifySession } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError } from "@/lib/qa/http";
import { readQaData } from "@/lib/qa/storage";
import { normalizeData } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * يدعم token كـ query param لـ window.open (أقل أماناً لكن مقبول
 * لهذا الـ endpoint الداخلي لأن JWT قصير العمر).
 */
async function authenticate(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.ok) return auth;

  const tokenParam = request.nextUrl.searchParams.get("token");
  if (!tokenParam) return auth;

  const fakeRequest = new Request(request.url, {
    headers: { Authorization: `Bearer ${tokenParam}` },
  });
  const session = await verifySession(fakeRequest);
  if (!session) return auth;
  if (session.role !== "admin") {
    return { ok: false as const, response: qaError("Admin role required", 403) };
  }
  return { ok: true as const, session };
}

export async function GET(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;

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

  const header = [
    "id",
    "author",
    "text",
    "status",
    "votes",
    "featured",
    "answered",
    "createdAt",
    "approvedAt",
  ];

  const rows = session.questions.map((q) => [
    q.id,
    q.author,
    q.text,
    q.status,
    String(q.votes),
    String(q.featured),
    String((q as unknown as Record<string, unknown>).answered ?? false),
    q.createdAt,
    q.approvedAt ?? "",
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="qa-${session.id}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
