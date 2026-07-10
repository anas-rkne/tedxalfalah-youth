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
