/**
 * JWT signing and verification using jose.
 *
 * The secret is derived from ADMIN_PASSWORD via scrypt (or JWT_SECRET env var
 * if provided). Tokens carry { sub, role, tv }.
 *
 * ⚠️ مدة التوكن طويلة عمداً: لوحة الأسئلة الحية يجب أن تصمد طوال الفعالية دون
 * إعادة دخول. كانت القيمة السابقة `30m` صلبة بلا أي تجديد — أي أن اللوحة
 * تتعطّل في منتصف العرض، ومعها لا يعود نموذج الدخول (لا يوجد مسار يمسح
 * `sessionStorage` ولا يعيد `setToken(null)`)، فتبقى كل الأزرار معطوبة حتى
 * إعادة تسجيل الدخول اليدوية. المدّة الآن تُقرأ من `ADMIN_TOKEN_TTL`.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/** 12 ساعة تغطي فعالية مسائية كاملة مع فترات الكسر والاستراحة. */
const DEFAULT_TTL = "12h";

/**
 * مدّة التوكن: `ADMIN_TOKEN_TTL` إمّا رقم (ثوانٍ) أو نصّ يقبله `jose`
 * (`"12h"` / `"2d"` / `"90m"`). القيمة الافتراضية 12 ساعة.
 */
function resolveTtl(): string | number {
  const raw = (process.env.ADMIN_TOKEN_TTL || "").trim();
  if (!raw) return DEFAULT_TTL;
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
}

export interface SessionPayload extends JWTPayload {
  sub: string;
  role: "admin" | "viewer";
  tv: number;
}

let cachedSecret: Uint8Array | null = null;

async function getSecret(): Promise<Uint8Array> {
  if (cachedSecret) return cachedSecret;

  const explicit = process.env.JWT_SECRET;
  if (explicit) {
    cachedSecret = new TextEncoder().encode(explicit);
    return cachedSecret;
  }

  const adminPw = process.env.ADMIN_PASSWORD || "";
  const salt = new TextEncoder().encode("tedx-jwt-salt-v1");
  const subtle = globalThis.crypto.subtle as SubtleCrypto;
  const keyMaterial = await subtle.importKey(
    "raw",
    new TextEncoder().encode(adminPw),
    { name: "HKDF", hash: "SHA-256" },
    false,
    ["deriveBits"]
  );
  const derived = await subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("jwt-signing-key") },
    keyMaterial,
    256
  );
  cachedSecret = new Uint8Array(derived);
  return cachedSecret;
}

export async function signJwt(payload: {
  sub: string;
  role: "admin" | "viewer";
  tv: number;
}): Promise<string> {
  const secret = await getSecret();
  return new SignJWT({ sub: payload.sub, role: payload.role, tv: payload.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(resolveTtl())
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<SessionPayload | null> {
  try {
    const secret = await getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
