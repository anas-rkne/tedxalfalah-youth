import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const ticketSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  numberOfTickets: z.coerce.number().min(1).max(10),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  const { allowed } = await checkRateLimit(request, "tickets");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = ticketSchema.safeParse(body);

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

  // نفس نمط فورم Apply: يحفظ بـ Google Sheet منفصل إن توفرت المتغيرات،
  // وإلا يسجّل الطلب فقط لبيئة التطوير. راجع GOOGLE_TICKETS_SHEET_ID
  // بملف .env.local.example.
  if (
    process.env.GOOGLE_TICKETS_SHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    try {
      const { GoogleSpreadsheet } = await import("google-spreadsheet");
      const { JWT } = await import("google-auth-library");

      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const doc = new GoogleSpreadsheet(
        process.env.GOOGLE_TICKETS_SHEET_ID,
        serviceAccountAuth
      );
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0];
      await sheet.addRow({
        timestamp: new Date().toISOString(),
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        numberOfTickets: parsed.data.numberOfTickets,
      });
    } catch (error) {
      console.error("Ticket registration save failed:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
  } else {
    console.log(
      "[DEV] Ticket registration received (Google Sheets not configured)"
    );
  }

  return NextResponse.json({ success: true });
}
