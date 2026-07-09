import { NextResponse } from "next/server";
import { z } from "zod";

// نفس مخطط التحقق المستخدم بالفورم من جهة العميل (src/components/apply/ApplicationForm.tsx)
const applicationSchema = z.object({
  track: z.enum(["young-speaker", "expert"]),
  fullName: z.string().min(1),
  age: z.coerce.number(),
  email: z.string().email(),
  phone: z.string().min(1),
  city: z.string().min(1),
  talkIdeaTitle: z.string().min(1),
  ideaSummary: z.string().min(1),
  whyItMatters: z.string().min(1),
  themeConnection: z.string().min(1),
  videoLink: z.string().optional().or(z.literal("")),
  howHeardAboutUs: z.string(),
  consentToTerms: z.literal(true),
  schoolName: z.string().optional(),
  guardianName: z.string().optional(),
  guardianContact: z.string().optional(),
  parentalConsent: z.boolean().optional(),
  organizationAndRole: z.string().optional(),
  areaOfWorkWithYouth: z.string().optional(),
});

type ApplicationData = z.infer<typeof applicationSchema>;

async function saveToGoogleSheet(data: ApplicationData) {
  // -------------------------------------------------------------------
  // يتطلب متغيرات البيئة: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL,
  // GOOGLE_PRIVATE_KEY. راجع .env.local.example وخطوة 11.10 بخطة التنفيذ
  // لشرح كيفية إنشاء Service Account ومشاركة الـ Sheet معه.
  // -------------------------------------------------------------------
  const { GoogleSpreadsheet } = await import("google-spreadsheet");
  const { JWT } = await import("google-auth-library");

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID as string,
    serviceAccountAuth
  );
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  await sheet.addRow({
    timestamp: new Date().toISOString(),
    track: data.track,
    fullName: data.fullName,
    age: data.age,
    email: data.email,
    phone: data.phone,
    city: data.city,
    talkIdeaTitle: data.talkIdeaTitle,
    ideaSummary: data.ideaSummary,
    whyItMatters: data.whyItMatters,
    themeConnection: data.themeConnection,
    videoLink: data.videoLink || "",
    howHeardAboutUs: data.howHeardAboutUs,
    schoolName: data.schoolName || "",
    guardianName: data.guardianName || "",
    guardianContact: data.guardianContact || "",
    organizationAndRole: data.organizationAndRole || "",
    areaOfWorkWithYouth: data.areaOfWorkWithYouth || "",
  });
}

async function sendConfirmationEmail(data: ApplicationData) {
  // يتطلب متغير البيئة RESEND_API_KEY، ويتطلب التحقق من ملكية الدومين
  // tedxalfalahyouth.com بلوحة Resend (خطوة 11.12 و18.3 بخطة التنفيذ).
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "TEDxAlFalah Youth <marhaba@tedxalfalahyouth.com>",
    to: data.email,
    subject: "We received your TEDxAlFalah Youth application",
    html: `
      <p>Hi ${data.fullName},</p>
      <p>Thank you for applying to TEDxAlFalah Youth! We've received your
      application for the talk idea "<strong>${data.talkIdeaTitle}</strong>".</p>
      <p>Our review community will be in touch according to the timeline
      published on our website. In the meantime, feel free to explore the
      rest of the site.</p>
      <p>— The TEDxAlFalah Youth Team</p>
    `,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = applicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const hasGoogleSheetConfig =
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY;

  if (hasGoogleSheetConfig) {
    try {
      await saveToGoogleSheet(data);
    } catch (error) {
      console.error("Google Sheets save failed:", error);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 }
      );
    }
  } else {
    console.log(
      "[DEV] Application submission (Google Sheets not configured):",
      data
    );
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await sendConfirmationEmail(data);
    } catch (error) {
      // لا نفشل الطلب بالكامل إن نجح حفظ البيانات وفشل الإيميل فقط —
      // نسجّل الخطأ فقط حتى لا يفقد المتقدم تأكيد استلام طلبه.
      console.error("Confirmation email failed:", error);
    }
  } else {
    console.log(
      `[DEV] Confirmation email would be sent to ${data.email} (RESEND_API_KEY not set)`
    );
  }

  return NextResponse.json({ success: true });
}
