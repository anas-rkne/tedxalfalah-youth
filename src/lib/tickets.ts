/**
 * تعريف مركزي لأنواع التذاكر وأسعارها.
 *
 * مهم جداً أمنياً: الأسعار هنا فقط (وليس أي سعر يُرسَل من الواجهة
 * الأمامية) هي التي تُستخدم فعلياً عند إنشاء جلسة الدفع بـ Stripe —
 * هذا يمنع أي محاولة تلاعب بالسعر من طرف العميل (مثال: تعديل الطلب
 * بأدوات المطور بالمتصفح لإرسال سعر أقل).
 *
 * TODO: استبدل priceAED بالأسعار الحقيقية بمجرد تأكيدها من العميل.
 */

export interface TicketType {
  id: string;
  name: string;
  priceAED: number; // بالدرهم الإماراتي، رقم صحيح أو عشري (مثال: 50 أو 75.5)
  description: string;
  includes: string[];
}

export const TICKET_TYPES: TicketType[] = [
  {
    id: "general",
    name: "General",
    priceAED: 50, // TODO: سعر مؤقت — استبدله بالسعر الحقيقي
    description: "Full-day access to all talks and activations.",
    includes: ["Full-day access", "All talks", "Access to activations"],
  },
  {
    id: "student",
    name: "Student",
    priceAED: 30, // TODO: سعر مؤقت — استبدله بالسعر الحقيقي
    description: "Discounted rate for students with valid ID.",
    includes: ["Full-day access", "All talks", "Valid student ID required at entry"],
  },
  {
    id: "group",
    name: "Group (5+)",
    priceAED: 40, // TODO: سعر مؤقت (للشخص الواحد) — استبدله بالسعر الحقيقي
    description: "Discounted group rate for 5 or more attendees.",
    includes: ["Full-day access", "All talks", "Discounted group rate"],
  },
];

export function getTicketTypeById(id: string): TicketType | undefined {
  return TICKET_TYPES.find((t) => t.id === id);
}

/** Stripe يتطلب المبلغ بأصغر وحدة عملة (فلس بدل درهم) */
export function toFils(aed: number): number {
  return Math.round(aed * 100);
}
