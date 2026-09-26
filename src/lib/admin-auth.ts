/**
 * مصادقة لوحة الإدارة — JWT session verification.
 *
 * يتحقق من JWT في Bearer → يعيد { username, role } أو null.
 * إذا لم يكن تبويب Users موجودًا، يُنشئ مستخدم "admin" تلقائيًا من ADMIN_PASSWORD.
 */
import { verifyJwt, type SessionPayload } from "@/lib/jwt";
import { getUserByUsername, seedAdminIfNeeded } from "@/lib/users";

export interface SessionInfo {
  username: string;
  role: "admin" | "viewer";
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * يتحقق من الرمز ثم من صلاحيته مقابل **مصدر المستخدمين** (Google Sheets).
 *
 * ⚠️ يُميَّز بين حالتين عمداً:
 *   - `null` ⇒ لا رمز، أو رمز منتهٍ، أو مستخدم غير موجود ⇒ خطأ من العميل (401).
 *   - يرمي   ⇒ مصدر الهوية نفسه معطّل (نفاد حصة Sheets أو انقطاع الشبكة)،
 *              أي أن الخدمة غير متاحة الآن وليست محاولة دخول خاطئة.
 *
 * كان الخطأ الثاني استثناءً بلا معالجة ⇒ كل مسار إداري يرجع 500 كأنه خلل
 * برمجي، والمشرف لا يعرف أن عليه إعادة المحاولة بعد قليل.
 */
export async function verifySession(request: Request): Promise<SessionInfo | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const payload: SessionPayload | null = await verifyJwt(token);
  if (!payload || typeof payload.sub !== "string" || typeof payload.tv !== "number") {
    return null;
  }

  await seedAdminIfNeeded();

  const user = await getUserByUsername(payload.sub);
  if (!user) return null;
  if (user.tokenVersion !== payload.tv) return null;
  return { username: user.username, role: user.role };
}

export async function requireAdmin(request: Request): Promise<
  { ok: true; session: SessionInfo } | { ok: false; response: Response }
> {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Admin dashboard is not configured" }),
        { status: 503, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } }
      ),
    };
  }

  // ⛔ معطّل: مصدر المستخدمين (Google Sheets) لا يقرأ — نفاد حصة أو انقطاع.
  // نردّ 503 الصريح بدل استثناء غير معالَج كان يظهر كـ500 ويوهم المشرف بأن
  // جلسته هي المشكلة، بينما الحل إعادة المحاولة بعد ثوانٍ.
  let session: SessionInfo | null;
  try {
    session = await verifySession(request);
  } catch (error) {
    console.error("[auth] identity backend unavailable:", error);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Authentication service temporarily unavailable" }),
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json",
            "Retry-After": "10",
          },
        }
      ),
    };
  }

  if (!session) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } }
      ),
    };
  }

  return { ok: true, session };
}
