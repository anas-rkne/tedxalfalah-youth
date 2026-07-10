const isTurnstileConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);

/**
 * يتحقق من رمز Cloudflare Turnstile المُرسَل من الفورم عبر خادم Cloudflare.
 *
 * إن لم يكن TURNSTILE_SECRET_KEY موجوداً بعد (بيئة تطوير قبل إنشاء حساب
 * Cloudflare)، يسمح بالمرور دائماً مع تحذير بالسجل — حتى لا يتعطل تطوير
 * أو اختبار المشروع محلياً.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  if (!isTurnstileConfigured) {
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
