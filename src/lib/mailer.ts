/**
 * إرسال الإيميلات عبر SMTP الخاص بصناديق Hostinger على دومين
 * tedxalfalahyouth.com — بديل Resend الذي يتطلب خدمة خارجية ومفاتيح.
 *
 * يقرأ الإعدادات من متغيرات البيئة:
 *   SMTP_HOST=smtp.hostinger.com
 *   SMTP_PORT=465
 *   SMTP_USER=  → صندوق مرسل حقيقي (marhaba@tedxalfalahyouth.com)
 *   SMTP_PASS=
 *   EMAIL_FROM= → اسم وبريد المُرسِل الظاهر (اختياري)
 *
 * إن لم تكن بيانات SMTP مضبوطة بعد يسجّل تحذيراً ولا يفشل الطلب
 * (fail-open) — نفس سلوك بقية الخدمات غير المفعّلة في المشروع.
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { escapeHtml } from "@/lib/sanitize";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.hostinger.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "TEDxAlFalah Youth <marhaba@tedxalfalahyouth.com>";

export function isMailerConfigured(): boolean {
  return Boolean(
    SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

let transport: Transporter | null = null;

function getTransport(): Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASS as string,
      },
    });
  }
  return transport;
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  if (!isMailerConfigured()) {
    console.warn(
      "[MAILER] SMTP not configured (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS) - email skipped."
    );
    return;
  }
  await getTransport().sendMail({ from: EMAIL_FROM, ...options });
}

/* ------------------------------------------------------------------ */
/* إيميل قرار القبول / الرفض — ثنائي اللغة مع نموذج HTML بسيط راقي    */
/* ------------------------------------------------------------------ */

interface DecisionEmailOpts {
  to: string;
  fullName: string;
  decision: "accepted" | "rejected";
}

const DECISION_SUBJECT: Record<string, string> = {
  accepted:
    "🎉 تهانينا! تم قبولك في TEDxAlFalah Youth | Congratulations — You're In!",
  rejected:
    "بشأن طلبك في TEDxAlFalah Youth | Regarding Your Application — TEDxAlFalah Youth",
};

const DECISION_BODY_AR: Record<string, { greeting: string; body: string; closing: string }> = {
  accepted: {
    greeting: "تهانينا {name}!",
    body: `يسعدنا إبلاغك بأنه قد **تم قبولك** كمتحدث في فعالية TEDxAlFalah Youth.

🗓️ **التاريخ:** 19 ديسمبر 2026
📍 **المكان:** نبض الفلاح — أبوظبي

نتواصل معك قريباً بتفاصيل التسجيل والتحضير.`,

    closing: "مع أطيب التحيات،\nفريق TEDxAlFalah Youth",
  },
  rejected: {
    greeting: "مرحباً {name}،",
    body: `شكراً جزيلاً لتقديمك واهتمامك بفعالية TEDxAlFalah Youth.

بعد مراجعة دقيقة لكل الطلبات، يسعدنا إبلاغك بأنه قد **لم يتم قبول طلبك** في هذه الدورة نظراً لعدد الطلبات الكبير ومحدودية المقاعد.

نشجعك على التقديم في فعالياتنا المستقبلية، ونwaldك بأن كل فكرة تستحق منصة.\n\nنتمنى لك التوفيق دائماً.`,

    closing: "مع خالص التقدير،\nفريق TEDxAlFalah Youth",
  },
};

const DECISION_BODY_EN: Record<string, { greeting: string; body: string; closing: string }> = {
  accepted: {
    greeting: "Congratulations, {name}!",
    body: `We are thrilled to let you know that you have been **accepted as a speaker** at TEDxAlFalah Youth!

🗓️ **Date:** December 19, 2026
📍 **Venue:** Nabd AlFalah — Abu Dhabi

We will be in touch shortly with registration and preparation details.`,

    closing: "Warm regards,\nTEDxAlFalah Youth Team",
  },
  rejected: {
    greeting: "Hello {name},",
    body: `Thank you so much for your interest in TEDxAlFalah Youth and for taking the time to apply.

After careful review of all applications, we regret to inform you that your application was **not selected** for this edition due to the high volume of submissions and limited speaking slots.

We strongly encourage you to apply at our future events — every idea deserves a stage.\n\nWishing you all the best.`,

    closing: "With sincere appreciation,\nTEDxAlFalah Youth Team",
  },
};

function stripTripleStar(text: string): string {
  // Markdown-ish `**bold**` → <strong>bold</strong>
  return text.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
}

function nl2br(text: string): string {
  return text.replace(/\n/g, "<br>");
}

function buildDecisionHtml(decision: "accepted" | "rejected", fullName: string): string {
  const ar = DECISION_BODY_AR[decision];
  const en = DECISION_BODY_EN[decision];
  const accent = decision === "accepted" ? "#10B981" : "#EF4444";
  const label =
    decision === "accepted"
      ? { ar: "تم القبول ✓", en: "Accepted ✓" }
      : { ar: "لم يتم القبول", en: "Not Selected" };

  const replace = (tpl: string, name: string) =>
    tpl.replace("{name}", escapeHtml(name));

  return `
<div style="font-family:system-ui,-apple-system,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:${accent};color:#fff;padding:18px 22px;border-radius:12px 12px 0 0;font-size:14px;font-weight:700;letter-spacing:.3px;">
    TEDxAlFalah Youth — ${label.ar} | ${label.en}
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:28px 22px;border-radius:0 0 12px 12px;">
    <!-- AR -->
    <p style="font-size:17px;font-weight:700;margin:0 0 10px;">${replace(ar.greeting, fullName)}</p>
    <div dir="rtl" lang="ar" style="font-size:14px;line-height:1.75;color:#333;margin-bottom:26px;">
      ${nl2br(stripTripleStar(replace(ar.body, fullName)))}
      <p style="white-space:pre-line;margin-top:18px;color:#555;">${nl2br(replace(ar.closing, fullName))}</p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">
    <!-- EN -->
    <p style="font-size:17px;font-weight:700;margin:0 0 10px;">${replace(en.greeting, fullName)}</p>
    <div dir="ltr" lang="en" style="font-size:14px;line-height:1.75;color:#333;">
      ${nl2br(stripTripleStar(replace(en.body, fullName)))}
      <p style="white-space:pre-line;margin-top:18px;color:#555;">${nl2br(replace(en.closing, fullName))}</p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0 16px;">
    <p style="font-size:12px;color:#999;margin:0;">© ${new Date().getFullYear()} TEDxAlFalah Youth · tedxalfalahyouth.com</p>
  </div>
</div>`;
}

export async function sendDecisionEmail({
  to,
  fullName,
  decision,
}: DecisionEmailOpts): Promise<void> {
  await sendMail({
    to,
    subject: DECISION_SUBJECT[decision],
    html: buildDecisionHtml(decision, fullName),
  });
}