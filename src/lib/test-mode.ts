/**
 * وضع الاختبار الموحّد — يفتح الأبواب التي تُغلق تحت الاختبار الآلي فقط.
 *
 * 🎯 لماذا نحتاجه أصلاً: الحاجز الذي يمنع الاختبارات ليس المصادقة وحدها.
 * بطبيعة النظام، كل طلب يخضع لثلاثة تحقّقات مستقلّة:
 *   - هوية (Google Sheets)   → `QA_AUTH_MODE=local` في users.ts
 *   - أصل الطلب (CORS)       → `validateOrigin` في cors.ts
 *   - فحص البوت (Turnstile) → `verifyTurnstile` في turnstile.ts
 *   - حدّ المعدّل (Rate limit)→ rate-limit.ts
 *
 * كانت الاختبارات معطّلة عند عدّة منها دفعةً واحدة، وهي ليست أخطاءً:
 * كلها سلوك صحيح في الإنتاج. كسرُها في الإنتاج غير مقبول إطلاقاً
 * (فورم فيه بيانات قُصّر بلا فحص بوت = باب مفتوح)، وكسرُها في الاختبار
 * مستحيل بدون مفتاح حقيقي.
 *
 * ⛔ حاجز الأمان — وهو ما يجعل هذا الملف مقبولاً:
 * الوضع **مرفوض في الإنتاج** إلا بتأكيد صريح `QA_ALLOW_TEST_MODE=true`.
 * السبب: كل ما يفعّله هنا (تجاوز فحص البوت، وتوسيع CORS، وتعطيل حدّ المعدّل،
 * هوية بلا Sheets) هو بالضبط ما يحوّل النموذج إلى هدف. تفعيله بالخطأ
 * على خادم حيّ يجب أن يتطلّب فعلاً متعمّداً لا نتيجة نسخ متغيّرات.
 */

const TRUTHY = new Set(["1", "true", "yes", "on"]);

function flag(name: string): boolean {
  return TRUTHY.has((process.env[name] || "").trim().toLowerCase());
}

/**
 * هل يعمل وضع الاختبار الآن؟
 *
 * @returns true إن كان `QA_TEST_MODE` مفعّلاً ويمرّ حاجز الإنتاج.
 */
export function isTestMode(): boolean {
  if (!flag("QA_TEST_MODE")) return false;
  if (process.env.NODE_ENV !== "production") return true;

  if (!flag("QA_ALLOW_TEST_MODE")) {
    console.error(
      "[test-mode] QA_TEST_MODE is REFUSED in production without " +
        "QA_ALLOW_TEST_MODE=true — bot checks, CORS and rate limits stay on."
    );
    return false;
  }
  return true;
}

/**
 * الرمز الذي يجب أن يرسله الاختبار بدل رمز Turnstile الحقيقي.
 *
 * ⛔ ليس `undefined` ولا `""`: falsehood يجب أن يبقى falsehood. فلو قبل
 * الوضعُ أي رمز لأمكن لفورم حقيقي أن يتجاوز الفحص بإرسال `""` — أي أن
 * تجاوز الاختبار يتحوّل إلى ثغرة إنتاجية بمجرّد تفعيل المتغيّر.
 */
export const TEST_TURNSTILE_TOKEN = "qa-test-bypass";

/** هل هذا رمز تجاوز الاختبار؟ (مقارنة ثابتة، بلا regex) */
export function isTestTurnstileToken(token: string | undefined): boolean {
  return token === TEST_TURNSTILE_TOKEN;
}

/**
 * مختبر الأمان — **`QA_TEST_MODE` لا يكفي**، ولهذا مبدؤه منفصل.
 *
 * 🎯 التناقض الذي يحلّه: الوضع الآمن (`qa-test-server.mjs --secure`) يعمل
 * بـ`QA_TEST_MODE` **مطفأ** عمداً — هذا هو الشرط الوحيد لاختبار 403 و429
 * بلا كسر الحماية. فأي خيط اختبار يعتمد على `isTestMode()` يكون معطّلاً
 * هناك بالضبط حيث نحتاجه، ومسار 503 (عطلُ مصدر الهوية ⇒ لا 401) غير
 * قابل للبلوغ أصلاً: `QA_AUTH_MODE=local` هويةٌ في الذاكرة لا تنهار.
 *
 * ⛔ حاجز مزدوج، بالقياس نفسه الذي يستعمله `isTestMode`:
 * `QA_SECURITY_LAB` المفعَّل + تأكيد صريح `QA_ALLOW_SECURITY_LAB=true` في
 * الإنتاج. فلا ينشط الخيط إلا بتغيير متغيّرات **مقصود** في خادم معزول،
 * ولا يمنح سرّاً في نموذج الإنتاج: كل ما يفعله محاكاة **عطل** يُنتج 503
 * القائم أصلاً، لا تجاوز أي فحص.
 */
export function isSecurityLabEnabled(): boolean {
  if (!flag("QA_SECURITY_LAB")) return false;
  if (process.env.NODE_ENV !== "production") return true;

  if (!flag("QA_ALLOW_SECURITY_LAB")) {
    console.error(
      "[test-mode] QA_SECURITY_LAB is REFUSED in production without " +
        "QA_ALLOW_SECURITY_LAB=true — forced identity failure stays off."
    );
    return false;
  }
  return true;
}

/**
 * هل نجبر مصدر الهوية على الانهيار في هذا الطلب؟ (لاختبار مسار 503 وحده)
 *
 * آليتان: `QA_FORCE_IDENTITY_FAILURE=1` تُعطّل الخادم كله، ورأس
 * `x-qa-identity-failure: 1` يعطّل **طلباً واحداً** — والثانية هي ما يجعل
 * الفحص ممكناً في خادم واحد: نحتاج 503 على مسار محمي بتوكن، ثم 503 مع
 * `refundRateLimit` على تسجيل الدخول، داخل نفس العملية.
 *
 * ⚠️ الرأس **لا يُقرأ إلا بعد** `isSecurityLabEnabled()`، وهو معطّل
 * افتراضياً، فلا يمكن لعميل حقيقي في الإنتاج أن يُطِلِع هذا السلوك.
 */
export function isForcedIdentityFailure(request?: Request): boolean {
  if (!isSecurityLabEnabled()) return false;
  if (flag("QA_FORCE_IDENTITY_FAILURE")) return true;
  return request?.headers.get("x-qa-identity-failure") === "1";
}

/** رقم منفذ خادم الاختبار — لربطه بـ`ALLOWED_API_ORIGINS` وللمطابقات. */
export const TEST_SERVER_PORT = 3222;
