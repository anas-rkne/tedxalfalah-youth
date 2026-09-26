/**
 * اختبار قفل الكتابة عبر **عمليتين Node مستقلتين** (وضع PM2 cluster).
 *
 * ⚠️ لماذا لا يكفي اختبار HTTP عادي؟
 * كل اختبارات `qa-suite.mjs` تصطدم بخادم واحد، فطبقة القفل داخل العملية
 * (`writeQueue`) كانت تكفي وحدها. العطل الذي عالجناه يظهر فقط عند تشغيل
 * عمليتين: كلٌّ منها له ذاكرته ونسخته الخاصة، فتقرآن الملف نفسه ثم تكتبان —
 * وآخر كتابة تفوز فتضيع الأولى. لذلك يشغّل هذا السكربت خادمين حقيقيين على
 * منفذين مختلفين بنفس `QA_DATA_DIR`، ثم يرسل كتابة متزامنة إلى كليهما.
 *
 * الاستخدام (بعد تشغيل scripts/qa-test-server.ps1):
 *   node scripts/qa-cluster-test.mjs --base=http://localhost:3110 \
 *        --data-dir=%TEMP%\opencode\qa-live-suite\data
 *
 * ⚠️ لماذا `next start` وليس `next dev`؟
 * Next 16 يمنع تشغيل خادمي dev على نفس المجلد (قفل `dev/lock`)، فيستحيل
 * قياس التزامن بين عمليتين في وضع dev. أما `next start` فيسمح بعدة نسخ من نفس
 * البناء على منافذ مختلفة — وهذا بالضبط ما يفعله PM2 cluster في الإنتاج.
 * لذلك يبني السكربت نسخة إنتاج (`npm run build`) إن لزم، ويشغّل نسختين منها.
 *
 * يقبل أيضاً متغيّرات البيئة BASE / QA_DATA_DIR.
 */
import { spawn } from "node:child_process";
import { resolveDataDir } from "./qa-data-dir.mjs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const BASE = (arg("base") || process.env.QA_BASE || "http://localhost:3110").replace(/\/+$/, "");
// يُقرأ المسار من server.json كتبّه مشغّل الخادم المعزول (qa-data-dir.mjs)،
// فالنتيجة واحدة سواء استُدعي السكربت مباشرة أو عبر npm run.
const DATA_DIR = arg("data-dir") || resolveDataDir();
const AUX_PORTS = [Number(arg("aux-ports", "3111,3112").split(",")[0]), Number(arg("aux-ports", "3111,3112").split(",")[1])];

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, label, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
}

async function loadEnvLocal() {
  try {
    const raw = await readFile(join(ROOT, ".env.local"), "utf-8");
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

async function api(base, method, path, { token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  // `base` المُستخدم فعلياً: نتيجته يعتمد عليها تأكيد أن الاختبار يمرّ على
  // العمليتين فعلاً (وإلا نُشغّل كل شيء من عملية واحدة ونحسب ذلك تزامناً).
  return { status: res.status, json, base };
}

/** آخر أسطر stderr لكل خادم — بدونها يخفي الخادمُ سببَ فشل الطلبات بصمت. */
const stderrTails = new Map();

function startServer(port) {
  const child = spawn(
    process.execPath,
    [join(ROOT, "node_modules/next/dist/bin/next"), "start", "-p", String(port)],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        QA_DATA_DIR: DATA_DIR,
        PORT: String(port),
        // كل خادم يقبل Origins خاصة به ومنفذ الخادم الأساسي (لوحده وبقية
        // الخوادم) — نضيف الثلاثة كلها إلى القائمة.
        ALLOWED_API_ORIGINS: [BASE, ...AUX_PORTS.map((p) => `http://localhost:${p}`)].join(","),
        GOOGLE_APPLICATION_CREDENTIALS: "",
        // ⚠️ نُفرغ هذه القيم عمداً (سلسلة فارغة، لا قيمة من `.env.local`).
        // في وضع الإنتاج `verifyTurnstile` يرفض أي طلب بلا رمز صالح، و Upstash
        // يفعّل حدّاً صارماً — ولا علاقة لأيٍّ منهما بقفل التخزين الذي نختبره
        // هنا. تجاهلهما يجعل هذا الاختبار concerned بقفل الكتابة وحده، وفحص
        // Turnstile/Upstash الحقيقيين يجري في مسار منفصل.
        TURNSTILE_SECRET_KEY: "",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  child.stdout?.on("data", () => {});
  const tail = [];
  stderrTails.set(port, tail);
  child.stderr?.on("data", (b) => {
    // نحتفظ بآخر 200 سطر فقط (لا ذاكرة بلا حدّ).
    for (const line of String(b).split("\n")) {
      if (line.trim()) tail.push(line);
      if (tail.length > 200) tail.shift();
    }
  });
  return child;
}

/** يطبع ما قالته الخوادم فعلاً — لا بديل عن تتبّع سبب الـ500. */
function dumpServerStderr(label) {
  for (const [port, tail] of stderrTails) {
    const lines = tail.filter((l) => /QA|Error|error|EPERM|EBUSY|EACCES|EEXIST|ENOTEMPTY|timeout/i.test(l));
    if (!lines.length) continue;
    console.log(`  ── stderr:${port} (${label}) ──`);
    for (const l of lines.slice(-25)) console.log(`     ${l}`);
  }
}

async function waitReady(base, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(5000) });
      if (res.status < 500) return true;
    } catch {
      /* لم يجهز بعد */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const unique = (p) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

async function main() {
  console.log(`اختبار التزامن عبر عمليات متعددة — ${BASE}`);
  console.log("═".repeat(64));
  console.log(`  QA_DATA_DIR مشترك: ${DATA_DIR}`);

  const env = await loadEnvLocal();
  const adminPass = arg("pass") || process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD || "";
  if (!adminPass) {
    console.error("  لا توجد كلمة مرور إدارية — مرّر --pass=... أو اضبط ADMIN_PASSWORD");
    process.exit(1);
  }

  section("0) تشغيل عمليتين إضافيتين بنفس مجلد البيانات");
  const children = AUX_PORTS.map((port) => startServer(port));
  const bases = AUX_PORTS.map((port) => `http://localhost:${port}`);

  const ready = await Promise.all(bases.map((b) => waitReady(b)));
  assert(ready.every(Boolean), "الخادمان الإضافيان جاهزان", ready.map((r, i) => `${bases[i]}=${r}`).join(" "));

  if (!ready.every(Boolean)) {
    for (const c of children) c.kill();
    process.exit(1);
  }

  let sessionId = null;
  let token = null;
  const run = unique("QACLUSTER");
  const BATCH = 12;

  try {
    section("1) تهيئة جلسة عبر الخادم الأساسي");
    const tokenRes = await api(BASE, "POST", "/api/admin/login", {
      body: { username: arg("user", "admin"), password: adminPass },
    });
    assert(tokenRes.status === 200 && tokenRes.json?.ok, "دخول إداري", `status=${tokenRes.status}`);
    token = tokenRes.json?.token ?? null;
    if (!token) throw new Error("no token");

    const created = await api(BASE, "POST", "/api/qa/admin/session", { token, body: { action: "create", title: run } });
    sessionId = created.json?.result?.id;
    assert(!!sessionId, "إنشاء جلسة", `status=${created.status}`);

    const activated = await api(BASE, "POST", "/api/qa/admin/session", { token, body: { action: "activate", sessionId } });
    assert(activated.json?.result?.active === true, "تفعيل الجلسة");

    section("2) تسجيل الحاضرين على الخادم الأساسي (dev)");
    // ⚠️ الانضمام يتم على خادم التطوير عن قصد: في وضع الإنتاج Turnstile
    // يرفض أي طلب بلا رمز حقيقي (fail-closed مقصود في `verifyTurnstile`)،
    // ولا نريد أن نُضعِف ذلك في اختبار قفل التخزين. الحاضرون مسجَّلون في نفس
    // ملف البيانات، فتعمل أرقامهم على الخادمين الإنتاجيين بلا تعديل.
    const joins = await Promise.all(
      Array.from({ length: BATCH }, (_, i) =>
        api(BASE, "POST", "/api/qa/attendee/join", { body: { name: `${run}-A${i}` } })
      )
    );
    const attendeeIds = joins.map((r) => r.json?.attendeeId).filter(Boolean);
    assert(attendeeIds.length === BATCH, "كل عمليات الانضمام نجحت", `نجح=${attendeeIds.length}/${BATCH}`);

    const adminState = await api(BASE, "GET", "/api/qa/admin/questions", { token });
    const session = (adminState.json?.sessions ?? []).find((s) => s.id === sessionId);
    // ⚠️ نقطة الإدارة لا تعيد سجل الحضور نفسه (مجرد `attendeeNames`) — وهذا
    // سلوك privacy مقصود. نتحقق عبر `meta.totalAttendees` الذي يُحسب من سجل
    // الحضور داخل الخادم عبر `attendeeCountOf`.
    const metaAttendees = adminState.json?.meta?.totalAttendees ?? 0;
    assert(metaAttendees >= attendeeIds.length, "meta.totalAttendees يعكس كل الحاضرين", `meta=${metaAttendees} ناجح=${attendeeIds.length}`);

    const names = (session?.attendeeNames ?? []).filter((n) => String(n).startsWith(run));
    const uniqueNames = new Set(names).size;
    assert(uniqueNames === BATCH, "لا تكرار ولا ضياع في أسماء الحاضرين", `أسماء=${uniqueNames} متوقع=${BATCH}`);

    section("3) تصويت متوازٍ على نفس السؤال عبر العمليتين");
    const text = `سؤال عن التزامن بين عمليتين ${run}`;
    const asked = await api(BASE, "POST", "/api/qa/question", { body: { attendeeId: attendeeIds[0], text } });
    const questionId = asked.json?.question?.id;
    assert(!!questionId, "إرسال سؤال", `status=${asked.status}`);
    if (!questionId) throw new Error("no question");

    await api(BASE, "POST", "/api/qa/admin/moderate", { token, body: { action: "approve", sessionId, questionId } });

    // ⚠️ هذا هو جوهر الاختبار: كل الطلبات متوازية، ونصفها يذهب لكل خادم، وكل
    // خادم عملية Node مستقلة بذاكرتها الخاصة. قبل القفل الملفّي كانت إحدى
    // العمليتين تكتب نسختها القديمة فوق الأخرى ويضيع نصف الأصوات.
    const votes = await Promise.all(
      attendeeIds.map((id, i) => {
        const base = i % 2 === 0 ? bases[0] : bases[1];
        return api(base, "POST", "/api/qa/question/vote", { body: { attendeeId: id, questionId } });
      })
    );
    const accepted = votes.filter((v) => v.status === 200).length;
    assert(
      accepted === attendeeIds.length,
      "كل الأصوات عبر العمليتين قُبلت",
      `قُبل=${accepted}/${attendeeIds.length} ${
        votes
          .filter((v) => v.status !== 200)
          .map((v) => `${v.status}:${v.json?.error ?? "?"}@${v.base}`)
          .join(" | ")
      }`
    );

    const afterVotes = await api(BASE, "GET", "/api/qa/admin/questions", { token });
    const s2 = (afterVotes.json?.sessions ?? []).find((s) => s.id === sessionId);
    const q = (s2?.questions ?? []).find((x) => x.id === questionId);
    assert(q?.votes === attendeeIds.length, "عدد الأصوات في الملف = عدد الطلبات (لا lost update)", `متوقع=${attendeeIds.length} فعلي=${q?.votes}`);

    section("4) تعديلات إدارية متوازية على نفس الملف عبر العمليتين");
    // ⚠️ لا يمكن إرسال أصوات الاستفتاء هنا: `/api/qa/poll/vote` يطلب Turnstile
    // وهو fail-closed في الإنتاج. لذلك نستخدم نقطة الإدارة (بلا Turnstile)
    // لقياس نفس القفل عبر عملية أخرى: كل طلب تعديل إداري يقرأ الملف كاملاً
    // ثم يكتب نسخته، فبدون قفل بين العمليات كانت أغلب التعديلات تضيع.
    const extraQuestions = [];
    // ⚠️ النصوص يجب أن تكون متباعدة فعلياً: كشف التكرار يقيس تشابه
    // Levenshtein على النص كاملاً، ونصّان يفترقان في رقم واحد يُحسبان مكررَين
    // (وهذا سلوك صحيح ومتعمّد). لذلك كل سؤال هنا بموضوع مختلف تماماً.
    const topics = [
      "ما أفضل طريقة لتعلّم لغة جديدة من الصفر خلال ستة أشهر؟",
      "كيف تختار الجهاز اللوحي المناسب لطلاب المرحلة الابتدائية؟",
      "ما الذي يجعل محاضرة عن الخطاب العام مؤثرة أكثر من غيرها؟",
      "لماذا نحتاج إلى عادات القراءة اليومية قبل النوم؟",
      "كيف أثّر العمل عن بُعد على إنتاجية فرق العمل وتعاونها؟",
      "ما دور جمعيات المجتمع المدني في بناء الثقة بين الأجيال؟",
      "كيف يمكن للمدن الصغيرة جذب المبدعين دون خسارة هويتها؟",
      "ما الفرق بين الاستماع الفعّال وحسن الظن بالآخر؟",
      "أيهما أهم في مشروع تخرّج: الفكرة أم التنفيذ؟",
      "كيف نُعلّم البرمجة دون إحباط؟",
      "ما أثر الراحة قصيرة المدى على جودة الانتباه؟",
      "كيف نحافظ على الحماس المؤسسي بعد سنوات الإطلاق؟",
    ];
    for (let i = 0; i < BATCH; i++) {
      const res = await api(BASE, "POST", "/api/qa/question", {
        body: { attendeeId: attendeeIds[i % attendeeIds.length], text: topics[i] },
      });
      const id = res.json?.question?.id;
      if (id) {
        extraQuestions.push(id);
        await api(BASE, "POST", "/api/qa/admin/moderate", { token, body: { action: "approve", sessionId, questionId: id } });
      }
    }
    assert(extraQuestions.length === BATCH, "إنشاء واعتماد أسئلة للاختبار المتوازي", `عدد=${extraQuestions.length}`);

    const mods = await Promise.all(
      extraQuestions.map((id, i) => {
        const base = i % 2 === 0 ? bases[0] : bases[1];
        return api(base, "POST", "/api/qa/admin/moderate", {
          token,
          body: { action: "feature", sessionId, questionId: id, featured: true },
        });
      })
    );
    const modOk = mods.filter((r) => r.status === 200).length;
    assert(
      modOk === extraQuestions.length,
      "كل التعديلات الإدارية عبر العمليتين نجحت",
      `نجح=${modOk}/${extraQuestions.length} ${
        mods
          .filter((r) => r.status !== 200)
          .map((r) => `${r.status}:${r.json?.error ?? "?"}@${r.base}`)
          .join(" | ")
      }`
    );

    const afterMods = await api(BASE, "GET", "/api/qa/admin/questions", { token });
    const s3 = (afterMods.json?.sessions ?? []).find((s) => s.id === sessionId);
    const featuredCount = (s3?.questions ?? []).filter((x) => extraQuestions.includes(x.id) && x.featured).length;
    assert(
      featuredCount === extraQuestions.length,
      "لا تعديل ضاع بين العمليتين (لا lost update على ملف البيانات)",
      `مميّز=${featuredCount} متوقع=${extraQuestions.length}`
    );

    section("5) الحذف المتوازي عبر العمليتين");
    // نفس المبدأ مع عملية حذف: إن ضاع أحدها يبقى التمييز معلّقاً على سؤال محذوف.
    // ⚠️ كان الطلب يُرسَل إلى BASE رغم حساب `base` — أي أن الاختبار كان يمرّ
    // كل التعديلات من عملية واحدة، فلا يثبت شيئاً عن تزامن العمليتين.
    const dels = await Promise.all(
      extraQuestions.slice(0, 6).map((id, i) => {
        const base = i % 2 === 0 ? bases[1] : bases[0];
        return api(base, "POST", "/api/qa/admin/moderate", {
          token,
          body: { action: "reject", sessionId, questionId: id },
        });
      })
    );
    const delOk = dels.filter((r) => r.status === 200).length;
    assert(delOk === 6, "كل عمليات الرفض نجحت عبر العمليتين", `نجح=${delOk}/6`);

    // والدليل أن الطلبات مرّت عبر العمليتين فعلاً (وإلا نحسب كل شيء تزامناً).
    assert(
      dels.filter((r) => r.base === bases[0]).length === 3 &&
        dels.filter((r) => r.base === bases[1]).length === 3,
      "توزّع الطلبات 3/3 على العمليتين",
      dels.map((r) => r.base).join(",")
    );

    section("6) ضغط التزامن: 40 تصويتاً متوازياً على سؤال واحد عبر العمليتين");
    // ⚠️ لماذا هذا المقياس: الأقسام السابقة 12 طلباً فقط، والواقع مئات
    // الأجهزة في نفس اللحظة. كل كتابة تقرأ الملف كاملاً وتكتبه كاملاً داخل
    // طابور مُسلسل خلف قفل واحد، فمع 40 كابون نعرف:
    //   (أ) أن الطابور لا يتجاوز مهلة القفل (10 ثوانٍ) فيبدأ برمي 500،
    //   (ب) أن مهلة انتظار القفل تكفي تحت هذا الحمل،
    //   (ج) أن عدد الأصوات في الملف = عدد الطلبات بالضبط (لا ضياع).
    // إن فشل (أ) فالمشكلة في التصميم لا في الاختبار: الحل توسيط الطابور في
    // قاعدة بيانات، قبل الفعالية لا بعدها.
    const STRESS = 40;
    const stressJoins = await Promise.all(
      Array.from({ length: STRESS }, (_, i) =>
        api(BASE, "POST", "/api/qa/attendee/join", { body: { name: `${run}-S${i}` } })
      )
    );
    const stressAttendees = stressJoins.map((r) => r.json?.attendeeId).filter(Boolean);
    assert(stressAttendees.length === STRESS, "انضمام 40 حاضراً", `نجح=${stressAttendees.length}/${STRESS}`);

    const stressQuestion = await api(BASE, "POST", "/api/qa/question", {
      body: { attendeeId: stressAttendees[0], text: `سؤال الضغط المتزامن ${run}-stress` },
    });
    const stressQuestionId = stressQuestion.json?.question?.id;
    if (stressQuestionId) {
      await api(BASE, "POST", "/api/qa/admin/moderate", {
        token,
        body: { action: "approve", sessionId, questionId: stressQuestionId },
      });

      const t0 = Date.now();
      const stressVotes = await Promise.all(
        stressAttendees.map((id, i) =>
          api(i % 2 === 0 ? bases[0] : bases[1], "POST", "/api/qa/question/vote", {
            body: { attendeeId: id, questionId: stressQuestionId },
          })
        )
      );
      const elapsed = Date.now() - t0;
      const ok = stressVotes.filter((v) => v.status === 200).length;
      const bad = stressVotes
        .filter((v) => v.status !== 200)
        .map((v) => `${v.status}:${v.json?.error ?? "?"}`)
        .slice(0, 4)
        .join(" | ");

      assert(ok === STRESS, `كل الأصوات الـ${STRESS} نجحت (لا 500 من مهلة القفل)`, `نجح=${ok}/${STRESS} ${bad}`);
      // مهلة القفل 10 ثوانٍ: تجاوزها يعني أن الطابور لا يحمّل هذا الحمل.
      // نقس الوقت في العنوان نفسه ليظهر هامش الأمان في التقرير.
      assert(
        elapsed < 10_000,
        `زمن 40 كتابة متوازية = ${elapsed}ms (المهلة 10000ms)`,
        `${elapsed}ms`
      );

      const afterStress = await api(BASE, "GET", "/api/qa/admin/questions", { token });
      const sStress = (afterStress.json?.sessions ?? []).find((s) => s.id === sessionId);
      const stressQ = (sStress?.questions ?? []).find((q) => q.id === stressQuestionId);
      assert(
        stressQ?.votes === STRESS,
        "عدد الأصوات في الملف = 40 بالضبط (لا lost update تحت الضغط)",
        `متوقع=${STRESS} فعلي=${stressQ?.votes}`
      );
    } else {
      assert(false, "إنشاء سؤال الضغط", JSON.stringify(stressQuestion.json).slice(0, 160));
    }
  } finally {
    if (failed > 0) dumpServerStderr("عند الفشل");
    if (token && sessionId) {
      await api(BASE, "POST", "/api/qa/admin/session", { token, body: { action: "delete", sessionId } });
    }
    for (const c of children) {
      try {
        c.kill();
      } catch {
        /* ignore */
      }
    }
  }

  console.log(`\n${"═".repeat(64)}`);
  console.log(`نجح: ${passed}   فشل: ${failed}`);
  if (failures.length) {
    console.log("\nالإخفاقات:");
    for (const f of failures) console.log(`  • ${f}`);
  }
  process.exit(failed === 0 ? 0 : 1);
}

main();