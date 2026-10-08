import { isTestMode, isTestTurnstileToken } from "@/lib/test-mode";

const isTurnstileConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);

/**
 * يتحقق من رمز Cloudflare Turnstile المُرسَل من الفورم عبر خادم Cloudflare.
 *
 * إن لم يكن TURNSTILE_SECRET_KEY موجوداً بعد (بيئة تطوير قبل إنشاء حساب
 * Cloudflare)، يسمح بالمرور دائماً مع تحذير بالسجل — حتى لا يتعطل تطوير
 * أو اختبار المشروع محلياً.
 *
 * ⛔ ثلاث حالات منفصلة عمداً — الخلط بينها يجعل التشخيص مستحيلاً:
 *   1. مفتاح مضبوط + بلا رمز         ⇒ `false` (طلب حقيقي ناقص الرمز).
 *   2. مفتاح مضبوط + رمز خاطئ       ⇒ `false` (تلاعب).
 *   3. لا مفتاح + الإنتاج            ⇒ `false` (لا يُفتح الباب للإنتاج).
 *   4. لا مفتاح + تطوير              ⇒ `true`  (تسهيل التطوير).
 *   5. رمز تجاوز الاختبار            ⇒ `true`  (خادم اختبار مؤكَّد).
 *
 * الحالة 5 لا تقبل أي رمز ولا `undefined`: يجب أن يطابق `TEST_TURNSTILE_TOKEN`
 * تماماً. لقبل أي قيمة لأمكن لفورم حقيقي على خادم مُفعَّل الاختبار أن يتجاوز
 * الفحص بإرسال نص فارغ — وهو ما يحوّل تسهيل الاختبار إلى ثغرة.
 *
 * ⛔ ولا استثناء لـ`undefined` في وضع الاختبار ولو بلا مفتاح. أُضيف استثناء
 * كهذا فعلاً لتمرير اختبار المتصفح على `next start` ثم **حُذف**: الفاحص
 * `qa-live.spec.ts` كان يسقط بـ403 ويُقرأ عطل واجهة. لكن الاستثناء يعني أن
 * الرمز الفارغ يتجاوز فحص البوت على أي خادم مُفعَّل الاختبار بلا مفتاح، وهو
 * بالضبط ما تمنعه الحالة 5. التكلفة/المنفعة خاسرة: الفارق يغطيه اختبارات
 * الوحدة حتمياً، بينما الاستثناء يُضعف حارساً حقيقياً. والطبقة 3 تعمل على
 * خادم التطوير بدل ذلك — راجع `playwright.qa3.config.ts`.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  if (isTestMode() && isTestTurnstileToken(token)) {
    return true;
  }

  if (!isTurnstileConfigured) {
    if (process.env.NODE_ENV === "production") {
      // في الإنتاج لا نسمح أبداً بالمرور بدون Turnstile — الفورمات (خاصة
      // طلبات التحدث وبيانات القُصَّر) لا تُقبل إلا مع تحقق حقيقي.
      console.error(
        "[TURNSTILE] TURNSTILE_SECRET_KEY is missing in production — requests rejected."
      );
      return false;
    }
    console.warn(
      "[TURNSTILE] TURNSTILE_SECRET_KEY not configured — request allowed without bot verification. Add it before going live."
    );
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY as string,
          response: token,
        }),
      }
    );
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("[TURNSTILE] Verification request failed:", error);
    return false;
  }
}
