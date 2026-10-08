/**
 * خادم الاختبار المعزول — يشغّل التطبيق على منفذ 3222 ببيئة معزولة تماماً.
 *
 * 🎯 الهدف: فكّ قفل الطبقتين 2 و3 (فاحص الـAPI و E2E) دون المساس ببياناتك
 * ولا بخدماتك الخارجية. بدون هذا السكربت كان أي اختبار متصفح يصطدم بـ
 * 503 (لا Sheets)، ثم بـ429 (Upstash حقيقي من .env.local)، ثم بـ403
 * (Turnstile حقيقي) — ثلاثة عوائق متتالية أخّرت كل الاختبارات أشهراً.
 *
 * ⚠️ لماذا نضبط المتغيّرات هنا تحديداً: `next` يحمّل `.env.local` تلقائياً،
 * وهذا الملف يحتوي على Upstash وTurnstile الحقيقيين. تمرير قيمة فارغة في
 * بيئة العملية يتغلّب على التحميل التلقائي (Next لا يدهس متغيّراً مضبوطاً
 * مسبقاً)، فيبقى الخادم معزولاً بلا اتصال خارجي.
 *
 * الاستعمال:
 *   node scripts/qa-test-server.mjs --dev          # تشغيلvelopment مع compile
 *   node scripts/qa-test-server.mjs                # نسخة الإنتاج (تحتاج build)
 *   node scripts/qa-test-server.mjs -- -- cmd args # يشغّل أمراً ثم يهدّئ الخادم
 *
 * المتغيّرات الممرَّرة إلى الاختبارات:
 *   QA_TEST_BASE_URL, QA_ADMIN_PASSWORD, QA_VIEWER_PASSWORD
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// منفذان: 3222 لبقية الطبقات (وضع الاختبار)، و3223 للطبقة الأمنية
// (`--secure`) لأن حدّ المعدّل المفعّل هناك يولّد 429 على غيره.
const PORT = Number(
  process.argv.includes("--secure")
    ? process.env.QA_SECURE_PORT ?? 3223
    : process.env.QA_TEST_PORT ?? 3222
);
const BASE_URL = `http://localhost:${PORT}`;

// منفذ خادم Upstash الوهمي — الوضع الآمن فقط.
const FAKE_UPSTASH_PORT = Number(process.env.QA_FAKE_UPSTASH_PORT || 3999);

// مصدر واحد لبيانات الاعتماد: الخادم واختبارات Playwright يقرآن الملف نفسه.
// نسختها يدوياً في كل ملف قبل ذلك هو بالضبط صنف الانحراف الذي يُفشل عقد
// الاختبار بصمت: لو انتهت صلاحية كلمة المرور في أحدهما لفشل الاختبار بـ401
// يُقرأ «المتصفح مكسور» بينما الخادم سليم.
const creds = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts", "qa-test-credentials.json"), "utf8")
);

const ADMIN_PASSWORD = creds.adminPassword;
const VIEWER_PASSWORD = creds.viewerPassword;
const JWT_SECRET = creds.jwtSecret;

const argv = process.argv.slice(2);
const useDev = argv.includes("--dev");
const keepData = argv.includes("--keep");

/**
 * ⛔ `--secure`: خادم تُختبر فيه البوابات التي **وضع الاختبار يُطفئها**.
 *
 * 🎯 لماذا لا يكفي خادم الاختبار العادي: `QA_TEST_MODE=1` (الذيWithoutه
 * لا يعمل أي E2E) يؤسّع CORS ويقبل رمز Turnstile الوهمي ويتجاهل حدّ
 * المعدّل — أي أن **البوابات الثلاث نفسها** التي تحمي الإنتاج غير
 * موجودة في الاختبار. فكان 403 و429 و503 غير مختبَرين، لا معطوبين.
 *
 * ما يفعله هذا الوضع:
 *   - `QA_TEST_MODE` مُطفأ ⇒ `validateOrigin` يرفض الأصل الغريب فعلاً.
 *   - `TURNSTILE_SECRET_KEY` **مضبوط** (وهمي) ⇒ الطلب بلا رمز يُرفض
 *     بـ403، والحالة الأولى من `verifyTurnstile` ترفض **بلا اتصال** بشبكة
 *     Cloudflare إطلاقاً (هي `if (!token) return false` قبل أي `fetch`).
 *   - `UPSTASH_*` تُشير إلى `qa-fake-upstash.mjs` فيعمل حدّ
 *     المعدّل الحقيقي فوق `@upstash/ratelimit` الحقيقي، و`429` حقيقي.
 *
 * ⚠️ منفذ منفصل (3223 افتراضياً) لأن حدّ المعدّل المفعّل يولّد 429 على
 * بقية الاختبارات أيضاً — ومفتاح IP في التحديد `"unknown"` فالجميع
 * يشارك الدلو. لا يُشغَّل هذا الوضع إلا مع `e2e/qa-security.spec.ts`.
 */
const secureMode = argv.includes("--secure");
const forceIdentityFailure = argv.includes("--force-identity-failure");
const sep = argv.indexOf("--");
const childCmd = sep === -1 ? null : argv.slice(sep + 1);

const dataDir = path.join(os.tmpdir(), `qa-test-data-${process.pid}`);
fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

const env = {
  ...process.env,
  NODE_ENV: useDev ? "development" : "production",

  // هوية: مستخدمون في الذاكرة، بلا Google Sheets.
  QA_AUTH_MODE: "local",
  ADMIN_PASSWORD,
  QA_LOCAL_VIEWER_PASSWORD: VIEWER_PASSWORD,
  // الوضع المحلي مرفوض في الإنتاج بلا تأكيد صريح — ونسخة الإنتاج تحتاجه.
  QA_ALLOW_LOCAL_AUTH: "true",
  JWT_SECRET,

  // تجاوز فحص البوت وتوسيع CORS للاختبارات، محصوراً بهذا الخادم.
  QA_TEST_MODE: secureMode ? "" : "1",
  QA_ALLOW_TEST_MODE: secureMode ? "" : "true",
  // انهيار مصطنع لمصدر الهوية: الطريق الوحيد لبلوغ 503 في وضع local.
  // `QA_SECURITY_LAB` هو ما يسمح للخيط **برأس الطلب** (لا بمتغيّر عام)،
  // فيختبر خادماً واحداً مرّتين: 503 على مسار محمي بتوكن، ثم 503 مع
  // استرجاع رصيد المحاولات على تسجيل الدخول.
  QA_SECURITY_LAB: secureMode ? "1" : "",
  QA_ALLOW_SECURITY_LAB: secureMode ? "1" : "",
  QA_FORCE_IDENTITY_FAILURE: forceIdentityFailure ? "1" : "",

  /**
   * ⛔ عزل عن الخدمات الخارجية.
   *
   * سلسلة فارغة تُبقي `Boolean(...)` false فلا يتصل الخادم بشيء خارجي.
   * وفي الوضع الآمن لا بدّ من **سرّ** Turnstile (وإلا Development
   * يسمح بالطلب بلا رمز ولا يُختبر الفحص)، فنضع مفتاحاً وهمياً: الرمز
   * الغائب أو الخاطئ يُرفض، والرمز «الصحيح» الوحيد هو رمز الاختبار
   * المزيّف… وهو مرفوض هنا عمداً، فلا يمرّ أي طلب حقيقي — وهذا المطلوب:
   * في هذا الخادم نختبر **الرفض**، لا النجاح (النجاح له خادمه).
   */
  UPSTASH_REDIS_REST_URL: secureMode ? `http://127.0.0.1:${FAKE_UPSTASH_PORT}` : "",
  UPSTASH_REDIS_REST_TOKEN: secureMode ? "qa-fake-upstash" : "",
  TURNSTILE_SECRET_KEY: secureMode ? "0x0000000000000000000000000000000a" : "",
  /**
   * مفتاح عام وهمي: يبقى رسم أداة التحقق في الواجهة حقيقياً، و
   * `window.turnstile` مزروع في المتصفح يعطي رمزاً — فيتحقّق المسار
   * كاملاً في الوضع العادي. أما الآمن فيرفض أي رمز، فلا يحتاج أصلاً.
   */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  GOOGLE_SHEET_ID: "",

  // ⛔ بيانات مؤقتة: لا تُلمس بيانات الإنتاج ولا بيانات التطوير.
  QA_DATA_DIR: dataDir,

  ALLOWED_API_ORIGINS: `http://localhost:${PORT},http://127.0.0.1:${PORT}`,
};

if (useDev) {
  // في التطوير يُعاد تحميل المتغيّرات العامّة عند كل تغيّر في المصدر.
  env.TURBOPACK = "1";
}

const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextBin)) {
  console.error(`[qa-test-server] next binary not found at ${nextBin}`);
  process.exit(1);
}

const nextArgs = useDev ? ["dev", "-p", String(PORT)] : ["start", "-p", String(PORT)];

console.log(`\n[qa-test-server] starting: next ${nextArgs.join(" ")}`);
console.log(`[qa-test-server] data dir: ${dataDir} (isolated, deleted on exit)`);

/**
 * الوضع الآمن يحتاج «Redis» قبل أن يبدأ التطبيق.
 *
 * 🎯 السبب: المحدّدات في `rate-limit.ts` تُنشأ عند **تحميل الوحدة** فقط،
 * وتُخزَّن في متغيّر على مستوى الوحدة. فلو لم يكن الخادم الوهمي جاهزاً
 * لحظتَ بناء التطبيق، لبقي `ratelimit === null` طوال عمر العملية، وظهر
 * فرع «غير مهيّأ» بدل 429 — أي نُختبر فرعَ غياب الإعداد بدل الفرع المطلوب.
 */
async function waitForFakeUpstash(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${FAKE_UPSTASH_PORT}/ping`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (res.status < 500) return true;
    } catch {
      /* لم يبدأ بعد */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`fake upstash not ready after ${timeoutMs}ms`);
}

let fakeUpstash = null;
if (secureMode) {
  fakeUpstash = spawn(
    process.execPath,
    [path.join(ROOT, "scripts", "qa-fake-upstash.mjs"), "--port", String(FAKE_UPSTASH_PORT)],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  fakeUpstash.stdout.on("data", (chunk) => process.stdout.write(`[fake-upstash] ${chunk}`));
  fakeUpstash.stderr.on("data", (chunk) => process.stderr.write(`[fake-upstash] ${chunk}`));
  await waitForFakeUpstash();
  console.log(`[qa-test-server] fake upstash ready on ${FAKE_UPSTASH_PORT}`);
}


const server = spawn(process.execPath, [nextBin, ...nextArgs], {
  cwd: ROOT,
  env,
  stdio: ["ignore", "pipe", "pipe"],
});

/**
 * ينتظر جهوزية الخادم.
 *
 * نستعلم من مسار API صغير لا الصفحة الرئيسية: الصفحة الرئيسية تحمّل three.js
 * وخطوطاً ومكوّنات ثقيلة، فالاستطلاع عليها يعني انتظار compile لصفحة كاملة
 * بينما نريد المسار الذي ستستهلكه الاختبارات فعلاً. مهلة 180s because
 * `next dev` يترجم المسار عند أول طلب لا مسبقاً.
 */
async function waitForServer(timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = "no attempt yet";
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early with code ${server.exitCode}`);
    }
    try {
      const res = await fetch(`${BASE_URL}/api/qa/session/current?view=audience`, {
        headers: { "cache-control": "no-store" },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status < 500) return res.status;
      lastErr = `HTTP ${res.status}`;
    } catch (err) {
      lastErr = err?.message || String(err);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server not ready after ${timeoutMs}ms — last: ${lastErr}`);
}

let cleaned = false;

/** قتل متزامن يُستدعى من معالج `exit` — هناك لا وقت للـasync. */
/** ⛔ الخادم الوهمي عملية تابعة: بلا قتلها يتسرّب منفذ 3999 بعد الاختبار. */
function killFakeUpstashSync() {
  if (!fakeUpstash || fakeUpstash.exitCode !== null) return;
  try {
    spawnSync("taskkill", ["/pid", String(fakeUpstash.pid), "/T", "/F"], { stdio: "ignore" });
  } catch {
    /* انتهى مسبقاً */
  }
}

function killTreeSync() {
  if (server.exitCode !== null) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      process.kill(-server.pid, "SIGKILL");
    }
  } catch {
    /* الخادم انتهى مسبقاً */
  }
}

function cleanup(code) {
  if (cleaned) return;
  cleaned = true;
  // ⛔ قبل الخروج: بلا هذا يترك الخادم الوهمي منفذ 3999 مشغولاً، فيفشل
  // تشغيل `qa-security` التالي بـEADDRINUSE ويُقرأ كخلل اختبار.
  killFakeUpstashSync();
  if (server.exitCode === null) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        server.kill("SIGTERM");
      }
    } catch {
      /* الخادم انتهى مسبقاً */
    }
  }
  if (!keepData) {
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch {
      /* لا يهم */
    }
  }
  process.exit(code);
}

/**
 * ⛔ تفادي تسرّب العملية.
 *
 * على Windows لا يُرسل قتل الأب إشارةً للأبناء، فإيقاف المضيف بقوّة يترك
 * `next dev` يعمل على المنفذ 3222 بعد انتهاء الاختبار — وفي المرة التالية
 * يفشل كل اختبار بـEADDRINUSE، فيُحلَّن عند أن السبب «منفذ مشغول» لا أن
 * الاختبار مكسور. هذا أسرع طريق لتضليل من يشخّص.
 */
process.on("exit", () => {
  killTreeSync();
  killFakeUpstashSync();
  if (!keepData) {
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch {
      /* لا يهم */
    }
  }
});

for (const stream of [server.stdout, server.stderr]) {
  if (!stream) continue;
  stream.setEncoding("utf8");
  let buf = "";
  stream.on("data", (chunk) => {
    buf += chunk;
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      // نُخفي ضجيج الترجمة الذي لا علاقة له بالاختبار، ونُبقي ما يهم.
      if (/Compiled|compiled|watching|ready|Ready|Local:|Error|error|⨯/.test(line)) {
        console.log(`[next] ${line}`);
      }
    }
  });
}

process.on("SIGINT", () => cleanup(0));
process.on("SIGTERM", () => cleanup(0));

try {
  const status = await waitForServer();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[qa-test-server] READY  ${BASE_URL}  (probe HTTP ${status})`);
  console.log(`[qa-test-server] admin  : ${ADMIN_PASSWORD}`);
  console.log(`[qa-test-server] viewer : ${VIEWER_PASSWORD}`);
  console.log(`[qa-test-server] turnstile token: ${creds.turnstileToken}`);
  console.log("=".repeat(60));
} catch (err) {
  console.error(`[qa-test-server] FAILED: ${err.message}`);
  cleanup(1);
}

if (childCmd && childCmd.length) {
  const childEnv = {
    ...env,
    QA_TEST_BASE_URL: BASE_URL,
    QA_ADMIN_PASSWORD: ADMIN_PASSWORD,
    QA_VIEWER_PASSWORD: VIEWER_PASSWORD,
    QA_TEST_TURNSTILE_TOKEN: creds.turnstileToken,
  };

  /**
   * تشغيل الأمر الفرعي بلا `shell: true`.
   *
   * ⚠️ `shell: true` على Windows يمرّر النص إلى `cmd.exe`، فيصبح `node` كلمة
   * محفوظة تُفسَّر Trying to execute `C:\...\node` كمسار ملف. ونستعمل
   * `process.execPath` مباشرةً حين يكون الأمر `node`، فهو يحترم إصدار Node
   * الذي يشغّل هذا السكربت بالضبط بدل أن يعتمد على ما هو في PATH.
   */
  let cmd;
  let cmdArgs;
  const head = childCmd[0];
  if (head === "node") {
    cmd = process.execPath;
    cmdArgs = childCmd.slice(1);
  } else if (head === "npm") {
    cmd = process.platform === "win32" ? "npm.cmd" : "npm";
    cmdArgs = childCmd.slice(1);
  } else {
    cmd = head;
    cmdArgs = childCmd.slice(1);
  }

  console.log(`[qa-test-server] running: ${cmd} ${cmdArgs.join(" ")}`);

  const code = await new Promise((resolve) => {
    const t = spawn(cmd, cmdArgs, {
      cwd: ROOT,
      stdio: "inherit",
      env: childEnv,
    });
    t.on("close", (c) => resolve(c ?? 1));
  });

  console.log(`[qa-test-server] child exited with ${code}`);
  cleanup(code);
} else {
  console.log("[qa-test-server] idle — press Ctrl+C to stop");
}
