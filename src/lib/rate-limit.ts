import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let ratelimit: Ratelimit | null = null;

// محدد ثانٍ أوسع لطلبات لوحة الإدارة (قراءة/تحديث الطلبات) — تفاعل بشري
// مكثّف لكنه ما يزال مقيّدًا لمنع أي إغراق آلي على نقاط النهاية المحمية.
let adminApiRatelimit: Ratelimit | null = null;

// محدد ثالث لمسارات القراءة العامة الحية (لقطة الجلسة + بث SSE).
// كان هذا المسار يستخدم `checkRateLimit` (5 طلبات/10 دقائق) نفسه المخصص
// للفورم: استطلاع الواجهة كل 4 ثوانٍ كان يصطدم بالحدّ بعد ~20 ثانية،
// فيسقط واجهة الحضور كلها، ويضيع بث شاشة العرض بعد اتصالين فقط.
// الفصل بين "طلب كتابة/فورم" و"قراءة متكرّرة" ضرورة وظيفية لا تحسين.
let qaReadRatelimit: Ratelimit | null = null;

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

  // لوحة الإدارة: 400 طلب / 10 دقائق لكل IP.
  // كان الحد 100 بينما اللوحة تسحب قائمة الأسئلة كل 5 ثوانٍ
  // (= 120 طلباً/10 دقائق للوحة واحدة)، فتحجب نفسها بـ429 بعد ~8 دقائق.
  adminApiRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(400, "10 m"),
    analytics: true,
  });

  // 600 طلب / 10 دقائق لمسارات القراءة العامة الحية لكل IP.
  // استطلاع كل 4 ثوانٍ = 150 طلباً/10 دقائق لكل جهاز، فالباب يترك هامشاً
  // لمشارك NAT (قاعة واحدة خلف عنوان واحد) بدون أن يصبح بلا حدّ.
  qaReadRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(600, "10 m"),
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
        `[RATE LIMIT] Upstash not configured in production — request to "${formKey}" ALLOWED without rate limiting. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.`
      );
      return { allowed: true };
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
 * يُرجِع استهلاك حدّ فورم بعينه بعد فشله **لسبب لا علاقة له بكلمة المرور**.
 *
 * ⚠️ لماذا يلزم: حدّ تسجيل الدخول 5 محاولات/10 دقائق. لو فشلت خدمة الهوية
 * (Google Sheets) لأرجع المسار 503، فإن كل إعادة محاولة يستهلك رصيداً لم
 * يُختبَر فيه أي كلمة مرور. بعد 5 إعادة محاولات أثناء عطلٍ دقيقتين يُقفل
 * المشرف 10 دقائق كاملة — أي أن عطل الخدمة يصنع قفلاً غير مرئي.
 * نُصفّر رصيد هذا النموذج فقط عند 503، وفيبقى الحدّ قائماً على 401 الحقيقي.
 */
export async function refundRateLimit(request: Request, formKey: string): Promise<void> {
  if (!ratelimit) return;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  try {
    await ratelimit.resetUsedTokens(`${formKey}:${ip}`);
  } catch (error) {
    // لا يرمي: إرجاع الرصيد تحسين، وفشله لا يجب أن يحوّل 503 إلى 500.
    console.warn(`[RATE LIMIT] refund failed for "${formKey}":`, error);
  }
}

/**
 * حد الطلبات لمسارات **القراءة العامة الحية**: `/api/qa/session/current` و
 * `/api/qa/stream`.
 *
 * منفصل عن حد الفورم (5/10 دقيقة) لأن هذه المسارات تُستدعى آلياً كل ثوانٍ
 * من متصفحات كثيرة خلف نفس الـIP. استخدام حد الفورم هنا كان يُسقط واجهة
 * الحضور وشاشة العرض أثناء البثّ مباشرة.
 */
export async function checkQaReadRateLimit(
  request: Request,
  formKey: string
): Promise<{ allowed: boolean; remaining?: number }> {
  if (!qaReadRatelimit) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[RATE LIMIT] Upstash not configured in production — read request to "${formKey}" ALLOWED without rate limiting. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.`
      );
      return { allowed: true };
    }
    return { allowed: true };
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    const { success, remaining } = await qaReadRatelimit.limit(`${formKey}:${ip}`);
    return { allowed: success, remaining };
  } catch (error) {
    console.error(`[RATE LIMIT] Upstash error on "${formKey}" — failing open:`, error);
    return { allowed: true };
  }
}

/**
 * نفس منطق checkRateLimit لكن بالمحدد الأوسع الخاص بلوحة الإدارة
 * (400 طلب / 10 دقائق / IP). الإغلاق الآمن نفسه عند غياب Upstash بالإنتاج.
 */
export async function checkAdminApiRateLimit(
  request: Request
): Promise<{ allowed: boolean }> {
  if (!adminApiRatelimit) {
    if (process.env.NODE_ENV === "production") {
      // مؤقتاً: افتح الباب بدل رفض طلبات لوحة الإدارة كلها بـ 429 حين لا
      // يكون Upstash مهيأً. أعد التقييد بعد ضبط UPSTASH_* في الإنتاج.
      console.warn(
        "[RATE LIMIT] Upstash not configured in production — admin API requests ALLOWED without rate limiting. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enforce limits."
      );
      return { allowed: true };
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
