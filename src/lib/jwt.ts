/**
 * JWT signing and verification using jose.
 *
 * The secret is derived from ADMIN_PASSWORD via scrypt (or JWT_SECRET env var
 * if provided). Tokens carry { sub, role, tv } with 30-minute expiry.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

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
    .setExpirationTime("30m")
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
