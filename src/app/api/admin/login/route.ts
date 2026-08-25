/**
 * POST /api/admin/login — تسجيل دخول مشرف مع JWT.
 *
 * يقبل { username, password } (مستخدم جديد) أو { password } (legacy).
 * يعيد { ok: true, token, user: { username, displayName, role } } عند النجاح.
 *
 * الحماية:
 * - Rate limit صارم (5 محاولات / 10 دقائق / IP)
 * - مقارنة timing-safe
 * - JWT قصير العمر (30 دقيقة)
 */
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAdminConfigured } from "@/lib/admin-auth";
import { signJwt } from "@/lib/jwt";
import {
  verifyUserPassword,
  seedAdminIfNeeded,
  updateLastLogin,
} from "@/lib/users";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin dashboard is not configured on this server" },
      { status: 503 }
    );
  }

  const { allowed } = await checkRateLimit(request, "admin-login");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const obj = typeof body === "object" && body !== null ? body : {};
  const username = "username" in obj ? String((obj as { username?: unknown }).username ?? "").trim() : "";
  const password = "password" in obj ? String((obj as { password?: unknown }).password ?? "") : "";

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  // Auto-seed admin from ADMIN_PASSWORD if Users tab is empty
  await seedAdminIfNeeded();

  const result = await verifyUserPassword(username, password);
  if (!result) {
    return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  }

  const { user } = result;
  const token = await signJwt({ sub: user.username, role: user.role, tv: user.tokenVersion });
  await updateLastLogin(user.username);
  return NextResponse.json({
    ok: true,
    token,
    user: { username: user.username, displayName: user.displayName, role: user.role },
  });
}
