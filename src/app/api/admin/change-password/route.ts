/**
 * POST /api/admin/change-password — تغيير كلمة مرور المشرف.
 *
 * يقبل { currentPassword, newPassword }.
 * يتحقق من الجلسة (JWT) + كلمة المرور الحالية.
 * يحدّث كلمة المرور + يكبّر tokenVersion (يُبطل كل الجلسات القديمة).
 * العميل يُسجّل الخروج تلقائيًا بعد النجاح.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { requireAdmin } from "@/lib/admin-auth";
import { verifyUserPassword, updateUserPassword } from "@/lib/users";

export const dynamic = "force-dynamic";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

function noStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { allowed } = await checkAdminApiRateLimit(request);
  if (!allowed) return noStore({ error: "Too many requests" }, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStore({ error: "Invalid JSON body" }, 400);
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return noStore({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }

  const { currentPassword, newPassword } = parsed.data;
  const { username } = auth.session;

  const verified = await verifyUserPassword(username, currentPassword);
  if (!verified) {
    return noStore({ error: "Current password is incorrect" }, 401);
  }

  const ok = await updateUserPassword(username, newPassword);
  if (!ok) {
    return noStore({ error: "Failed to update password" }, 500);
  }

  return noStore({ ok: true, message: "Password updated. All sessions have been invalidated." }, 200);
}
