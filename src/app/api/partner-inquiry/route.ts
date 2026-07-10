import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const partnerSchema = z.object({
  name: z.string().min(1),
  organization: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  message: z.string().min(10),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  const { allowed } = await checkRateLimit(request, "partner-inquiry");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = partnerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const isHuman = await verifyTurnstile(parsed.data.turnstileToken);
  if (!isHuman) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 403 }
    );
  }

  const { name, organization, email, phone, message } = parsed.data;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "TEDxAlFalah Youth <partner@tedxalfalahyouth.com>",
        to: "partner@tedxalfalahyouth.com",
        replyTo: email,
        subject: `New partnership inquiry from ${escapeHtml(organization)}`,
        html: `
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Organization:</strong> ${escapeHtml(organization)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
        `,
      });
    } catch (error) {
      console.error("Partner inquiry email failed:", error);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
  } else {
    console.log("[DEV] Partner inquiry received (RESEND_API_KEY not set) from organization:", organization);
  }

  return NextResponse.json({ success: true });
}
