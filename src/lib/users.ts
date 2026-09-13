/**
 * User management against a "Users" tab in the Google Sheet.
 *
 * Password hashing: crypto.scrypt with random 32-byte salt → $scrypt$<hex>$<hex>$
 * Backward compat: if no Users tab exists or is empty, ADMIN_PASSWORD env is
 * accepted as a legacy single-user fallback.
 */
import { scrypt, randomBytes, timingSafeEqual } from "crypto";

export interface UserRecord {
  username: string;
  displayName: string;
  passwordHash: string;
  role: "admin" | "viewer";
  tokenVersion: number;
  createdAt: string;
  lastLogin: string;
}

const USERS_TAB = "Users";
const USER_FIELDS = [
  "username",
  "displayName",
  "passwordHash",
  "role",
  "tokenVersion",
  "createdAt",
  "lastLogin",
] as const;

const SALT_LEN = 32;
const HASH_LEN = 64;
const PREFIX = "scrypt$";

/* ── password hashing ────────────────────────────────────── */

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(SALT_LEN);
    scrypt(password, salt, HASH_LEN, (err, derived) => {
      if (err) return reject(err);
      resolve(`${PREFIX}${salt.toString("hex")}$${derived.toString("hex")}`);
    });
  });
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith(PREFIX)) return false;
  const parts = stored.slice(PREFIX.length).split("$");
  if (parts.length !== 2) return false;
  const salt = Buffer.from(parts[0], "hex");
  const expectedHash = Buffer.from(parts[1], "hex");
  return new Promise((resolve) => {
    scrypt(password, salt, expectedHash.length, (err, derived) => {
      if (err) return resolve(false);
      resolve(timingSafeEqual(Buffer.from(derived), expectedHash));
    });
  });
}

/* ── sheet access ────────────────────────────────────────── */

async function getUsersTab() {
  const { GoogleSpreadsheet } = await import("google-spreadsheet");
  const { JWT } = await import("google-auth-library");
  const { sanitizePrivateKey } = await import("@/lib/sanitize");

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: sanitizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID as string, auth);
  await doc.loadInfo();

  let tab = doc.sheetsByTitle[USERS_TAB];
  if (!tab) {
    tab = await doc.addSheet({ title: USERS_TAB, headerValues: [...USER_FIELDS] });
  } else {
    await tab.loadHeaderRow();
    const headers = tab.headerValues ?? [];
    const missing = [...USER_FIELDS].filter((f) => !headers.includes(f));
    if (missing.length) {
      await tab.setHeaderRow([...headers, ...missing]);
    }
  }
  return tab;
}

interface UsersCacheEntry {
  at: number;
  users: UserRecord[];
}

let usersCache: UsersCacheEntry | null = null;
const USERS_CACHE_TTL_MS = 30_000;

async function getUsers(): Promise<UserRecord[]> {
  if (usersCache && Date.now() - usersCache.at < USERS_CACHE_TTL_MS) {
    return usersCache.users;
  }
  const tab = await getUsersTab();
  const rows = await tab.getRows();
  const users = rows.map((row) => ({
    username: String(row.get("username") ?? "").trim(),
    displayName: String(row.get("displayName") ?? "").trim(),
    passwordHash: String(row.get("passwordHash") ?? ""),
    role: (String(row.get("role") ?? "admin").trim() as "admin" | "viewer") || "admin",
    tokenVersion: Number(row.get("tokenVersion") || 0),
    createdAt: String(row.get("createdAt") ?? ""),
    lastLogin: String(row.get("lastLogin") ?? ""),
  })).filter((u) => u.username.length > 0);
  usersCache = { at: Date.now(), users };
  return users;
}

/* ── public API ──────────────────────────────────────────── */

export { hashPassword, verifyPassword };

/** يبطل الكاش عند أي تغيير في سجل المستخدمين (إضافة/تعديل/دخول). */
export function invalidateUsersCache(): void {
  usersCache = null;
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const users = await getUsers();
  return users.find((u) => u.username === username) || null;
}

export async function hasUsers(): Promise<boolean> {
  try {
    const users = await getUsers();
    return users.length > 0;
  } catch {
    return false;
  }
}

/** Auto-seed admin user from ADMIN_PASSWORD env var when Users tab is empty. */
export async function seedAdminIfNeeded(): Promise<void> {
  const existing = await hasUsers();
  if (existing) return;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return;
  await addUser("admin", pw, "Admin", "admin");
}

export async function verifyUserPassword(
  username: string,
  password: string
): Promise<{ user: UserRecord } | null> {
  // Auto-seed if Users tab is empty
  await seedAdminIfNeeded();
  const user = await getUserByUsername(username);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return { user };
}

export async function updateUserPassword(
  username: string,
  newPassword: string
): Promise<boolean> {
  const tab = await getUsersTab();
  const rows = await tab.getRows();
  const target = rows.find((r) => String(r.get("username") ?? "").trim() === username);
  if (!target) return false;

  const hash = await hashPassword(newPassword);
  const currentTv = Number(target.get("tokenVersion") || 0);
  target.set("passwordHash", hash);
  target.set("tokenVersion", currentTv + 1);
  await target.save();
  invalidateUsersCache();
  return true;
}

export async function updateLastLogin(username: string): Promise<void> {
  const tab = await getUsersTab();
  const rows = await tab.getRows();
  const target = rows.find((r) => String(r.get("username") ?? "").trim() === username);
  if (target) {
    target.set("lastLogin", new Date().toISOString());
    await target.save();
  }
  invalidateUsersCache();
}

export async function addUser(
  username: string,
  password: string,
  displayName: string,
  role: "admin" | "viewer" = "admin"
): Promise<UserRecord> {
  const tab = await getUsersTab();
  const hash = await hashPassword(password);
  const now = new Date().toISOString();
  await tab.addRow({
    username,
    displayName,
    passwordHash: hash,
    role,
    tokenVersion: "0",
    createdAt: now,
    lastLogin: "",
  });
  invalidateUsersCache();
  return {
    username,
    displayName,
    passwordHash: hash,
    role,
    tokenVersion: 0,
    createdAt: now,
    lastLogin: "",
  };
}
