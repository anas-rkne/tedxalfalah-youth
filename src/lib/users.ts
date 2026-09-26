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

/**
 * ⚠️ سقف مدة استخدام نسخة قديمة عند فشل Google Sheets.
 *
 * هدفه التوازن: نريد أن **نكمل الخدمة** أثناء انقطاع الشبكة أو نفاد حصة
 * الـAPI (وهو ما كان يرمي 500 على كل دخول durante الحفل)، لكننا لا نريد أن
 * نُبقي حساباً **مُلغى أو مُنزَعاً** فعّالاً للأبد. لذلك بعد هذه المدة
 * نُفشل الطلب صراحةً بدل المتابعة على بيانات منسية.
 */
const USERS_STALE_MAX_MS = 15 * 60_000;

/** سجل خطأ واحد فقط حتى لا نغرق سجل الخادم بآلاف الرسائل أثناء انقطاع. */
let loggedStaleFallback = false;

function mapUserRow(row: {
  get: (key: string) => unknown;
}): UserRecord {
  return {
    username: String(row.get("username") ?? "").trim(),
    displayName: String(row.get("displayName") ?? "").trim(),
    passwordHash: String(row.get("passwordHash") ?? ""),
    role: (String(row.get("role") ?? "admin").trim() as "admin" | "viewer") || "admin",
    tokenVersion: Number(row.get("tokenVersion") || 0),
    createdAt: String(row.get("createdAt") ?? ""),
    lastLogin: String(row.get("lastLogin") ?? ""),
  };
}

/** قراءة حديثة من Google Sheet (بلا كاش). */
async function fetchUsers(): Promise<UserRecord[]> {
  const tab = await getUsersTab();
  const rows = await tab.getRows();
  return rows.map(mapUserRow).filter((u) => u.username.length > 0);
}

/**
 * التحديث الجاري: نشارك وعداً واحداً بين كل الطلبات المتزامنة.
 *
 * ⚠️ بدون هذا، دخول 10 مشرفين في اللحظة نفسها = 10 قراءات من الشيت في
 * اللحظة نفسها، وهي ما كان يستهلك حصة "Read requests per minute" (60/دقيقة)
 * ويُسقط تسجيل الدخول بـ429.participantEntry واحد يكفي الجميع.
 */
let inflightUsers: Promise<UserRecord[]> | null = null;

async function getUsers(): Promise<UserRecord[]> {
  if (usersCache && Date.now() - usersCache.at < USERS_CACHE_TTL_MS) {
    return usersCache.users;
  }
  if (inflightUsers) return inflightUsers;

  inflightUsers = (async () => {
    try {
      const users = await fetchUsers();
      usersCache = { at: Date.now(), users };
      loggedStaleFallback = false;
      return users;
    } catch (error) {
      // ⛔ فشل القراءة ≠ "لا يوجد مستخدمون". سابقاً كان `hasUsers` يبتلع
      // الخطأ ويعيد `false`، فيتعلّم `seedAdminIfNeeded` أن الجدول فارغ
      // ويضيف صف `admin` جديداً بكلمة مرور متغيّر البيئة — أي إعادة ضبط
      // غير مقصودة لحساب المدير وازدواج باسم `admin` أثناء انقطاع بسيط.
      // الآن نميّز: خطأ sheets = لا نزرع، ونتعامل مع النسخة القديمة إن وُجدت.
      if (usersCache && Date.now() - usersCache.at < USERS_STALE_MAX_MS) {
        if (!loggedStaleFallback) {
          loggedStaleFallback = true;
          console.error(
            "[auth] Google Sheets unavailable; serving the cached user list " +
              "(stale-while-error). Seed and user changes are paused meanwhile."
          );
        }
        return usersCache.users;
      }
      throw error;
    } finally {
      inflightUsers = null;
    }
  })();

  return inflightUsers;
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

/**
 * هل يوجد مستخدمون مسجّلون؟ — **ترمي خطأً عند تعذّر القراءة**.
 *
 * ⚠️ لا نُبتلع الخطأ هنا عمداً: الدالة السابقة كانت تُعيد `false` عند أي
 * فشل، وكان `seedAdminIfNeeded` يقرأها "الجدول فارغ" فيزرع صف `admin`
 * جديداً فوق حساب حقيقي. الآن التمييز واضح: `false` تعني "فُحص وقُرئ ووجد
 * فارغاً" فقط، وأي خطأ يمرّر إلى المستدعي.
 */
export async function hasUsers(): Promise<boolean> {
  const users = await getUsers();
  return users.length > 0;
}

/**
 * زرع حساب المدير الأول مرة واحدة عند confirm أن الجدول **فارغ فعلاً**.
 *
 * ⚠️ لا تزرع عند فشل القراءة: خطأ Sheets أو نفاد الحصة لا يعني فراغاً.
 * في الحالة الفاشلة نتخطّى الزراعة ونترك الـthrow يصل إلى المستدعي فيفشل
 * الدخول برسالة صادقة، بدل إنشاء حساب مفاجئ أو قفل المديرين خارج الحفل.
 */
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

/**
 * تسجيل وقت آخر دخول — **أفضل- effort، لا يجوز أن يُسقط تسجيل الدخول**.
 *
 * ⚠️ كان `await updateLastLogin(...)` داخل مسار الدخول: فشل الكتابة في Google
 * Sheets (نفاد حصة الـAPI مثلاً) كان يرمي استثناءً بعد التحقق من كلمة المرور
 * مباشرة، فيردّ المتصفح 500 ولا يستطيع المشرف دخول اللوحة أثناء الحفل.
 *
 * كما كان يُبطل الكاش بالكامل، فكان كل دخول يجبر الطلب الإداري التالي على
 * قراءة الشيت من جديد. الآن نحدّث السجل داخل الكاش (حقل تدقيق لا أثر له على
 * المصادقة) ونُبطل الكاش فقط إن فشلت القراءة.
 */
export async function updateLastLogin(username: string): Promise<void> {
  const now = new Date().toISOString();
  const cached = usersCache?.users.find((u) => u.username === username);
  if (cached) cached.lastLogin = now;

  try {
    const tab = await getUsersTab();
    const rows = await tab.getRows();
    const target = rows.find((r) => String(r.get("username") ?? "").trim() === username);
    if (target) {
      target.set("lastLogin", now);
      await target.save();
    }
  } catch (error) {
    // بيانات تدقيق فقط: نُبطل الكاش كي تُصحّح القراءة التالية، ولا نُفشل الدخول.
    invalidateUsersCache();
    console.error("[auth] updateLastLogin failed (login still succeeded):", error);
  }
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
