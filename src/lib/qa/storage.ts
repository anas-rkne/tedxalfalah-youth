/**
 * وحدة التخزين لنظام "جدار الأسئلة الحية" (Live Q&A Wall).
 *
 * تحفظ بيانات الجلسات والأسئلة والاستفتاءات في ملف JSON دائم على السيرفر
 * خارج مجلد البناء (`.next`)، بحيث تبقى البيانات بين عمليات إعادة التشغيل
 * والبناء. تتضمن آلية "قفل كتابة" (write lock) لمنع تلف الملف عند تزامن
 * عدة عمليات كتابة في اللحظة نفسها (مشاركة من مئات الأجهزة).
 */
import { promises as fs } from "fs";
import path from "path";
import type { QaData, QaVoteStore } from "./types";
import { emptyQaData, emptyVoteStore } from "./defaults";

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
 * حارس موثوقية: في الإنتاج (standalone) يقع process.cwd() داخل `.next`,
 * و prebuild يمسح `.next` — لذا التخزين الافتراضي داخل `.next` سيُفقد
 * البيانات مع كل رفع. يمنع ذلك صراحةً (خطأ واضح بدل الصمت) ويطالب بضبط
 * QA_DATA_DIR على مسار مطلق ثابت خارج مجلد البناء.
 */
function guardProdDataDir(): void {
  if (process.env.NODE_ENV !== "production") return;
  // فقط عند عدم ضبط QA_DATA_DIR صراحةً نفترض خطورة التخزين الافتراضي.
  if (process.env.QA_DATA_DIR) return;
  const dir = path.resolve(resolveDataDir());
  const cwd = path.resolve(process.cwd());
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

/** قفل كتابة بسيط يعمل داخل عملية واحدة (Node single-thread). */
let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * يضمن تنفيذ عمليات الكتابة بالتسلسل (serialized) لتجنّب تلف الملف عند
 * التزامن. كل عملية كتابة تُضاف إلى طابور؛ حينما تتقدم في الدور تُنفَّذ
 * على نسخة من البيانات وتُكتب بشكل ذري (atomic).
 */
export async function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  guardProdDataDir();
  const run = writeQueue.then(fn, fn);
  writeQueue = run.catch(() => undefined);
  return run;
}

/** قراءة محتويات ملف الموحد وإرجاع كائنه، وملف فارغ إن لم يوجد أو تلف. */
export async function readQaData(): Promise<QaData> {
  guardProdDataDir();
  try {
    const raw = await fs.readFile(dataFilePath(), "utf-8");
    return JSON.parse(raw) as QaData;
  } catch {
    return emptyQaData();
  }
}

/** كتابة ملف الموحد بشكل ذري (write-to-temp ثم rename). */
async function writeQaDataAtomic(data: QaData): Promise<void> {
  await fs.mkdir(resolveDataDir(), { recursive: true });
  const tmp = dataFilePath() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, dataFilePath());
}

/** قراءة سجل الأصوات (ملف منفصل). */
export async function readVotes(): Promise<QaVoteStore> {
  guardProdDataDir();
  try {
    const raw = await fs.readFile(voteFilePath(), "utf-8");
    return JSON.parse(raw) as QaVoteStore;
  } catch {
    return emptyVoteStore();
  }
}

/** إلحاق سجلات أصوات جديدة بناءً على كائن سجل مؤقت التصويت. */
async function writeVotesAtomic(store: QaVoteStore): Promise<void> {
  await fs.mkdir(resolveDataDir(), { recursive: true });
  const tmp = voteFilePath() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, voteFilePath());
}

/**
 * نقطة الكتابة الموحّدة: يقرأ الحالة الحالية، يطبّق دالة التحويل،
 * ثم يكتب الناتج داخل القفل.
 */
export async function mutateQaData<T>(
  fn: (data: QaData) => Promise<T> | T
): Promise<T> {
  return withWriteLock<T>(async () => {
    const data = await readQaData();
    const result = await fn(data);
    await writeQaDataAtomic(data);
    return result;
  });
}

/** نقطة كتابة موحّدة لسجل الأصوات. */
export async function mutateVotes<T>(
  fn: (store: QaVoteStore) => Promise<T> | T
): Promise<T> {
  return withWriteLock<T>(async () => {
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
 */
export async function mutateBoth<T>(
  fn: (ctx: QaWriteContext) => Promise<T> | T
): Promise<T> {
  return withWriteLock<T>(async () => {
    const data = await readQaData();
    const votes = await readVotes();
    const ctx: QaWriteContext = { data, votes };
    const result = await fn(ctx);
    await writeQaDataAtomic(data);
    await writeVotesAtomic(votes);
    return result;
  });
}
