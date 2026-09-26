/**
 * فحص تطابق مفاتيح i18n بين اللغات.
 *
 * لماذا هذا الفحص مهم: صفحة تستخدم `t("key")` بمفتاح غير موجود تُظهر نص المفتاح
 * نفسه للمستخدم (أو `undefined`)، ولا يلتقطه TypeScript ولا ESLint. وقد تسبّب
 * في هذه الشيفرة فعلاً مفاتيح ناقصة في `qa.*`.
 *
 * الاستخدام:  node scripts/i18n-keys.mjs
 * الخروج:      0 إذا تطابقت، 1 مع قائمة المفاتيح الناقصة/الزائدة.
 */
import fs from "node:fs";
import path from "node:path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");

/** يجمع المسارات الورقية لمفاتيح message.json بصيغة `a.b.c`. */
function flatten(obj, prefix = "", out = []) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    out.push(prefix);
    return out;
  }
  for (const [key, value] of Object.entries(obj)) {
    flatten(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

function loadLocale(file) {
  const full = path.join(MESSAGES_DIR, file);
  if (!fs.existsSync(full)) {
    console.error(`✗ ملف مفقود: messages/${file}`);
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (err) {
    console.error(`✗ JSON غير صالح في messages/${file}: ${err.message}`);
    process.exit(1);
  }
  return parsed;
}

const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json")).sort();
if (files.length < 2) {
  console.error("✗ نحوي ملفين على الأقل في messages/ للمقارنة");
  process.exit(1);
}

const baseFile = files[0];
const baseKeys = new Set(flatten(loadLocale(baseFile)));

console.log(`مقارنة ${files.length} ملفات: الأساس ${baseFile} بـ ${baseKeys.size} مفتاحاً\n`);

let failed = false;
for (const file of files.slice(1)) {
  const keys = new Set(flatten(loadLocale(file)));
  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  ✓ ${file}: ${keys.size} مفتاحاً — مطابق تماماً`);
    continue;
  }
  failed = true;
  console.log(`  ✗ ${file}: ناقص=${missing.length} زائد=${extra.length}`);
  for (const k of missing) console.log(`      - ناقص: ${k}`);
  for (const k of extra) console.log(`      + زائد: ${k}`);
}

if (failed) {
  console.error("\nفشل التطابق — راجع المفاتيح أعلاه.");
  process.exit(1);
}
console.log("\nكل اللغات متطابقة في المفاتيح.");
