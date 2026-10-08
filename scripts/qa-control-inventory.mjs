import fs from "node:fs";
import path from "node:path";

/**
 * جرد أزرار Q&A: من الاختبار إلى ما لا يُختبر.
 *
 * 🎯 لماذا آلي لا يدوي: قائمة الأزرار تكتبها بالذاكرة تنتهي عند آخر ملف
 * فُتح. هنا المصدر = كود الواجهة، والقياس = ما تستعمله اختبارات E2E
 * فعلاً. أي زر بلا مرجع يظهر في «بلا تغطية» بدل أن يختفي بصمت.
 *
 * ما يُحتسب عنصراً تفاعلياً:
 *   - وسم مفتوح `<Button`/`<button`/`<input`/`<textarea`/`<select`/`<a `
 *     وملتقطٌ لاحقاً لـ`data-testid` إن وُجد (يُقرأ حتى ٢٠ سطراً حتى لا
 *     يُحسب توسمةَ عنصرٍ آخر تليه).
 *   - كل `data-testid` يبدأ بـ`qa-` داخل المكوّنات ⇒ مرساة اختبار.
 *
 * التغطية تُحسب بمرجعين معاً: `data-testid` في المواصفات، **أو** نصّ
 * زر بُحث عنه بـ`getByRole("button", { name })`. من يضغط زراً باسمه لم
 * يحتج مرساة، وغيره يحتاجها.
 *
 * الإخراج: جدول + قائمة غير المغطّى + قائمة بلا مرساة. `--strict` يخرج
 * بشيفرة خطأ إن بقيت فجوة (يُستعمل كبوابة، لا كتقرير).
 */

const root = process.cwd();
const qaDir = path.join(root, "src", "components", "qa");
const e2eDir = path.join(root, "e2e");
const strict = process.argv.includes("--strict");

const OPENERS = [
  "<Button",
  "<button",
  "<input",
  "<textarea",
  "<select",
  "<a ",
  "<Link",
  "<summary",
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** @type {{file:string,line:number,testId:string|null,tag:string}[]} */
const controls = [];

for (const file of fs.readdirSync(qaDir).filter((f) => /\.(tsx|ts)$/.test(f))) {
  const full = path.join(qaDir, file);
  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

    const tag = OPENERS.find((t) => new RegExp(`${t.replace(/[< ]/g, "\\$&")}[\\s/>]`).test(line));
    const testId = line.match(/data-testid="(qa-[^"]+)"/);
    const isHookOnly = /^\s*data-testid=/.test(line);
    if (testId && (isHookOnly || !tag)) {
      controls.push({ file, line: i + 1, testId: testId[1], tag: isHookOnly ? "(hook)" : tag });
      continue;
    }
    if (!tag) continue;

    // نافذة العنصر المفتوح: حتى ٢٠ سطراً أو أول `/>`/`>`.
    let chunk = line;
    let j = i;
    while (j < lines.length - 1 && j < i + 20 && !/\/?>$/.test(lines[j].trimEnd())) {
      j++;
      chunk += "\n" + lines[j];
    }
    const id = chunk.match(/data-testid="(qa-[^"]+)"/);
    controls.push({ file, line: i + 1, testId: id ? id[1] : null, tag });
  }
}

const specs = walk(e2eDir)
  .filter((f) => /\.spec\.ts$/.test(f))
  .map((f) => ({ file: path.relative(root, f), text: fs.readFileSync(f, "utf8") }));

const allSpecText = specs.map((s) => s.text).join("\n");
const usedIn = (testId) => specs.filter((s) => s.text.includes(testId)).map((s) => s.file);

/** أسماء الأزرار المضغوطة بـgetByRole — تغطية بلا مرساة. */
const roleNames = [
  ...new Set(
    [...allSpecText.matchAll(/getByRole\(\s*"(button|checkbox|switch)",\s*\{\s*name:\s*(?:"([^"]*)"|`([^`]*)`)/g)].map(
      (m) => m[2] ?? m[3]
    )
  ),
].filter((s) => s && !s.includes("${"));

/**
 * ⛔ مراسٍ **حاوية** لا زر: `qa-screen-bar` و`qa-stage-box` و`qa-answer-inbox`
 * أغلفة لمناطق، لا عناصر تفاعلية. وجود مرساة لها لا يعني زراً مُغطّى،
 * وعدم تغطيتها ليس فجوة — ولحسابها زِراً خطأ في الجرد نفسه.
 */
const CONTAINERS = new Set(["qa-screen-bar", "qa-stage-box", "qa-answer-inbox"]);

const unique = new Map();
for (const c of controls) {
  if (c.testId && CONTAINERS.has(c.testId)) continue;
  const key = c.testId ?? `${c.file}:${c.line}`;
  if (!unique.has(key)) unique.set(key, c);
}
const list = [...unique.values()];

const withHook = list.filter((c) => c.testId);
const noHook = list.filter((c) => !c.testId);
const covered = withHook.filter((c) => usedIn(c.testId).length > 0);
const uncovered = withHook.filter((c) => usedIn(c.testId).length === 0);

const line = "─".repeat(72);
console.log(line);
console.log("جرد عناصر تفاعل Q&A");
console.log(line);
console.log(`عناصر بإرسا اختبار : ${withHook.length}`);
console.log(`عناصر بلا مرساة       : ${noHook.length}`);
console.log(`مغطاة بملف E2E        : ${covered.length}`);
console.log(`بلا تغطية E2E         : ${uncovered.length}`);
console.log(`أزرار مغطاة بالاسم    : ${roleNames.length}`);

if (uncovered.length) {
  console.log(`\n⛔ بلا تغطية (${uncovered.length}):`);
  for (const c of uncovered) console.log(`  ${c.testId.padEnd(26)} ${c.file}:${c.line}`);
}
if (noHook.length) {
  console.log(`\n⚠️ بلا مرساة اختبار (${noHook.length}) — يُضغط بالنصّ أو لا يُختبر أصلاً:`);
  for (const c of noHook) console.log(`  ${c.tag.padEnd(10)} ${c.file}:${c.line}`);
}
console.log(`\nأسماء أزرار تُضغط بالنصّ: ${roleNames.slice(0, 24).join(" · ") || "—"}`);

const gaps = uncovered.length + noHook.length;
console.log(`\n${line}`);
console.log(gaps === 0 ? "لا فجوة: كل عنصر تفاعلي مُختبَر ومُرسى." : `فجوة متبقية: ${gaps}`);
if (strict && gaps > 0) process.exit(1);
