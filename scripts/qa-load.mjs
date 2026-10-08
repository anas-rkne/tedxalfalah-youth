/**
 * اختبار الحمل (load) والاختبار المطوّل (soak) لمسارات Q&A.
 *
 * 🎯 لماذا استدعاءات خام بدل Playwright: هذه الطبقة تقيس **زمن الخادم**
 * تحت تزامن حقيقي، لا سلوك واجهة. متصفّح لكل طلب يضخّم الزمن بمئة ضعف
 * ويضيف ضجيجاً (JS، رسم، traces) فلا يبقى نصف الميلي ثانية ذا معنى.
 * و`fetch` هنا بلا اعتماديات: نفس Node الذي شغّل الخادم.
 *
 * ⛔ ق absoluto: لا يعمل إلا على خادم محلي. التشغيل ضد الإنتاج ليس
 *    «اختباراً» بل هجوم حِمل من صندوقك — فالرفض هنا guard لا خيار.
 *
 * Semantics:
 *   - كل طلب بعنوان IP مختلف: المحدّد `${formKey}:${ip}`، وثلاثون عنواناً
 *     على عنوان واحد تعني أن واحداً منها ينفجر بـ429 ليُقرأ الفشل كخلل
 *     أداء بينما هو سلوك صحيح للبوابة. ولهذا عنوان لكل طلب.
 *   - مسار القراءة `session/current` هو **الحرج فعلياً**: كل حاضر في
 *     القاعة يستطلعه كل ٤ ثوانٍ، و600/10 دقائق لكل IP ⇒ اختبار مطوّل على
 *     IP واحد يقيس حدّ المعدّل لا الأداء. وكل عنوان هنا مختلف (انظر `nextIp`).
 *   - مسار الكتابة `qa/question` يُقاس بحالته المرفوضة (403 بلا رمز)،
 *     لأن نجاحه يتطلّب جلسة نشطة + سجل حضور + رمز Turnstile، وهي
 *     تبعيات حالة لا قياس أداء.
 *
 * الاستعمال:
 *   node scripts/qa-load.mjs --base=http://localhost:3222
 *   node scripts/qa-load.mjs --concurrency=40 --seconds=30 --phase=soak
 */

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const BASE = arg("base", process.env.QA_TEST_BASE_URL || "http://localhost:3222");
const READ_PATH = "/api/qa/session/current?view=audience";
const WRITE_PATH = "/api/qa/question";

/**
 * ⛔ بوابة الأمان: خادم محلي فقط.
 *
 * `localhost` و`127.0.0.1` و`::1` فقط. أيّ اسم آخر (وإن كان يشير إلى
 * جهازك) ممنوع، لأن-domains زي `*.ngrok-free.app` يمرّ من نفس DNS.
 */
function assertLocalTarget(base) {
  let host;
  try {
    host = new URL(base).hostname;
  } catch {
    throw new Error(`--base غير صالح: ${base}`);
  }
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  if (!local && !args.includes("--allow-remote")) {
    console.error(
    `[load] ⛔ مرفوض: ${base} ليس هدفاً محلياً. هذا قياس حِمل، وتشغيله على\n` +
      "خادم حيّ هجوم لا اختبار. استعمل --allow-remote إن كنت تعرف ما تفعل."
    );
    process.exit(2);
  }
}

/** نسبة مئوية من عيّنات مرتّبة تصاعدياً. */
function pct(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[Math.max(0, idx)] * 100) / 100;
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avg: Math.round((sum / (sorted.length || 1)) * 100) / 100,
    p50: pct(sorted, 50),
    p95: pct(sorted, 95),
    p99: pct(sorted, 99),
    max: sorted.length === 0 ? 0 : Math.round(sorted[sorted.length - 1] * 100) / 100,
  };
}

let ipCounter = 0;
const nextIp = () => `198.51.100.${(ipCounter = (ipCounter % 250) + 1)}`;

/** طلب واحد مقيس. يُرجع الزمن بالمللي ثانية. */
async function timedRequest(url, init) {
  const started = performance.now();
  try {
    const res = await fetch(url, init);
    // استهلاك الجسم ضروري:.stream غير مقروء يبقي الاتصال مفتوحاً فينقص
    // التزامن الفعلي، فيُقاس «منفذ مشغول» بدل زمن الاستجابة.
    await res.arrayBuffer();
    return { ms: performance.now() - started, status: res.status };
  } catch (error) {
    return { ms: performance.now() - started, status: 0, error: String(error) };
  }
}

/** موحّد: N طلبات متزامنة، كلٌّ بعنوان IP مختلف. */
async function burst(path, count, { method = "GET", body } = {}) {
  const results = await Promise.all(
    Array.from({ length: count }, () =>
      timedRequest(`${BASE}${path}`, {
        method,
        headers: {
          "x-forwarded-for": nextIp(),
          origin: BASE,
          ...(body ? { "content-type": "application/json" } : {}),
        },
        body: body ? JSON.stringify({ ...body, text: `${path} ${nextIp()}` }) : undefined,
      })
    )
  );
  const times = results.map((r) => r.ms);
  const statuses = {};
  for (const r of results) statuses[r.status] = (statuses[r.status] || 0) + 1;
  return { ...summarize(times), statuses, errors: results.filter((r) => r.error).length };
}

async function readPhase(concurrency, rounds) {
  console.log(`\n[load] read burst: ${concurrency} concurrent × ${rounds} rounds`);
  const all = [];
  let failures = 0;
  for (let r = 0; r < rounds; r++) {
    const res = await Promise.all(
      Array.from({ length: concurrency }, () =>
        timedRequest(`${BASE}${READ_PATH}`, { headers: { "x-forwarded-for": nextIp(), origin: BASE } })
      )
    );
    all.push(...res.map((x) => x.ms));
    failures += res.filter((x) => x.status !== 200).length;
  }
  return { phase: "read", ...summarize(all), failures, requests: all.length };
}

async function writePhase(concurrency) {
  console.log(`[load] write burst: ${concurrency} concurrent × 403 expectation`);
  const res = await burst(
    WRITE_PATH,
    concurrency,
    { method: "POST", body: { attendeeId: "load", name: "Load", text: "load probe" } }
  );
  // 403 = البوابة تعمل كما يجب. 429 = حدّ لكل IP (غير متوقّع هنا لان-
  // عناوين مختلفة)، و200 يعني تجاوز Turnstile ⇒ **ثغرة**.
  const bad = (res.statuses["429"] || 0) + (res.statuses["200"] || 0);
  return { phase: "write", ...res, unexpected: bad };
}

async function soakPhase(seconds, concurrency) {
  console.log(`[load] soak: ${seconds}s @ ${concurrency} concurrent (read path)`);
  const all = [];
  const deadline = Date.now() + seconds * 1000;
  let inFlight = [];
  let requests = 0;
  let failures = 0;

  while (Date.now() < deadline) {
    inFlight = Array.from({ length: concurrency }, () =>
      timedRequest(`${BASE}${READ_PATH}`, { headers: { "x-forwarded-for": nextIp(), origin: BASE } })
    );
    const settled = await Promise.all(inFlight);
    all.push(...settled.map((x) => x.ms));
    failures += settled.filter((x) => x.status !== 200).length;
    requests += settled.length;
  }

  return { phase: "soak", seconds, ...summarize(all), failures, requests };
}

async function main() {
  assertLocalTarget(BASE);

  const phase = arg("phase", "all");
  const concurrency = Number(arg("concurrency", "20"));
  const rounds = Number(arg("rounds", "3"));
  const seconds = Number(arg("seconds", "15"));
  const maxP95 = Number(arg("max-p95", "800"));
  const maxErrorRate = Number(arg("max-error-rate", "1"));

  console.log(`[load] target ${BASE}  phase=${phase} concurrency=${concurrency}`);

  // إحماء: الطلبات الأولى بارد (JIT، ذاكرة مؤقتة) وتشوّه القياس، فنتخلّص منها.
  await timedRequest(`${BASE}${READ_PATH}`, { headers: { "x-forwarded-for": nextIp(), origin: BASE } });

  const results = [];
  if (phase === "all" || phase === "read") results.push(await readPhase(concurrency, rounds));
  if (phase === "all" || phase === "write") results.push(await writePhase(concurrency));
  if (phase === "all" || phase === "soak") results.push(await soakPhase(seconds, concurrency));

  console.log("\n=== load summary (ms) ===");
  console.log(
    ["phase", "requests", "avg", "p50", "p95", "p99", "max", "failures"].join("\t")
  );
  for (const r of results) {
    console.log(
      [r.phase, r.count ?? r.requests, r.avg, r.p50, r.p95, r.p99, r.max, r.failures ?? 0].join("\t")
    );
  }

  const readish = results.filter((r) => r.phase === "read" || r.phase === "soak");
  const totalRequests = readish.reduce((a, r) => a + (r.count ?? r.requests), 0);
  const totalFailures = readish.reduce((a, r) => a + (r.failures ?? 0), 0);
  const errorRate = totalRequests === 0 ? 0 : (totalFailures / totalRequests) * 100;
  const worstP95 = readish.reduce((a, r) => Math.max(a, r.p95), 0);
  const writeBad = results.find((r) => r.phase === "write")?.unexpected ?? 0;

  console.log(`\n[load] worst p95 = ${worstP95}ms (limit ${maxP95})`);
  console.log(`[load] error rate = ${errorRate.toFixed(2)}% (limit ${maxErrorRate}%)`);
  console.log(`[load] write-path unexpected (429/200) = ${writeBad}`);

  // ⛔ العتبات **مختبَرة** لا موثّقة فقط: معيار الأداء الذي لا يُفشل
  //    شيئاً ليس معياراً. وحارس 403/429 في مسار الكتابة هو نفسه.
  const failures = [];
  if (worstP95 > maxP95) failures.push(`p95 ${worstP95}ms > ${maxP95}ms`);
  if (errorRate > maxErrorRate) failures.push(`error rate ${errorRate.toFixed(2)}% > ${maxErrorRate}%`);
  if (writeBad > 0) failures.push(`write path returned ${writeBad} unexpected 429/200`);

  if (failures.length) {
    console.error(`\n[load] ⛔ FAIL: ${failures.join(" | ")}`);
    process.exit(1);
  }
  console.log("\n[load] ✅ within thresholds");
}

main().catch((error) => {
  console.error("[load] fatal:", error);
  process.exit(1);
});
