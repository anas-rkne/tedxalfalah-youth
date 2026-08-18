import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { validateOrigin } from "@/lib/cors";
import { sendMail, isMailerConfigured } from "@/lib/mailer";

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
  const originError = validateOrigin(request);
  if (originError) return originError;

  // 1) Rate limiting — يمنع الإغراق الآلي قبل أي معالجة أخرى
  const { allowed } = await checkRateLimit(request, "contact");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
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
  // إرسال فعلي عبر SMTP (صندوق Hostinger). يتطلب SMTP_HOST/SMTP_PORT/
  // SMTP_USER/SMTP_PASS بملف .env.local — راجع .env.local.example.
  //
  // كل الرسائل تصِل إلى صندوق واحد: CONTACT_EMAIL (marhaba@).
  // -------------------------------------------------------------------
  const inbox =
    process.env.CONTACT_EMAIL || "marhaba@tedxalfalahyouth.com";

  if (isMailerConfigured()) {
    try {
      await sendMail({
        to: inbox,
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
      console.error("Contact email failed:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }
  } else {
    // بيئة تطوير: لا يوجد إعداد SMTP بعد، فقط نسجّل الطلب بدون البيانات
    // الكاملة (حتى بيئة التطوير لا يجب أن تُسرّب بيانات شخصية بالسجلات)
    if (process.env.NODE_ENV === "development") console.log("[DEV] Contact form submission received (SMTP not configured). Subject:", subject);
  }

  return NextResponse.json({ success: true });
}
