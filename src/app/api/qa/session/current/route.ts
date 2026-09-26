/**
 * GET /api/qa/session/current — لقطة الجلسة النشطة للعرض العام.
 *
 * يُستخدم من صفحة الجمهور (/live) وشاشة العرض (/live/screen).
 *
 * ⚠️ نقطة مهمة: بناء الاستجابة قام بالكامل في `buildPublicSnapshot`
 * (src/lib/qa/public-view.ts) — وهي نفس الدالة التي تبثّ منها نقطة
 * `/api/qa/stream`. الهدف منع انحراف الشكل بين النقطتين (وهو ما كان يعلّق
 * شاشة العرض على "استعدوا...") وضمان عدم تسرّب أي حقل إداري.
 *
 * الحماية: قراءة عامة، مع فحص Origin وتحديد معدّل.
 */
import { NextRequest } from "next/server";
import { checkQaReadRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson } from "@/lib/qa/http";
import { readQaData } from "@/lib/qa/storage";
import { buildPublicSnapshot, isQaView } from "@/lib/qa/public-view";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkQaReadRateLimit(request, "qa-current");
  if (!allowed) return qaError("Too many requests", 429);

  const rawView = request.nextUrl.searchParams.get("view") ?? "live";
  if (!isQaView(rawView)) {
    return qaError("Invalid view", 400);
  }

  const snapshot = buildPublicSnapshot(await readQaData(), rawView);
  return qaJson(snapshot);
}
