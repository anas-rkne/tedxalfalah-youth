import { NextResponse } from "next/server";
import { z } from "zod";

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
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = parsed.data;

  // -------------------------------------------------------------------
  // إرسال فعلي عبر Resend. يتطلب متغير بيئة RESEND_API_KEY.
  // راجع ملف .env.local.example بجذر المشروع للحصول على قائمة كل
  // المتغيرات المطلوبة، وخطوة 16.4 بخطة التنفيذ لشرح الإعداد الكامل.
  // -------------------------------------------------------------------
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "TEDxAlFalah Youth <marhaba@tedxalfalahyouth.com>",
        to: "marhaba@tedxalfalahyouth.com",
        replyTo: email,
        subject: `[${subject}] New message from ${name}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br />")}</p>
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
    // بيئة تطوير: لا يوجد مفتاح Resend بعد، فقط نسجّل الطلب
    console.log("[DEV] Contact form submission (RESEND_API_KEY not set):", {
      name,
      email,
      subject,
      message,
    });
  }

  return NextResponse.json({ success: true });
}
