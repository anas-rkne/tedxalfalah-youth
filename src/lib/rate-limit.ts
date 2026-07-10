import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let ratelimit: Ratelimit | null = null;

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
    console.warn(
      `[RATE LIMIT] Upstash not configured — request to "${formKey}" allowed without rate limiting. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before going live.`
    );
    return { allowed: true };
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { success, remaining } = await ratelimit.limit(`${formKey}:${ip}`);
  return { allowed: success, remaining };
}
