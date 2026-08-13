import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { validateOrigin } from "@/lib/cors";
import { sendMail, isMailerConfigured } from "@/lib/mailer";
import { APPLICATION_DEADLINE } from "@/lib/constants";

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// نفس مخطط التحقق المستخدم بالفورم من جهة العميل (src/components/apply/ApplicationForm.tsx)
const applicationSchema = z.object({
  track: z.enum(["young-speaker", "expert"]),
  fullName: z.string().min(1),
  age: z.coerce.number().min(10).max(99),
  email: z.string().email(),
  phone: z.string().min(1),
  city: z.string().min(1),
  talkIdeaTitle: z.string().min(1),
  ideaSummary: z.string().min(1).refine((val) => wordCount(val) <= 300, "Idea summary must not exceed 300 words"),
  whyItMatters: z.string().min(1).refine((val) => wordCount(val) <= 150, "Why it matters must not exceed 150 words"),
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
  turnstileToken: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.track === "young-speaker") {
    if (!data.schoolName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["schoolName"], message: "School name is required for young speakers" });
    }
    if (!data.guardianName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["guardianName"], message: "Guardian name is required for young speakers" });
    }
    if (!data.guardianContact) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["guardianContact"], message: "Guardian contact is required for young speakers" });
    }
    if (!data.parentalConsent) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parentalConsent"], message: "Parental consent is required for young speakers" });
    }
  }
  if (data.track === "expert") {
    if (!data.organizationAndRole) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["organizationAndRole"], message: "Organization and role is required for expert track" });
    }
    if (!data.areaOfWorkWithYouth) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["areaOfWorkWithYouth"], message: "Area of work with youth is required for expert track" });
    }
  }
});

type ApplicationData = z.infer<typeof applicationSchema>;

async function saveToGoogleSheet(data: ApplicationData) {
  // -------------------------------------------------------------------
  // يتطلب متغيرات البيئة: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL,
  // GOOGLE_PRIVATE_KEY. راجع .env.local.example وملف DOCUMENTATION.md
  // (القسم 7.2) لشرح كيفية إنشاء Service Account ومشاركة الـ Sheet معه.
  //
  // ملاحظة حماية بيانات القُصَّر: تأكد أن هذا الـ Google Sheet مقيّد
  // الوصول لأعضاء فريق المراجعة فقط ("Restricted" وليس "Anyone with
  // the link")، لأنه يحتوي بيانات أطفال 10-14 سنة وبيانات أولياء أمورهم.
  // -------------------------------------------------------------------
  const { GoogleSpreadsheet } = await import("google-spreadsheet");
  const { JWT } = await import("google-auth-library");

  const { sanitizePrivateKey } = await import("@/lib/sanitize");
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: sanitizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID as string,
    serviceAccountAuth
  );
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  await sheet.setHeaderRow([
    "timestamp",
    "track",
    "fullName",
    "age",
    "email",
    "phone",
    "city",
    "talkIdeaTitle",
    "ideaSummary",
    "whyItMatters",
    "themeConnection",
    "videoLink",
    "howHeardAboutUs",
    "schoolName",
    "guardianName",
    "guardianContact",
    "organizationAndRole",
    "areaOfWorkWithYouth",
    "parentalConsent",
    "consentToTerms",
  ]);

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
    parentalConsent: data.parentalConsent ? "Yes" : "No",
    consentToTerms: "Yes",
  });
}

async function sendConfirmationEmail(data: ApplicationData) {
  // نص حرفي معتمد من العميل — لا يُغيّر.
  await sendMail({
    to: data.email,
    subject: "We've Received Your Application | TEDxAlFalah Youth",
    html: `
      <p>Thank you for applying to be part of TEDxAlFalah Youth.</p>
      <p>We're excited to have received your application and to learn more
      about you, your ideas, and what you hope to bring to the TEDxAlFalah
      Youth community. Our team will carefully review all submissions as part
      of the selection process. If your application is shortlisted, a member
      of the team will be in touch with you regarding the next steps.</p>
      <p>Due to the number of applications we receive, we may not be able to
      respond individually to every submission, but please know that every
      application will be reviewed.</p>
      <p>Thank you for taking the time to share your story and ideas with us.</p>
      <p>TEDxAlFalah Youth<br />Tomorrow, Now.<br />Tomorrow is shaped by what
      we do today.</p>
    `,
  });
}

// إشعار إداري يصل لصندوق فريق المراجعة (ADMIN_APPLICATIONS_EMAIL)
// بكل بيانات الطلب، لمراجعة المتقدمين دون الحاجة لفتح Google Sheets.
async function sendAdminNotification(data: ApplicationData) {
  const trackLabel =
    data.track === "young-speaker" ? "Young Speaker" : "Expert Speaker";

  await sendMail({
    to: process.env.ADMIN_APPLICATIONS_EMAIL || "apply@tedxalfalahyouth.com",
    subject: `New Application: ${trackLabel} - ${escapeHtml(data.fullName)}`,
    html: `
      <p><strong>Track:</strong> ${escapeHtml(trackLabel)}</p>
      <p><strong>Full name:</strong> ${escapeHtml(data.fullName)}</p>
      <p><strong>Age:</strong> ${escapeHtml(data.age)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
      <p><strong>City:</strong> ${escapeHtml(data.city)}</p>
      <p><strong>Talk idea title:</strong> ${escapeHtml(data.talkIdeaTitle)}</p>
      <p><strong>Idea summary:</strong> ${escapeHtml(data.ideaSummary)}</p>
      <p><strong>Why it matters:</strong> ${escapeHtml(data.whyItMatters)}</p>
      <p><strong>Theme connection:</strong> ${escapeHtml(data.themeConnection)}</p>
      <p><strong>Video link:</strong> ${escapeHtml(data.videoLink || "-")}</p>
      <p><strong>How they heard about us:</strong> ${escapeHtml(data.howHeardAboutUs)}</p>
      <p><strong>School name:</strong> ${escapeHtml(data.schoolName || "-")}</p>
      <p><strong>Guardian name:</strong> ${escapeHtml(data.guardianName || "-")}</p>
      <p><strong>Guardian contact:</strong> ${escapeHtml(data.guardianContact || "-")}</p>
      <p><strong>Organization and role:</strong> ${escapeHtml(data.organizationAndRole || "-")}</p>
      <p><strong>Area of work with youth:</strong> ${escapeHtml(data.areaOfWorkWithYouth || "-")}</p>
      <p><strong>Parental consent:</strong> ${data.parentalConsent ? "Yes" : "No"}</p>
      <p><strong>Terms accepted:</strong> Yes</p>
      <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
    `,
  });
}

export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  // 1) Rate limiting — يمنع إغراق النموذج الأهم بالموقع
  const { allowed } = await checkRateLimit(request, "apply");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // 1.5) الإغلاق التلقائي للفورم — فحص سيرفر-سايد للموعد النهائي حتى لا
  // يُقبل أي طلب بعد الموعد عبر طلبات مباشرة (الفحص العرضي وحده لا يكفي).
  if (new Date() > new Date(APPLICATION_DEADLINE)) {
    return NextResponse.json(
      { error: "Applications are closed" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = applicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // 2) التحقق من عدم كون المُرسل بوتاً — مهم جداً هنا تحديداً لأن هذا
  // الفورم يجمع بيانات حساسة (بيانات قُصَّر وأولياء أمور)
  const isHuman = await verifyTurnstile(data.turnstileToken);
  if (!isHuman) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 403 }
    );
  }

  const hasGoogleSheetConfig =
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY;

  if (hasGoogleSheetConfig) {
    try {
      await saveToGoogleSheet(data);
    } catch (error) {
      // فشل الـ Sheet لا يُسقط الطلب: الإشعار الإداري عبر الإيميل يبقى
      // قناة الاستلام الأساسية، ونسجّل الخطأ فقط ليتضح لاحقاً.
      console.error("Google Sheets save failed:", error);
    }
  } else {
    // بيئة تطوير: لا نسجّل بيانات الطلب الكاملة بالسجل (حتى محلياً) لأنها
    // تحتوي بيانات شخصية حساسة لقُصَّر — فقط نؤكد استلام الطلب.
    if (process.env.NODE_ENV === "development")
      console.log(
        `[DEV] Application received for track "${data.track}" (Google Sheets not configured)`
      );
  }

  if (isMailerConfigured()) {
    try {
      await sendConfirmationEmail(data);
    } catch (error) {
      // لا نفشل الطلب بالكامل إن نجح حفظ البيانات وفشل الإيميل فقط —
      // نسجّل الخطأ فقط حتى لا يفقد المتقدم تأكيد استلام طلبه.
      console.error("Confirmation email failed:", error);
    }
    try {
      await sendAdminNotification(data);
    } catch (error) {
      console.error("Admin notification email failed:", error);
    }
  } else {
    if (process.env.NODE_ENV === "development") console.log("[DEV] Confirmation email would be sent (SMTP not configured)");
  }

  return NextResponse.json({ success: true });
}
