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

  const session = await verifySession(request);
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
