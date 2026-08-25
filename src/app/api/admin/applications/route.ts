/**
 * /api/admin/applications — قراءة طلبات التقديم من Google Sheets وتحديث حالتها.
 *
 * GET  → كل الصفوف مع _rowNumber وstatus وnotes وdecisionEmailSentAt
 * POST { updates: [{rowNumber, status?, notes?}] }         → تحديثات مجمّعة
 * POST { action:"send-email", rowNumber, decision }         → إرسال بريد قبول/رفض
 *
 * الحماية (بالترتيب):
 *   validateOrigin (نفس أصل الموقع) → ADMIN_PASSWORD مضبوط؟ → Bearer
 *   timing-safe → Rate limit لوحة أوسع (100/10د).
 * لا Turnstile هنا — الوصول محمي بكلمة مرور المشرف وليس نموذجًا عامًا.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { checkAdminApiRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { sanitizePrivateKey } from "@/lib/sanitize";
import { isMailerConfigured, sendDecisionEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// أعمدة الـ Sheet المعروضة للواجهة (بنفس ترتيب apply/route.ts)
const SHEET_FIELDS = [
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
  "howHeardAboutUs",
  "schoolName",
  "guardianName",
  "guardianContact",
  "organizationAndRole",
  "areaOfWorkWithYouth",
  "parentalConsent",
  "consentToTerms",
] as const;

const STATUS_VALUES = ["pending", "accepted", "rejected"] as const;

// أعمدة إدارية إضافية تُنشأ تلقائيًا (لا تُكتب من فورم التقديم)
const ADMIN_COLUMNS = ["status", "notes", "decisionEmailSentAt"] as const;

const updateItemSchema = z
  .object({
    rowNumber: z.number().int().positive(),
    status: z.enum(STATUS_VALUES).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((item) => item.status !== undefined || item.notes !== undefined, {
    message: "At least one of status or notes is required",
  });

const bulkUpdateSchema = z.object({
  action: z.literal("update").optional(),
  updates: z.array(updateItemSchema).min(1).max(100),
});

const emailSchema = z.object({
  action: z.literal("send-email"),
  rowNumber: z.number().int().positive(),
  decision: z.enum(["accepted", "rejected"]),
});

async function getApplicationsSheet() {
  // نفس منطق الاتصال المستخدم في src/app/api/apply/route.ts
  const { GoogleSpreadsheet } = await import("google-spreadsheet");
  const { JWT } = await import("google-auth-library");

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
  return doc.sheetsByIndex[0];
}

/** يضمن وجود أعمدة الإدارة في الترويسة (status + notes + decisionEmailSentAt) */
async function ensureAdminColumns(sheet: {
  loadHeaderRow: () => Promise<void>;
  headerValues?: string[];
  setHeaderRow: (headers: string[]) => Promise<void>;
}) {
  await sheet.loadHeaderRow();
  const headers = sheet.headerValues ?? [];
  let changed = false;
  for (const col of ADMIN_COLUMNS) {
    if (!headers.includes(col)) {
      headers.push(col);
      changed = true;
    }
  }
  if (changed) {
    await sheet.setHeaderRow(headers);
  }
}

function noStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { allowed } = await checkAdminApiRateLimit(request);
  if (!allowed) {
    return noStore({ error: "Too many requests" }, 429);
  }

  try {
    const sheet = await getApplicationsSheet();
    await ensureAdminColumns(sheet);
    const rows = await sheet.getRows();

    const applications = rows.map((row) => {
      const record: Record<string, string | number> = {
        _rowNumber: row.rowNumber,
      };
      for (const field of SHEET_FIELDS) {
        record[field] = String(row.get(field) ?? "");
      }
      record.status = String(row.get("status") ?? "").trim() || "pending";
      record.notes = String(row.get("notes") ?? "").trim();
      record.decisionEmailSentAt = String(row.get("decisionEmailSentAt") ?? "").trim();
      return record;
    });

    return noStore({ applications }, 200);
  } catch (error) {
    console.error("[ADMIN] Failed to load applications:", error);
    return noStore({ error: "Failed to load applications" }, 500);
  }
}

export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.session.role !== "admin") {
    return noStore({ error: "Admin role required for mutations" }, 403);
  }

  const { allowed } = await checkAdminApiRateLimit(request);
  if (!allowed) {
    return noStore({ error: "Too many requests" }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStore({ error: "Invalid JSON body" }, 400);
  }

  // --- إرسال بريد قبول / رفض ---
  const emailParsed = emailSchema.safeParse(body);
  if (emailParsed.success) {
    return handleSendEmail(emailParsed.data);
  }

  // --- تحديثات مجمّعة (status / notes / combo) ---
  const bulkParsed = bulkUpdateSchema.safeParse(body);
  if (bulkParsed.success) {
    return handleBulkUpdate(bulkParsed.data.updates);
  }

  return noStore({ error: "Invalid payload", details: "Unrecognized action or fields" }, 400);
}

async function handleBulkUpdate(
  updates: { rowNumber: number; status?: string; notes?: string }[]
) {
  try {
    const sheet = await getApplicationsSheet();
    await ensureAdminColumns(sheet);
    const rows = await sheet.getRows();
    const byRow = new Map(rows.map((r) => [r.rowNumber, r]));

    let updated = 0;
    const failed: number[] = [];

    for (const item of updates) {
      const row = byRow.get(item.rowNumber);
      if (!row) {
        failed.push(item.rowNumber);
        continue;
      }
      if (item.status !== undefined) row.set("status", item.status);
      if (item.notes !== undefined) row.set("notes", item.notes);
      await row.save();
      updated++;
    }

    if (updated === 0 && failed.length > 0) {
      return noStore({ ok: false, error: "All rows not found", failed }, 404);
    }

    return noStore({ ok: true, updated, failed }, 200);
  } catch (error) {
    console.error("[ADMIN] Bulk update failed:", error);
    return noStore({ error: "Bulk update failed" }, 500);
  }
}

async function handleSendEmail(data: {
  rowNumber: number;
  decision: "accepted" | "rejected";
}) {
  if (!isMailerConfigured()) {
    return noStore({ error: "Email service is not configured" }, 503);
  }

  const { rowNumber, decision } = data;

  try {
    const sheet = await getApplicationsSheet();
    await ensureAdminColumns(sheet);
    const rows = await sheet.getRows();
    const target = rows.find((r) => r.rowNumber === rowNumber);

    if (!target) return noStore({ error: "Application not found" }, 404);

    const email = String(target.get("email") ?? "").trim();
    if (!email) return noStore({ error: "Applicant email is missing" }, 400);

    const fullName = String(target.get("fullName") ?? "").trim() || "Applicant";
    const alreadySent = String(target.get("decisionEmailSentAt") ?? "").trim();
    if (alreadySent) {
      return noStore({ error: "Decision email already sent", sentAt: alreadySent }, 409);
    }

    // أرسل أولًا ثم حدّث الحالة ووقت الإرسال (ننقذ الأصل)
    await sendDecisionEmail({ to: email, fullName, decision });

    target.set("status", decision);
    target.set("decisionEmailSentAt", new Date().toISOString());
    await target.save();

    return noStore({ ok: true, rowNumber, decision, sentAt: target.get("decisionEmailSentAt") }, 200);
  } catch (error) {
    console.error("[ADMIN] Send decision email failed:", error);
    return noStore({ error: "Email send failed" }, 502);
  }
}
