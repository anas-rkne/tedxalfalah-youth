/**
 * يعقّم أي نص مُدخَل من المستخدم قبل إدراجه داخل قالب HTML (إيميلات
 * Resend تحديداً)، لمنع حقن أكواد HTML/Script قد يُدخلها مستخدم خبيث
 * بأي حقل نصي (مثل حقل Message أو Idea Summary).
 *
 * يُستخدم بكل مكان يُدرَج فيه نص المستخدم داخل سلسلة HTML بملفات
 * src/app/api/*\/route.ts
 */
export function escapeHtml(value: unknown): string {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * يعقّم مفتاح Google Service Account الخاص (GOOGLE_PRIVATE_KEY).
 *
 * يحوّل `\n` (backslash-n) إلى سطور جديدة حقيقية، ويزيل كل حرف
 * غير ASCII (لأن PEM يدعم فقط 7-bit). هذا يمنع خطأ ByteString
 * الذي قد يظهر إن وُجدت حروف عربية (أو أي حرف > 255) بالمفتاح.
 */
export function sanitizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return key;
  return key
    .replace(/\\n/g, "\n")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
}
