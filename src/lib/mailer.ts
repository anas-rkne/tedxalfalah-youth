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