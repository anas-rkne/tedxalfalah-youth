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
import { checkRateLimit, refundRateLimit } from "@/lib/rate-limit";
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
  //
  // ⚠️ قراءة Users تعتمد Google Sheets. على أول طلب (بلا كاش) أي عطل في
  // الشبكة أو quota كان يرمي استثناءً غير ملتقط ← 500 بلا معنى، ويوهم
  // المشرف بأن كلمة مروره خاطئة بينما المشكلة في الخدمة. نميّزها بـ 503
  // مع مهلة إعادة محاولة، تماماً كما يفعل `requireAdmin` في المسارات المحمية.
  let result: Awaited<ReturnType<typeof verifyUserPassword>>;
  try {
    await seedAdminIfNeeded();
    result = await verifyUserPassword(username, password);
  } catch (err) {
    console.error("[admin/login] تعذّر الوصول لمصدر الهوية", err);
    // المحاولة لم تختبر كلمة مرور، فلا يجوز أن تستهلك رصيد محاولات
    // الدخول: وإلا صنع عطلٌ في Sheets قفلاً لـ 10 دقائق للمشرف.
    await refundRateLimit(request, "admin-login");
    return NextResponse.json(
      { error: "Identity service unavailable. Please try again shortly." },
      { status: 503, headers: { "Retry-After": "10" } }
    );
  }

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
