/**
 * خادم Upstash REST **وهمي في الذاكرة** — يجعل اختبار حدّ المعدّل ممكناً
 * بلا اشتراك ولا اتصال خارجي.
 *
 * 🎯 لماذا لا يكفي اختبار الوحدة؟ حدّ المعدّل في الإنتاج هو
 * `@upstash/ratelimit` فوق Redis حقيقي؛ و`src/lib/rate-limit.ts` يُنشئ
 * المحددّات عند **تحميل الوحدة** فقط. أي أن أي وحدة اختبار تعمل بلا
 * `UPSTASH_*` ترى `ratelimit === null` وتسير على فرع «غير مهيّأ» — وهو
 * بالضبط الفرع الذي لا يُختبر. النتيجة: 429 غير مختبَر، لا لأن الكود
 * معطوب، بل لأن البوابة التي تُقفله غير موجودة في بيئة الاختبار.
 *
 * ⛔ لماذا لا نكتفي بتخفيض الحدّ إلى 1 في اختبار وحدة؟ لأن ذلك يفحص
 * `Math.min` لا **الفصل بينمسارات مسارات**. هنا نمرّ على
 * `src/lib/rate-limit.ts` الحقيقي، وعلى `@upstash/ratelimit` الحقيقي،
 * وسكربت Lua الحقيقي مُحاكى بنسخته الحرفية — فالنتيجة تُثبت أن
 * `checkRateLimit` يستدعي المحدّد فعلاً وأن 403/429 ليسا مقلوبين.
 *
 * 🎯 ما الذي نحاكيه بالضبط (لا أكثر):
 *   - بروتوكول `@upstash/redis`: `POST /pipeline` بمصفوفة أوامر،
 *     وجواب `{result}` أو `{error}` لكل أمر.
 *   - `evalsha` ⇒ `NOSCRIPT` دائماً، فينتقل العميل إلى `eval` النصّي
 *     تماماً كما يحدث على Redis جديد.
 *   - سكربت النافذة المنزلقة: نفس سكربت Lua ونفس الدالة خطوةً خطوة
 *     (انظر `slidingWindowLimitScript` في @upstash/ratelimit).
 *   - سكربت التصفير `resetUsedTokens`: نمط SCAN+DEL ⇒ نحذف المطابق.
 *
 * ⚠️ ما لا نحاكيه: تكرار `SCAN` الحقيقي، ولا تحليلات `ZADD`، ولا انتهاء
 *   صلاحية المفاتيح بمرور الزمن (يبقى العدّاد حتى التصفير الصريح).
 *   فالسكربتات المستعملة لا تعتمد على أذكى من ذلك، والاختبار يهمّه عدّاد
 *   النافذة لا دقّة Redis.
 *
 * الاستعمال:
 *   node scripts/qa-fake-upstash.mjs --port 3999
 *
 * أدوات تحكّم (لا يستعملها @upstash إطلاقاً):
 *   POST /__qa/reset      → يمسح كل المفاتيح (بين اختبارين)
 *   GET  /__qa/dump       → يعرض المفاتيح وعدّاداتها
 *   POST /__qa/fail?on=1  → يجعل كل الأوامر ترمي (انقطاع Upstash)
 */
import http from "node:http";

const argv = process.argv.slice(2);
const portArg = argv.indexOf("--port");
const PORT = Number(portArg !== -1 ? argv[portArg + 1] : process.env.QA_FAKE_UPSTASH_PORT || 3999);

/** @type {Map<string, { value: number | string, pxAt: number | null }>} */
const store = new Map();
let failing = false;
let commandCount = 0;

function nowMs() {
  return Date.now();
}

function live(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.pxAt !== null && entry.pxAt <= nowMs()) {
    store.delete(key);
    return undefined;
  }
  return entry;
}

function get(key) {
  const entry = live(key);
  if (!entry) return null;
  return typeof entry.value === "number" ? String(entry.value) : entry.value;
}

function setValue(key, value, px = null) {
  store.set(key, { value, pxAt: px });
  return "OK";
}

function incrBy(key, by) {
  const entry = live(key);
  const next = (entry ? Number(entry.value) : 0) + by;
  store.set(key, { value: next, pxAt: entry?.pxAt ?? null });
  return next;
}

/** أنماط SCAN المُستعملة في سكربت التصفير: `prefix:prefix:ip:*` */
function globToRegExp(pattern) {
  const escaped = String(pattern).replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, ".*").replace(/\?/g, ".")}$`);
}

/**
 * محاكاة سكربت النافذة المنزلقة — نسخة حرفية عن Lua الأصلي.
 *
 * @param {string[]} argv ["tokens", "now", "windowMs", "incrementBy"]
 * @returns {number[]} `[remaining, limit]` أو `[-1, limit]` عند الرفض
 */
function slidingWindowLimit(keys, argv) {
  const currentKey = keys[0];
  const previousKey = keys[1];
  const dynamicKey = keys[2];
  const tokens = Number(argv[0]);
  const now = Number(argv[1]);
  const window = Number(argv[2]);
  const incrementBy = Number(argv[3]);

  let effectiveLimit = tokens;
  if (dynamicKey && dynamicKey !== "") {
    const dynamicLimit = get(dynamicKey);
    if (dynamicLimit) effectiveLimit = Number(dynamicLimit);
  }

  let current = Number(get(currentKey) ?? 0);
  let previous = Number(get(previousKey) ?? 0);
  const percentageInCurrent = (now % window) / window;
  previous = Math.floor((1 - percentageInCurrent) * previous);

  if (incrementBy > 0 && previous + current >= effectiveLimit) {
    return [-1, effectiveLimit];
  }

  const newValue = incrBy(currentKey, incrementBy);
  if (newValue === incrementBy) {
    // أول ضربة: نضع نافذة تغطّي النافذة التالية + ثانية، كما في Lua.
    store.get(currentKey).pxAt = nowMs() + window * 2 + 1000;
  }
  return [effectiveLimit - (newValue + previous), effectiveLimit];
}

function slidingWindowRemaining(keys, argv) {
  const tokens = Number(argv[0]);
  const now = Number(argv[1]);
  const window = Number(argv[2]);
  const current = Number(get(keys[0]) ?? 0);
  const previous = Number(get(keys[1]) ?? 0);
  const percentageInCurrent = (now % window) / window;
  return [Math.max(0, tokens - (current + Math.floor((1 - percentageInCurrent) * previous)))];
}

function evalResetByPattern(keys) {
  const pattern = keys[0];
  const re = globToRegExp(pattern);
  let removed = 0;
  for (const key of [...store.keys()]) {
    if (re.test(key)) {
      store.delete(key);
      removed += 1;
    }
  }
  return removed;
}

/**
 * هل هذا السكربت هو سكربت النافذة المنزلقة (لا نسخة «المتبقّي»)؟
 *
 * ⛔ التمييز بـ`return {` كان خاطئاً: سكربت الحدّ نفسه يحوي
 * `return {-1, effectiveLimit}`، فيذهب الاثنان إلى فرع «المتبقّي»
 * ويُعيد `[3]` دائماً — فيبدو أن الحدّ لا يتحرّك أبداً وهو أضيق
 * ما يكون. الفارق الحقيقي: سكربت الحدّ وحده يستدعي `INCRBY`.
 */
function isSlidingWindowLimit(script) {
  return script.includes("requestsInCurrentWindow") && script.includes("percentageInCurrent");
}

function isSlidingWindowRemaining(script) {
  return (
    isSlidingWindowLimit(script) &&
    script.includes("requestsInCurrentWindow") &&
    !script.includes("INCRBY")
  );
}

function runCommand(cmd) {
  const name = String(cmd[0] ?? "").toLowerCase();

  switch (name) {
    case "evalsha":
      return { error: "NOSCRIPT No matching script. Please use EVAL" };
    case "eval": {
      const script = String(cmd[1] ?? "");
      const keyCount = Number(cmd[2] ?? 0);
      const keys = cmd.slice(3, 3 + keyCount);
      const argv = cmd.slice(3 + keyCount);
      if (script.includes("SCAN")) return { result: evalResetByPattern(keys) };
      if (isSlidingWindowLimit(script)) {
        return { result: slidingWindowLimit(keys, argv) };
      }
      if (isSlidingWindowRemaining(script)) {
        return { result: slidingWindowRemaining(keys, argv) };
      }
      return { error: `ERR unsupported script: ${script.slice(0, 80)}` };
    }
    case "get":
      return { result: get(String(cmd[1])) };
    case "set": {
      const ttl = cmd[3] === "PX" ? Number(cmd[4]) : null;
      return { result: setValue(String(cmd[1]), String(cmd[2]), ttl) };
    }
    case "incr":
      return { result: incrBy(String(cmd[1]), 1) };
    case "incrby":
      return { result: incrBy(String(cmd[1]), Number(cmd[2])) };
    case "decrby":
      return { result: incrBy(String(cmd[1]), -Number(cmd[2])) };
    case "pexpire": {
      const key = String(cmd[1]);
      const entry = live(key);
      if (!entry) return { result: 0 };
      entry.pxAt = nowMs() + Number(cmd[2]);
      return { result: 1 };
    }
    case "expire": {
      const key = String(cmd[1]);
      const entry = live(key);
      if (!entry) return { result: 0 };
      entry.pxAt = nowMs() + Number(cmd[2]) * 1000;
      return { result: 1 };
    }
    case "pttl": {
      const entry = live(String(cmd[1]));
      if (!entry) return { result: -2 };
      if (entry.pxAt === null) return { result: -1 };
      return { result: Math.max(0, entry.pxAt - nowMs()) };
    }
    case "ttl": {
      const entry = live(String(cmd[1]));
      if (!entry) return { result: -2 };
      if (entry.pxAt === null) return { result: -1 };
      return { result: Math.ceil((entry.pxAt - nowMs()) / 1000) };
    }
    case "del": {
      let removed = 0;
      for (const key of cmd.slice(1)) removed += store.delete(String(key)) ? 1 : 0;
      return { result: removed };
    }
    case "zincrby":
    case "zadd":
      // تحليلات @upstash/ratelimit — لا نقرأها ولا نقرّر على أساسها.
      return { result: 1 };
    case "scan":
      return { result: ["0", [...store.keys()]] };
    case "ping":
      return { result: "PONG" };
    default:
      return { error: `ERR unknown command '${cmd[0]}'` };
  }
}

const server = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => {
    raw += chunk;
  });
  req.on("end", () => {
    const url = req.url ?? "";

    /**
     * فحص الجاهزية: يستعمله `qa-test-server.mjs` قبل بناء التطبيق.
     *
     * 🎯 لماذا قبل البناء لا بعده: المحدّدات تُنشأ عند تحميل وحدة
     * `rate-limit.ts` وتُخزَّن في متغيّر وحدة، فـ`null` هناك يبقى `null`
     * طوال عمر العملية. الجاهزية المتأخرة = فرع «غير مهيّأ» للأبد.
     */
    if (url === "/ping") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, ping: "PONG" }));
      return;
    }

    // أدوات التحكّم — خارج بروتوكول Redis، فلا يصطدم `@upstash/ratelimit`
    // بها أتاً.
    if (url.startsWith("/__qa/reset")) {
      store.clear();
      commandCount = 0;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (url.startsWith("/__qa/fail")) {
      failing = url.includes("on=1") || url.includes("on=true");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, failing }));
      return;
    }
    if (url.startsWith("/__qa/dump")) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify(
          {
            commands: commandCount,
            keys: [...store.entries()].map(([key, entry]) => [key, entry.value]),
          },
          null,
          2
        )
      );
      return;
    }

    if (failing) {
      // انقطاع Upstash حقيقي النموذج: كل أمر يرمي، فيسلك «fail open».
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "ECONNRESET (fake upstash failing on purpose)" }));
      return;
    }

    let commands = [];
    if (url.includes("/pipeline") || url.includes("/auto-pipeline")) {
      try {
        commands = JSON.parse(raw || "[]");
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "ERR invalid pipeline payload" }));
        return;
      }
      commandCount += commands.length;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(commands.map((cmd) => runCommand(cmd))));
      return;
    }

    // مسار أمر واحد: `/incr/key/arg/...` — نحاكي رموز المسار كأمر.
    const segments = url.split("/").filter(Boolean).map(decodeURIComponent);
    if (segments.length) {
      commandCount += 1;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(runCommand(segments)));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "ERR unknown request" }));
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[qa-fake-upstash] READY http://127.0.0.1:${PORT} (in-memory, no external calls)`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", () => server.close());
