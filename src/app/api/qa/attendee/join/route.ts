/**
 * POST /api/qa/attendee/join — تسجيل حضور خفيف للحاضر.
 *
 * يقبل { name }. يسجّل الحاضر في **سجل حضور الخادم** (`session.attendees`) ويعيد
 * `attendeeId`، وهو المرجع الوحيد الذي يثق به الخادم لاحقاً عند إرسال الأسئلة
 * أو التصويت.
 *
 * لماذا السجل ضروري؟ كان سابقاً يُولَّد `attendeeId` عشوائياً ويُعاد للعميل من
 * غير أن يُربط باسمه في أي مكان، فيصبح الرمز غير قابل للتحقق. والاسم كان
 * يُؤخذ من جسم طلب السؤال مباشرة — فأي زائر كان يستطيع انتحال اسم غيره بمجرد
 * إرسال `name` مختلف. الآن الخادم يشتقّ الاسم من سجل الحضور ويتجاهل ما يرسله
 * العميل.
 *
 * ⚠️ **سر الاسترداد** — لماذا لا يُعاد المعرّف لأحد يعرف الاسم فقط؟
 * كان السطر `registry.find((a) => a.name === rawName)` يعيد `attendeeId` القائم
 * لأي طلب بنفس الاسم. ومعرّف الحضور هو الاعتماد الوحيد الذي يثق به الخادم
 * في الإرسال والتصويت والاستبيان، فمعرفة اسم زائر = انتحاله وتصويت باسمه.
 * الآن: يُعاد المعرّف القديم **فقط** مع `reclaimSecret` يطابقه (مقارنة
 * ثابتة الزمن). بدونه يُسجَّل حضور جديد باسم نفس الاسم — وهذا صحيح أيضاً:
 * شخصان مختلفان قد يحملان الاسم نفسه.
 *
 * الاسم يُخزَّن خاماً (بلا تهريب HTML): التهريب يحدث عند العرض في React.
 * التهريب وقت التخزين كان يُنتج ترميزاً مزدوجاً (`&amp;lt;`).
 *
 * الحماية: عام + Rate limit + Turnstile + التحقق من الأصل.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { timingSafeEqual, randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateQaData } from "@/lib/qa/storage";
import { attendeeCountOf, getActiveSession, newId, normalizeAttendees } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  turnstileToken: z.string().optional(),
  /** سر الاسترداد المحفوظ على جهاز الحاضر (يُرسل عند العودة بعد تحديث). */
  reclaimSecret: z.string().max(128).optional(),
});

/** مقارنة ثابتة الزمن حتى لا يكشف طول/بادئة السر عبر توقيت الاستجابة. */
function secretMatches(recorded: string | undefined, provided: string | undefined): boolean {
  if (!recorded || !provided) return false;
  const a = Buffer.from(recorded, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-join");
  if (!allowed) return qaError("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return qaError("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return qaError("Invalid name", 400, parsed.error.flatten());
  }

  const isHuman = await verifyTurnstile(parsed.data.turnstileToken);
  if (!isHuman) return qaError("Verification failed. Please try again.", 403);

  const rawName = parsed.data.name;
  const providedSecret = parsed.data.reclaimSecret;

  let result;
  try {
    result = await mutateQaData((data) => {
      const session = getActiveSession(data);
      if (!session) throw new Error("no-active-session");

      const registry = normalizeAttendees(session);
      const now = new Date().toISOString();

      // ⛔ الاسم وحده لا يُثبت شيئاً. نُعيد السجل القائم فقط إذا صحّ السر.
      const sameName = registry.filter((a) => a.name === rawName);
      const owned = sameName.find((a) => secretMatches(a.reclaimSecret, providedSecret));

      let record: (typeof sameName)[number];
      if (owned) {
        // عودة نفس الشخص (تحديث صفحة): نفس المعرّف، بلا تضخيم العدّ.
        record = owned;
      } else {
        // إما اسم جديد، أو شخص آخر يحمل نفس الاسم. كلاهما حضور مستقل.
        // السجلات القديمة بلا سر لا تُستعاد ⇒ هوية جديدة (لا تسليم معرّف بلا دليل).
        record = {
          id: newId("atn"),
          name: rawName,
          sessionId: session.id,
          joinedAt: now,
          reclaimSecret: randomBytes(16).toString("hex"),
        };
        registry.push(record);
        if (!session.attendeeNames.includes(rawName)) {
          session.attendeeNames.push(rawName);
        }
      }

      data.meta = {
        ...data.meta,
        totalAttendees: data.sessions.reduce((sum, s) => sum + attendeeCountOf(s), 0),
      };

      return {
        attendeeId: record.id,
        sessionId: session.id,
        name: record.name,
        reclaimSecret: record.reclaimSecret,
      };
    });
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] join failed:", err);
    return qaError("Failed to register attendance", 500);
  }

  return qaJson({ ok: true, ...result }, 200);
}
