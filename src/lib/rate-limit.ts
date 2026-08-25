import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let ratelimit: Ratelimit | null = null;

// محدد ثانٍ أوسع لطلبات لوحة الإدارة (قراءة/تحديث الطلبات) — تفاعل بشري
// مكثّف لكنه ما يزال مقيّدًا لمنع أي إغراق آلي على نقاط النهاية المحمية.
let adminApiRatelimit: Ratelimit | null = null;

if (isConfigured) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
  });

  // 5 طلبات لكل عنوان IP كل 10 دقائق لكل نوع فورم — كافٍ لمستخدم حقيقي
  // (حتى لو أخطأ ثم أعاد المحاولة عدة مرات)، ويمنع أي محاولة إغراق آلية.
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
  });

  // 100 طلب / 10 دقائق للوحة الإدارة (جلب القائمة، تحديث حالة، إلخ)
  adminApiRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "10 m"),
    analytics: true,
  });
}

/**
 * يتحقق من حد الطلبات لعنوان IP مُعطى ولمفتاح مميّز لكل فورم (formKey)
 * حتى لا تشترك كل الفورمات بنفس الحد.
 *
 * إن لم تكن متغيرات Upstash موجودة بعد (بيئة تطوير)، يسمح بالمرور دائماً
 * مع تحذير بالسجل، حتى لا يتعطل تطوير المشروع محلياً بانتظار حساب Upstash.
 */
export async function checkRateLimit(
  request: Request,
  formKey: string
): Promise<{ allowed: boolean; remaining?: number }> {
  if (!ratelimit) {
    if (process.env.NODE_ENV === "production") {
      // في الإنتاج لا نمرّر الطلبات بدون Rate Limiting — الإغلاق الآمن
      // أفضل من فتح الباب للإغراق الآلي.
      console.error(
        `[RATE LIMIT] Upstash not configured in production — requests to "${formKey}" rejected.`
      );
      return { allowed: false };
    }
    console.warn(
      `[RATE LIMIT] Upstash not configured — request to "${formKey}" allowed without rate limiting. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before going live.`
    );
    return { allowed: true };
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    const { success, remaining } = await ratelimit.limit(`${formKey}:${ip}`);
    return { allowed: success, remaining };
  } catch (error) {
    // انقطاع Upstash العابر لا يجب أن يُسقط الفورمات كلها بـ500 — نمرّر
    // الطلب مع سجل صريح (التوفر أولاً؛ الحماية الأساسية تبقى قائمة).
    console.error(`[RATE LIMIT] Upstash error on "${formKey}" — failing open:`, error);
    return { allowed: true };
  }
}

/**
 * نفس منطق checkRateLimit لكن بالمحدد الأوسع الخاص بلوحة الإدارة
 * (100 طلب / 10 دقائق / IP). الإغلاق الآمن نفسه عند غياب Upstash بالإنتاج.
 */
export async function checkAdminApiRateLimit(
  request: Request
): Promise<{ allowed: boolean }> {
  if (!adminApiRatelimit) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[RATE LIMIT] Upstash not configured in production — admin API requests rejected."
      );
      return { allowed: false };
    }
    return { allowed: true };
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    const { success } = await adminApiRatelimit.limit(`admin-api:${ip}`);
    return { allowed: success };
  } catch (error) {
    // نفس التسامح العابر: انقطاع Upstash لا يقفل لوحة الإدارة مؤقتًا.
    console.error("[RATE LIMIT] Upstash error on admin-api — failing open:", error);
    return { allowed: true };
  }
}
