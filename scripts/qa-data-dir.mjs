import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SUITE_DIR = path.join(os.tmpdir(), "opencode", "qa-live-suite");
const SERVER_JSON = path.join(SUITE_DIR, "server.json");

/**
 * يحدّد مجلد بيانات الاختبار داخل السكربت نفسه بدل الاعتماد على البيئة.
 *
 * ⚠️ لماذا؟ كان الفحص 13 (ترقية ملف الأصوات القديم) يُتخطّى صامتاً إن لم يكن
 * `QA_DATA_DIR` مضبوطاً — فينقص العدد بـ assertionين تحت `npm run` دون أي
 * إشارة، أي أن `npm run test:qa:api` كان يفحص أقل مما يفحصه الاستدعاء
 * المباشر. الآن يقرأ السكربت المسار من `server.json` الذي يكتبه مشغّل
 * الخادم، ويستخدم المتغيّر فقط كبديل.
 */
export function resolveDataDir() {
  const fromEnv = process.env.QA_DATA_DIR;
  if (fromEnv) return fromEnv;

  try {
    const info = JSON.parse(fs.readFileSync(SERVER_JSON, "utf-8"));
    if (info?.dataDir) return info.dataDir;
  } catch {
    /* لا يوجد server.json — نرجع للمسار الافتراضي */
  }
  return path.join(SUITE_DIR, "data");
}
