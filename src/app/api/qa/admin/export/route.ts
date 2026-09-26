/**
 * GET /api/qa/admin/export — تصدير بيانات الجلسة كملف CSV.
 *
 * يقبل: ?sessionId=xxx (اختياري — إن لم يُحدد يصدير أحدث جلسة)
 * يعيد: CSV download مع كل الأسئلة والتصويتات.
 *
 * الحماية: requireAdmin (JWT) + rate limit للمشرف.
 */
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError } from "@/lib/qa/http";
import { readQaData } from "@/lib/qa/storage";
import { normalizeData } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

/**
 * يهرّب خلية CSV.
 *
 * ⚠️ حاجتان كانتا ناقصتين:
 * 1) البادئات التي يفسّرها Excel/Sheets كصيغة: خلية تبدأ بـ = + - @ (أو
 *    محارف تحكّم) تُنفَّذ عند فتح الملف. سؤال حاضر يبدأ بـ "=" كان يصبح
 *    صيغة قابلة للتنفيذ على جهاز المشرف.
 * 2) تلك البادئة يجب أن تُهرَّب *داخل* اقتباس، وإلا كسرت الحقل كله.
 */
function escapeCsv(value: string): string {
  const needsQuote = /[",\n\r]/.test(value);
  // \t و\r في بداية الخلية تكسر التحليل أيضاً.
  const guarded = /^[\s]*[=+\-@]/.test(value) || /^[\t\r]/.test(value) ? `'${value}` : value;
  if (needsQuote) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

/**
 * المصادقة: `Authorization: Bearer` فقط.
 *
 * ⚠️ كان هناك مسار احتياطي `?token=` لخدمة `window.open` (لأن التنزيل المباشر
 * لا يدعم ترويسات). كلّف ذلك تسرّباً: الرمز في الـURL يبقى في سجل المتصفح
 * وسجل الخادم والـReferer، ويظهر لأي شخص يطّلع على الرابط. الحل: لا يخرج
 * الرمز عن الترويسة — الواجهة تجلب المسار بـ`fetch` (كـblob) ثم تُنشئ رابطاً
 * مؤقتاً محلياً.
 *
 * ونتيجةً لذلك لا يمكن تجاوز فحص الدور: مسار المصادقة واحد.
 */
async function authenticate(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth;
  // `requireAdmin` يتحقق من صلاحية الجلسة لا من الدور، ومستخدم "viewer"
  // يمرّ منه — والتصدير كامل (أسماء + مرفوضات) فالفحص هنا إلزامي.
  if (auth.session.role !== "admin") {
    return { ok: false as const, response: qaError("Admin role required", 403) };
  }
  return { ok: true as const, session: auth.session };
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
