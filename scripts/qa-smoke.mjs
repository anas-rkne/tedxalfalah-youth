#!/usr/bin/env node
/**
 * فحص تشغيلي خفيف (Smoke Test) لنظام جدار الأسئلة الحية (Live Q&A Wall).
 *
 * يسير على المسار الكامل ضد خادم تشغيل (يفضَّل `npm run dev`):
 *   دخول إداري → إنشاء جلسة → تفعيل → حضور → سؤال → موافقة → استفتاء
 *   → تصويت → منع التصويت المزدوج → إيقاف الاستفتاء → عرض النتائج.
 *
 * الاستخدام:
 *   node scripts/qa-smoke.mjs --base=http://localhost:3000 --user=admin --pass=...
 *
 * يعيد رمز خروج 0 عند نجاح كل الفحوصات و 1 عند أي فشل (صالح لـ CI).
 * ملاحظة: يعمل على بيانات جلسة/سؤال/استفتاء بـ IDs فريدة وينظّفها بنهاية
 * التشغيل (حذف استفتاء + حذف جلسة) عبر الواجهات الإدارية، فيبقى المتجر نظيفاً.
 */
import { env } from "node:process";

function arg(name, def = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : env[`QA_${name.toUpperCase()}`] || def;
}

const BASE = (arg("base") || "http://localhost:3000").replace(/\/+$/, "");
const ADMIN_USER = arg("user");
const ADMIN_PASS = arg("pass");

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, label, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`  ✓ PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ✗ FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function api(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

function unique(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

async function main() {
  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error("Missing credentials. Use --user=... --pass=... or QA_USER/QA_PASS.");
    process.exit(1);
  }
  console.log(`Smoke test Q&A — ${BASE} (user: ${ADMIN_USER})`);
  console.log("──────────────────────────────────────────────");

  // ---- 0) دخول إداري ----
  const login = await api("POST", "/api/admin/login", {
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  assert(login.status === 200 && login.json?.ok, "0. تسجيل دخول إداري", `status=${login.status}`);
  const token = login.json?.token;
  if (!token) {
    console.log("🤚 لا يوجد token، أوقف السلسلة.");
    process.exit(1);
  }

  // إعداد كيانات فريدة للتنظيف
  const sessTitle = unique("QA-SMOKE");
  const attendeeName = unique("ضيف");
  const pollPrompt = unique("استفتاء-سموك");

  let sessionId, pollId, questionId, attendeeId;

  // ---- 1) إنشاء جلسة ----
  const created = await api("POST", "/api/qa/admin/session", {
    token,
    body: { action: "create", title: sessTitle },
  });
  assert(created.status === 200 && created.json?.ok, "1. إنشاء جلسة", `status=${created.status}`);
  sessionId = created.json?.result?.id;

  // ---- 2) تفعيل الجلسة (فتح الأسئلة) ----
  const activated = await api("POST", "/api/qa/admin/session", {
    token,
    body: { action: "activate", sessionId },
  });
  assert(
    activated.status === 200 && activated.json?.result?.active === true,
    "2. تفعيل الجلسة",
    `status=${activated.status}`
  );

  // ---- 3) القراءة العامة: جلسة نشطة بلا أسئلة ----
  const current0 = await api("GET", "/api/qa/session/current");
  assert(
    current0.status === 200 && current0.json?.active === true &&
      Array.isArray(current0.json?.questions) && current0.json.questions.length === 0,
    "3. session/current: نشطة بلا أسئلة بعد"
  );

  // ---- 4) تسجيل حضور ----
  const join = await api("POST", "/api/qa/attendee/join", {
    body: { name: attendeeName },
  });
  assert(join.status === 200 && join.json?.ok && join.json?.attendeeId, "4. تسجيل حضور", `status=${join.status}`);
  attendeeId = join.json?.attendeeId;

  // ---- 5) إرسال سؤال (يبدأ بحالة pending) ----
  const qText = unique("سؤال: هل هذه جملة اختبار؟");
  const q = await api("POST", "/api/qa/question", {
    body: { attendeeId, name: attendeeName, text: qText },
  });
  assert(
    q.status === 201 && q.json?.ok && q.json?.question?.status === "pending",
    "5. إرسال سؤال → pending",
    `status=${q.status}`
  );
  questionId = q.json?.question?.id;

  // ---- 6) لا يظهر في القراءة العامة قبل الموافقة ----
  const currentPre = await api("GET", "/api/qa/session/current");
  const preVisible = currentPre.json?.questions?.some((x) => x.id === questionId);
  assert(currentPre.status === 200 && !preVisible, "6. السؤال غير مرئي قبل الموافقة");

  // ---- 7) موافقة المشرف ----
  const approv = await api("POST", "/api/qa/admin/moderate", {
    token,
    body: { action: "approve", sessionId, questionId },
  });
  assert(approv.status === 200 && approv.json?.result?.status === "approved", "7. موافقة السؤال");

  // ---- 8) يظهر الآن في القراءة العامة ----
  const currentPost = await api("GET", "/api/qa/session/current");
  const postVisible = currentPost.json?.questions?.some((x) => x.id === questionId && x.text === qText);
  assert(currentPost.status === 200 && postVisible, "8. السؤال مرئي بعد الموافقة");

  // ---- 9) إنشاء استفتاء (3 خيارات) ----
  const pollCreate = await api("POST", "/api/qa/admin/poll", {
    token,
    body: {
      action: "create",
      sessionId,
      prompt: pollPrompt,
      options: ["الخيار أ", "الخيار ب", "الخيار ج"],
    },
  });
  assert(pollCreate.status === 200 && pollCreate.json?.ok, "9. إنشاء استفتاء", `status=${pollCreate.status}`);
  pollId = pollCreate.json?.result?.id;

  // ---- 10) بدء الاستفتاء ----
  const pollStart = await api("POST", "/api/qa/admin/poll", {
    token,
    body: { action: "start", sessionId, pollId },
  });
  assert(pollStart.status === 200, "10. بدء الاستفتاء");

  // ---- 11) تصويت (الخيار 1) ----
  const vote = await api("POST", "/api/qa/poll/vote", {
    body: { attendeeId, pollId, optionIndex: 1 },
  });
  assert(
    vote.status === 200 && vote.json?.ok && vote.json?.tallies?.[1] === 1,
    "11. تسجيل تصويت → tallies[1]=1",
    `status=${vote.status}`
  );

  // ---- 12) منع التصويت المزدوج من نفس الحضور ----
  const dup = await api("POST", "/api/qa/poll/vote", {
    body: { attendeeId, pollId, optionIndex: 0 },
  });
  assert(dup.status === 409, "12. منع التصويت المزدوج → 409", `status=${dup.status}`);

  // ---- 13) إيقاف الاستفتاء → إظهار النتائج ----
  const stop = await api("POST", "/api/qa/admin/poll", {
    token,
    body: { action: "stop", sessionId, pollId },
  });
  assert(stop.status === 200, "13. إيقاف الاستفتاء");

  // ---- 14) القراءة العامة تُظهر نتائج الاستفتاء ----
  const currentPoll = await api("GET", "/api/qa/session/current");
  const livePoll = currentPoll.json?.polls?.find((p) => p.id === pollId);
  assert(
    currentPoll.status === 200 && livePoll && livePoll.showResults === true &&
      livePoll.totalVotes === 1,
    "14. النتائج ظاهرة عامةً (showResults + totalVotes=1)"
  );

  // ---- 15) رفض سؤال ----
  const q2 = await api("POST", "/api/qa/question", {
    body: { attendeeId, name: attendeeName, text: unique("سؤال مرفوض؟") },
  });
  const q2Id = q2.json?.question?.id;
  if (q2Id) {
    const reject = await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "reject", sessionId, questionId: q2Id },
    });
    const currentRej = await api("GET", "/api/qa/session/current");
    const hidden = !currentRej.json?.questions?.some((x) => x.id === q2Id);
    assert(reject.status === 200 && hidden, "15. رفض سؤال يخفيه عن العام");
  } else {
    assert(false, "15. رفض سؤال (فشل إرسال السؤال المرفوض)");
  }

  // ---- 16) التحقق من الصياغة: نص قصير جداً ----
  const shortQ = await api("POST", "/api/qa/question", {
    body: { attendeeId, name: attendeeName, text: "أ" },
  });
  assert(shortQ.status === 400, "16. سؤال قصير جداً → 400", `status=${shortQ.status}`);

  // ---- 17) التعقيم: نص يحوي HTML ----
  const evil = await api("POST", "/api/qa/question", {
    body: { attendeeId, name: attendeeName, text: "<script>alert(1)</script>" },
  });
  if (evil.status === 201) {
    const evilId = evil.json?.question?.id;
    await api("POST", "/api/qa/admin/moderate", {
      token,
      body: { action: "approve", sessionId, questionId: evilId },
    });
    const cur = await api("GET", "/api/qa/session/current");
    const shown = cur.json?.questions?.find((x) => x.id === evilId);
    assert(
      shown && shown.text.includes("&lt;script&gt;") && !shown.text.includes("<script>"),
      "17. تعقيم نص HTML (escape)"
    );
  } else {
    assert(false, "17. تعقيم نص HTML (فشل إرسال)");
  }

  // ---- 18) غير مصرح (لا token) على نقطة إدارية ----
  const noAuth = await api("POST", "/api/qa/admin/session", {
    body: { action: "create", title: unique("NOAUTH") },
  });
  assert(noAuth.status === 401, "18. نقطة إدارية دون token → 401", `status=${noAuth.status}`);

  // ---- 19) Origin غير مسموح ----
  const badOrigin = await fetch(`${BASE}/api/qa/session/current`, { headers: { Origin: "https://evil.example.com" } });
  assert(badOrigin.status === 403, "19. Origin غير مسموح → 403", `status=${badOrigin.status}`);

  // ---- التنظيف ----
  console.log("──────────────────────────────────────────────");
  console.log("🧹 تنظيف كيانات الاختبار...");
  if (pollId) {
    await api("POST", "/api/qa/admin/poll", {
      token,
      body: { action: "delete", sessionId, pollId },
    });
    console.log("  ✓ حذف الاستفتاء");
  }
  if (sessionId) {
    await api("POST", "/api/qa/admin/session", {
      token,
      body: { action: "delete", sessionId },
    });
    console.log("  ✓ حذف الجلسة (وسجل أصواتها)");
  }

  console.log("──────────────────────────────────────────────");
  console.log(`النتيجة: PASS ${passed} / FAIL ${failed}`);
  if (failures.length) {
    console.log("الفاشلة:");
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("خطأ غير متوقع في السكربت:", err);
  process.exit(1);
});
