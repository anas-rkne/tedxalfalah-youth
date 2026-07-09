import { NextResponse } from "next/server";
import { z } from "zod";

const partnerSchema = z.object({
  name: z.string().min(1),
  organization: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = partnerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
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
        subject: `New partnership inquiry from ${organization}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Organization:</strong> ${organization}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br />")}</p>
        `,
      });
    } catch (error) {
      console.error("Partner inquiry email failed:", error);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
  } else {
    console.log("[DEV] Partner inquiry (RESEND_API_KEY not set):", parsed.data);
  }

  return NextResponse.json({ success: true });
}
