import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.enum([
    "General",
    "Speaking",
    "Sponsorship",
    "Volunteering",
    "Media",
  ]),
  message: z.string().min(10),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  // 1) Rate limiting — يمنع الإغراق الآلي قبل أي معالجة أخرى
  const { allowed } = await checkRateLimit(request, "contact");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, subject, message, turnstileToken } = parsed.data;

  // 2) التحقق من عدم كون المُرسل بوتاً
  const isHuman = await verifyTurnstile(turnstileToken);
  if (!isHuman) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 403 }
    );
  }

  // -------------------------------------------------------------------
  // إرسال فعلي عبر Resend. يتطلب متغير بيئة RESEND_API_KEY.
  // راجع ملف .env.local.example بجذر المشروع للحصول على قائمة كل
  // المتغيرات المطلوبة.
  // -------------------------------------------------------------------
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "TEDxAlFalah Youth <marhaba@tedxalfalahyouth.com>",
        to: "marhaba@tedxalfalahyouth.com",
        replyTo: email,
        subject: `[${subject}] New message from ${escapeHtml(name)}`,
        html: `
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
        `,
      });
    } catch (error) {
      console.error("Resend email failed:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }
  } else {
    // بيئة تطوير: لا يوجد مفتاح Resend بعد، فقط نسجّل الطلب بدون البيانات
    // الكاملة (حتى بيئة التطوير لا يجب أن تُسرّب بيانات شخصية بالسجلات)
    console.log("[DEV] Contact form submission received (RESEND_API_KEY not set). Subject:", subject);
  }

  return NextResponse.json({ success: true });
}
