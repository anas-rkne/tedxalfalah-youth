/**
 * وحدة التخزين لنظام "جدار الأسئلة الحية" (Live Q&A Wall).
 *
 * تحفظ بيانات الجلسات والأسئلة والاستفتاءات والاستطلاعات في ملفات JSON دائمة
 * على السيرفر خارج مجلد البناء (`.next`)، بحيث تبقى البيانات بين عمليات إعادة
 * التشغيل والبناء.
 *
 * 🔒 القفل — لماذا قفل ملف وليس طابوراً في الذاكرة؟
 *
 * الطابور داخل الذاكرة (`writeQueue`) يمنع التزاحم **داخل عملية واحدة** فقط.
 * أما في وضع PM2 cluster فيعمل عدة عمليات Node مستقلة، لكل منها ذاكرتها
 * وطابورها، فلا يرى أيّهما طابور الآخر. النتيجة: عمليتا كتابة تقرآن الملف
 * نفسه، كلٌّ منهما تبني نسخة، ثم تكتبان — وآخر كتابة تفوز فتضيع الأولى
 * (lost update).
 *
 * لذلك أضفنا **قفل ملف حصري** (`open(path, "wx")`) تراه كل العمليات على نفس
 * المضيف، مع كسر الأقفال المعلّقة عند تعطّل العملية. الطابور يبقى كطبقة أولى
 * (أرخص وأسرع ويمنع إعادة الدخول)، أمّا القفل الملفّي فهو الضمان الحقيقي
 * عبر العمليات.
 */
import { promises as fs } from "fs";
import path from "path";
import type { QaData, QaVoteStore } from "./types";
import { emptyQaData, emptyVoteStore } from "./defaults";
import { normalizeData } from "./service";

/** شكل ملف الاستبيان (يُحفظ في نفس مجلد البيانات). */
export interface SurveyStore {
  responses: Array<{
    id: string;
    sessionId: string;
    attendeeId: string;
    nps: number;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
}

/**
 * مسار ملف البيانات.
 *
 * في بيئة standalone (الإنتاج) يكون الدليل الجذر هو `.next/standalone`،
 * لذلك نعرّف المسار نسبةً إلى متغير بيئة صريح أو ننظر للجذر الفعلي.
 * يُفضَّل ضبط QA_DATA_DIR في بيئة الإنتاج على مسار مطلق ثابت يبقى بين
 * عمليات البناء (مثال: /home/tedx/htdocs/tedxalfalahyouth.com/store).
 */
function resolveDataDir(): string {
  if (process.env.QA_DATA_DIR) return process.env.QA_DATA_DIR;
  // في بيئة development نستخدم مجلد store/ في جذر المشروع
  return path.join(process.cwd(), "store");
}

/**
 * حارس موثوقية: في الإنتاج (standalone) يقع process.cwd() داخل `.next`،
 * و prebuild يمسح `.next` — لذا التخزين الافتراضي داخل `.next` سيُفقد
 * البيانات مع كل رفع. يمنع ذلك صراحةً (خطأ واضح بدل الصمت) ويطالب بضبط
 * QA_DATA_DIR على مسار مطلق ثابت خارج مجلد البناء.
 */
function guardProdDataDir(): void {
  if (process.env.NODE_ENV !== "production") return;
  // فقط عند عدم ضبط QA_DATA_DIR صراحةً نفترض خطورة التخزين الافتراضي.
  if (process.env.QA_DATA_DIR) return;
  // `turbopackIgnore` مقصود: بدونه يربط Turbopack الاستدعاء الديناميكي فيتتبّع
  // المشروع كله (بما فيه public/ ومجلدات البناء) في standalone، فيضخّم رافع
  // النشر وقد يفشل عند حدود الحجم. ولا أثر سلبي: المسار إرشادي/حارس لا يقرأ
  // بيانات، وبيانات Q&A تُقرأ وقت التشغيل من مسار خارجي مطلق (وهو ما يفرضه
  // هذا الحارس نفسه).
  const dir = path.resolve(/* turbopackIgnore: true */ resolveDataDir());
  const cwd = path.resolve(/* turbopackIgnore: true */ process.cwd());
  const inside = dir === cwd || dir.startsWith(cwd + path.sep);
  if (inside) {
    throw new Error(
      "[QA] QA_DATA_DIR is not set; the default <cwd>/store resolves inside the build " +
        "folder (.next), which is wiped on every deploy. Set QA_DATA_DIR to an absolute " +
        "persistent path (e.g. /home/tedx/htdocs/tedxalfalahyouth.com/store) in the " +
        "production .env.local before starting."
    );
  }
}

function dataFilePath(): string {
  return path.join(resolveDataDir(), "qa-data.json");
}

function voteFilePath(): string {
  return path.join(resolveDataDir(), "qa-votes.json");
}

/**
 * ⚠️ كان مسار الاستبيان مكتوباً كسلسلة ثابتة `"store/qa-surveys.json"` ومُدمجاً
 * مع `process.cwd()` داخل نقطة API نفسها. لذلك كان يتجاهل `QA_DATA_DIR` كلياً،
 * فكانت ردود الاستبيان في الإنتاج تُكتب إلى مسار **ثابت داخل مجلد البناء**
 * (`.next/standalone/store/…`) الذي يُمسح مع كل رفع — أي فقدان كل الردود.
 * كما أنه لم يستخدم `guardProdDataDir` ولا الكتابة الذرّية. الآن الملف يمرّ
 * بنفس `resolveDataDir` وجارس الإنتاج والكتابة الذرّية.
 */
function surveyFilePath(): string {
  return path.join(resolveDataDir(), "qa-surveys.json");
}

/* ───────────────────────── القفل الملفّي ───────────────────────── */

/**
 * اسم القفل المشترك لكل عمليات الكتابة على `qa-data.json` و`qa-votes.json`.
 *
 * ⚠️ كان `mutateVotes` يستخدم قفلاً اسمه `qa-votes` بينما `mutateBoth` يستخدم
 * `qa-data`. القفلان مختلفان ⇒ عمليتان في **processes مختلفة** تستطيعان
 * الدخول في نفس الوقت: واحدة تكتب ملف الأصوات والبيانات معاً (mutateBoth)،
 * وأخرى تكتب ملف الأصوات وحده (mutateVotes) فتكتب نسختها القديمة من
 * `qa-votes.json` فوق سجلات العملية الأولى — فقدان أصوات رغم أن القفل
 * الملفّي "يعمل". لذلك كل الكتابات على الملفين تتشارك **قفلاً واحداً**؛
 * ملفات الاستبيان ملف منفصل لا يتشارك بياناتهما فلا حاجة لتوسيع القفل عليه.
 */
const DATA_LOCK = "qa-data";

/** مهلة اعتبار القفل معلّقاً (عملية ماتت وهي تمسكه) = 15 ثانية. */
const LOCK_STALE_MS = 15_000;
/** مهلة انتظار القفل قبل الفشل = 10 ثوانٍ. */
const LOCK_TIMEOUT_MS = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** أخطاء ويندوز التي تعني "الملف موجود ومحجوب" لا "لا صلاحية". */
const CONTENTION_CODES = new Set(["EEXIST", "EPERM", "EACCES"]);

/**
 * هل هذا الخطأ تنازع على القفل أم خطأ حقيقي؟
 *
 * ⚠️ على ويندوز `fs.open(path, "wx")` مع ملف قائم **لا** يُرجع `EEXIST` دائماً:
 * يصل الخطأ EPERM (أو EACCES) لأن الملف مفتوح بمقبض من عملية أخرى.
 *
 * ⚠️ محاولة "التحقق" بسؤال `fs.stat` هل الملف موجود **لا تنفع**: على ويندوز
 * الملف المحجوب حصرياً يُرجع `stat` نفسه خطأ `EPERM`، فنقرأ ذلك كـ"لا يوجد
 * ملف" ونعيد الخطأ — وهو بالضبط ما كان يُسقط كل كتابة متوازية. لذلك نتعامل
 * مع EPERM/EACCES كتنازع **بلا تحقّق**، ونحفظ آخر كود خطأ لنُفصّل به رسالة
 * انتهاء المهلة إن كان السبب في الصلاحيات فعلاً.
 */
function isLockContention(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  return Boolean(code && CONTENTION_CODES.has(code));
}

/**
 * يحجز القفل الملفّي الحصري وينتظر دوره إن كان محجوزاً.
 *
 * الآلية: `open(path, "wx")` ينجح **فقط** إن لم يكن الملف موجوداً — وهذا ما
 * يجعل الحجز ذرّياً على مستوى نظام الملفات بين العمليات. من يحصل على خطأ
 * تنازع ينتظر ويجرّب مجدداً. وإن تجاوز عمر الملف مهلة `LOCK_STALE_MS` فالحجز
 * مملوك لعملية ماتت قبل أن تحرّره، فنحذفه ونعيد المحاولة.
 */
async function acquireFileLock(lockName: string): Promise<() => Promise<void>> {
  const dir = resolveDataDir();
  await fs.mkdir(dir, { recursive: true });
  const lockPath = path.join(dir, `.${lockName}.lock`);
  const startedAt = Date.now();
  let delay = 5;
  // آخر كود خطأ لاحظناه — يُستعمل في رسالة انتهاء المهلة ليعرف المشغّل
  // هل انتظاره حقيقي أم أن صلاحيات المجلد هي المشكلة.
  let lastCode = "EEXIST";

  // الحلقة لا نهائية عمداً: كل محاولة تفشل تعيد الحجز بعد انتظار متصاعد.
  while (true) {
    try {
      // "wx" = write + fail-if-exists ⇒ حجز حصري ذرّي.
      const handle = await fs.open(lockPath, "wx");
      await handle.writeFile(String(process.pid));
      await handle.close();
      return async () => {
        await fs.rm(lockPath, { force: true });
      };
    } catch (error) {
      // ⚠️ ليس EEXIST فقط: على ويندوز يصل التنازع EPERM/EACCES.
      if (!isLockContention(error)) throw error;
      lastCode = (error as NodeJS.ErrnoException).code ?? lastCode;

      // قفل معلّق؟ نكسره إن تجاوز عمره المهلة. الفحص يتم **فقط** هنا: إما أن
      // الملف مقروء (نعرف عمره)، أو أنه محجوب (نكمل انتظاراً بلا كسر).
      try {
        const stat = await fs.stat(lockPath);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          await fs.rm(lockPath, { force: true });
          continue;
        }
      } catch {
        // القفل محجوب (EPERM) أو اختفى — على ويندوز المحجوب هو الغالب،
        // فننتظر بدل أن نكسر قفلاً حيّاً. الاختفاء الحقيقي يُلتقط بال
        // محاولة الحجز التالية مباشرة.
        continue;
      }

      if (Date.now() - startedAt > LOCK_TIMEOUT_MS) {
        // نفصّل السبب: EPERM/EACCES بفشل متكرر غالباً صلاحيات المجلد،
        // أما مع ملف قفل قائم على القرص فالمشكلة قفل عالق من عملية ماتت.
        let present = false;
        try {
          await fs.stat(lockPath);
          present = true;
        } catch {
          present = false;
        }
        throw new Error(
          `[QA] timed out waiting for the "${lockName}" lock (last error: ${lastCode}, ` +
            `lock file ${present ? "present — a process may have died holding it" : "not visible"}: ${lockPath}). ` +
            `If a previous process crashed mid-write, delete ${lockPath} manually.`
        );
      }
      await sleep(delay);
      delay = Math.min(delay * 2, 100);
    }
  }
}

/** قفل كتابة داخل العملية: يمنع التزاحم والتعشيش. */
let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * يضمن تنفيذ عمليات الكتابة بالتسلسل (serialized) لتجنّب تلف الملف عند
 * التزامن.
 *
 * طبقتان:
 *  1. طابور في الذاكرة — يمنع إعادة الدخول داخل العملية نفسها (أرخص وأسرع).
 *  2. قفل ملف حصري — يمنع التزاحم **بين العمليات** (PM2 cluster، pm2
 *     في وضع multi-instance، أو أي عملية أخرى تكتب نفس المجلد).
 *
 * الطبقة الثانية هي ما يجعل الوضع الآمن ممكناً؛ الأولى تحسّن الأداء فقط.
 */
export async function withWriteLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  guardProdDataDir();
  const guarded = async (): Promise<T> => {
    const release = await acquireFileLock(name);
    try {
      return await fn();
    } finally {
      await release().catch(() => undefined);
    }
  };
  const run = writeQueue.then(guarded, guarded);
  writeQueue = run.catch(() => undefined);
  return run;
}

/**
 * قراءة محتويات ملف المححدّد وإرجاع كائنه، أو ملف فارغ إن لم يوجد أو تلف.
 *
 * ⚠️ تُمرَّر النتيجة عبر `normalizeData` لأن ملفات الإنتاج قديمة تخلو من
 * `attendees` و`meta`. بدون التوحيد كان أي مسار يقرأ `session.attendees[i]`
 * على بيانات حالية قديمة يصطدم بـ`undefined`.
 */
export async function readQaData(): Promise<QaData> {
  guardProdDataDir();
  try {
    const raw = await fs.readFile(dataFilePath(), "utf-8");
    return normalizeData(JSON.parse(raw) as Partial<QaData>);
  } catch {
    return emptyQaData();
  }
}

/**
 * `rename` ذرّي مع إعادة محاولة على أخطاء ويندوز العابرة.
 *
 * ⚠️ على ويندوز يفشل `rename` فوق ملف مفتوح بمقبض من عملية أخرى بخطأ
 * `EPERM`/`EBUSY` — وهي حالة طبيعية هنا لأن **القراءات غير المقفلة** (استطلاع
 * الحضور وSSE) تقرأ الملف نفسه كل بضع ثوانٍ. بدون إعادة المحاولة تفشل
 * الكتابة بخطأ نظام ويموت الطلب 500 رغم أن البيانات سليمة — وهو ما ظهر
 * فعلاً في اختبار التزامن: EPERM متقطّع في نصف التشغيلات.
 */
async function renameWithRetry(from: string, to: string, attempts = 5): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      const transient = code === "EPERM" || code === "EBUSY" || code === "EACCES";
      if (!transient || i === attempts - 1) throw error;
      await sleep(10 * (i + 1));
    }
  }
}

/** كتابة ملف المححدّد بشكل ذرّي (write-to-temp ثم rename). */
async function writeQaDataAtomic(data: QaData): Promise<void> {
  await fs.mkdir(resolveDataDir(), { recursive: true });
  const tmp = dataFilePath() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await renameWithRetry(tmp, dataFilePath());
}

/**
 * ⚠️ قراءة سجل الأصوات كانت `JSON.parse(raw) as QaVoteStore` بدون توحيد شكل.
 * ملفات `qa-votes.json` الموجودة على السيرفرات قبل إضافة `questionVotes` هي
 * `{ "votes": [...] }` فقط. الـ cast لا يغيّر شيئاً وقت التشغيل، فأي وصول
 * إلى `store.questionVotes` يصبح `undefined` — و`votes.questionVotes.length`
 * يرمي `TypeError: Cannot read properties of undefined`، أي أن التصويت على
 * الأسئلة ينهار 500 عند أول تصويت على أي بيئة قائمة. الآن نُكمل الحقول
 * الناقصة من `emptyVoteStore()` فيتم الترحيل تلقائياً بلا حاجة لملف يدوي.
 */
export async function readVotes(): Promise<QaVoteStore> {
  guardProdDataDir();
  try {
    const raw = await fs.readFile(voteFilePath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<QaVoteStore> | null;
    const base = emptyVoteStore();
    return {
      votes: Array.isArray(parsed?.votes) ? parsed.votes : base.votes,
      questionVotes: Array.isArray(parsed?.questionVotes) ? parsed.questionVotes : base.questionVotes,
    };
  } catch {
    return emptyVoteStore();
  }
}

/** كتابة ذرّية لسجل الأصوات الجديد. */
async function writeVotesAtomic(store: QaVoteStore): Promise<void> {
  await fs.mkdir(resolveDataDir(), { recursive: true });
  const tmp = voteFilePath() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await renameWithRetry(tmp, voteFilePath());
}

/**
 * نقطة الكتابة الموحّدة: يقرأ الحالة الحالية، يطبّق دالة التحويل،
 * ثم يكتب الناتج داخل القفل.
 *
 * ملاحظة: الملف يُقرأ **بعد** حجز القفل دائماً. لو قُرئ قبله لأمكن لعمليتين
 * أن تقرآ النسخة نفسها ثم تكتب كلٌّ منهما نسختها فيتكاثر الفقدان.
 */
export async function mutateQaData<T>(
  fn: (data: QaData) => Promise<T> | T
): Promise<T> {
  return withWriteLock<T>(DATA_LOCK, async () => {
    const data = await readQaData();
    const result = await fn(data);
    await writeQaDataAtomic(data);
    return result;
  });
}

/**
 * نقطة كتابة موحّدة لسجل الأصوات.
 *
 * ⚠️ كان يستخدم قفل `qa-votes` منفصلاً عن قفل `mutateBoth` (وهو الخطر الموصوف
 * أعلاه عند `DATA_LOCK`). الآن يتشاركان القفل الواحد.
 */
export async function mutateVotes<T>(
  fn: (store: QaVoteStore) => Promise<T> | T
): Promise<T> {
  return withWriteLock<T>(DATA_LOCK, async () => {
    const store = await readVotes();
    const result = await fn(store);
    await writeVotesAtomic(store);
    return result;
  });
}

interface QaWriteContext {
  data: QaData;
  votes: QaVoteStore;
}

/**
 * نقطة كتابة موحّدة تحدّث الملف الرئيسي وملف الأصوات معًا داخل **قفل واحد**.
 *
 * تُستخدم عندما نحتاج تعديل كليهما في عملية ذرّية واحدة (مثل التصويت)،
 * لتفادي تعشيق الأقفال (nested locks) الذي قد يتسبب في توقف (deadlock).
 *
 * ⚠️ ترتيب الكتابة: الأصوات **أولاً** ثم البيانات. لو تعذّرت الكتابة الثانية
 * تبقى سجلات الأصوات بلا عدّاد مقابل، ويُصحَّح بإعادة الحساب؛ أمّا لو كُتبت
 * البيانات أولاً وفسدت كتابة الأصوات لظهر عدّاد بلا سجلات — وهو الخيار الأسوأ
 * لأنه يمنع تصحيح العدّاد.
 */
export async function mutateBoth<T>(
  fn: (ctx: QaWriteContext) => Promise<T> | T
): Promise<T> {
  return withWriteLock<T>(DATA_LOCK, async () => {
    const data = await readQaData();
    const votes = await readVotes();
    const ctx: QaWriteContext = { data, votes };
    const result = await fn(ctx);
    await writeVotesAtomic(votes);
    await writeQaDataAtomic(data);
    return result;
  });
}

/* ───────────────────────── الاستبيان ───────────────────────── */

/** قراءة ردود الاستبيان من `QA_DATA_DIR` (وليس من مسار ثابت). */
export async function readSurveys(): Promise<SurveyStore> {
  guardProdDataDir();
  try {
    const raw = await fs.readFile(surveyFilePath(), "utf-8");
    const parsed = JSON.parse(raw) as SurveyStore;
    return { responses: Array.isArray(parsed.responses) ? parsed.responses : [] };
  } catch {
    return { responses: [] };
  }
}

/** كتابة ذرّية لردود الاستبيان (tmp ثم rename — لا ملف ناقص تحت القارئات). */
async function writeSurveysAtomic(store: SurveyStore): Promise<void> {
  await fs.mkdir(resolveDataDir(), { recursive: true });
  const tmp = surveyFilePath() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await renameWithRetry(tmp, surveyFilePath());
}

/** قراءة + تعديل + كتابة ذرّية لردود الاستبيان داخل القفل. */
export async function mutateSurveys<T>(
  fn: (store: SurveyStore) => Promise<T> | T
): Promise<T> {
  return withWriteLock<T>("qa-surveys", async () => {
    const store = await readSurveys();
    const result = await fn(store);
    await writeSurveysAtomic(store);
    return result;
  });
}
