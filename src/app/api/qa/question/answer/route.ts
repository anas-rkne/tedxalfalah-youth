/**
 * POST /api/qa/question/answer — جواب مفتوح من الحاضر على سؤال.
 *
 * ⚠️ لماذا هذا **ليس** سؤالاً جديداً؟
 * سؤال الحضور يُقرأ بصوت عالٍ في القاعة (يصل إلى الجميع بلا تدقيق). أما
 * الجواب المفتوح فيُقرأ على شاشته الخاصة ويصل **إلى المتحدث فقط** بعد
 * إشراف. فلو أدخلناه مسار الأسئلة كان كل جواب سيظهر على الشاشة الكبيرة
 * وعلى صفحة المتحدث بلا مراجعة — تسريب مباشر.
 *
 * لذلك: نفس دورة الأسئلة تماماً (`pending → approved/rejected`)، لكن مع
 * بوابة مراجعة إلزامية، ومخزنه `QaQuestion.answers` لا `session.questions`.
 *
 * الحمايات المطبَّقة (كلها على الخادم، لا على زر في الواجهة):
 *  - Origin + Turnstile + rate limit (بنفس مستوى السؤال، فالحضور إنسان).
 *  - `attendeeId` يُشتق منه الاسم من سجل الحضور: لا اسم من العميل.
 *  - حصة لكل حاضر في الجلسة (`MAX_ANSWERS_PER_ATTENDEE`): الإشراف هو
 *    عنق الزجاجة، ومَن يغرق صندوق المراجعة يفقد الحفل أسئلته.
 *  - **جواب واحد لكل (حاضر × سؤال)**: تكرارٌ = تعديل للنصّ ويعود للحالة
 *    `pending`، فلا يستطيع حاضر واحد أن يبني جداراً من 20 إجابة.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { verifyTurnstile } from "@/lib/turnstile";
import { qaError, qaJson, qaErrorFromKnown } from "@/lib/qa/http";
import { mutateQaData } from "@/lib/qa/storage";
import {
  MAX_ANSWER_LENGTH,
  findAttendee,
  getActiveSession,
  upsertAnswer,
} from "@/lib/qa/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  questionId: z.string().min(1).max(200),
  attendeeId: z.string().min(1).max(200),
  text: z.string().trim().min(2).max(MAX_ANSWER_LENGTH),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-answer");
  if (!allowed) return qaError("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return qaError("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return qaError("Invalid answer", 400, parsed.error.flatten());
  }

  const isHuman = await verifyTurnstile(parsed.data.turnstileToken);
  if (!isHuman) return qaError("Verification failed. Please try again.", 403);

  const { questionId, attendeeId } = parsed.data;
  const safeText = parsed.data.text;

  try {
    const result = await mutateQaData((data) => {
      const session = getActiveSession(data);
      if (!session) throw new Error("no-active-session");

      // 🔒 الهوية من سجل الحضور، لا من العميل.
      const attendee = findAttendee(session, attendeeId);
      if (!attendee) throw new Error("attendee-not-registered");

      const question = session.questions.find((q) => q.id === questionId);
      // ⚠️ القابلة للإجابة = **المعتمدة وحدها**، بنفس رسالة «غير موجود»:
      //  - المعلّق لم يره أحد بعد، وقد يُرفض غداً — فجمع إجاباته يعني عملاً
      //    مراجعة يُرمى إن رُفض السؤال.
      //  - المرفوض لا يجب أن يولّد أي أثر جديد.
      //  - ولا نميّز بينهما حتى لا نكشف حالة سؤال بعينه لغير المصرّح له.
      if (
        !question ||
        question.status !== "approved" ||
        question.showOnSpeaker === false
      ) {
        throw new Error("question-not-answerable");
      }

      // المنطق كله (الحصة/الاستبدال/البناء) في `upsertAnswer` ليُختبَر
      // وحدوياً بلا HTTP — المسار هنا تحقّق من الهوية والجلسة فقط.
      return upsertAnswer(
        session,
        question,
        { id: attendee.id, name: attendee.name },
        safeText,
        new Date().toISOString()
      );
    });

    return qaJson({
      ok: true,
      // نُعيد الحالة والمعرّف فقط — لا نُعيد كائن الإجابة كاملاً (لا داعي).
      answer: { id: result.answer.id, status: result.answer.status },
      replaced: result.replaced,
    });
  } catch (err) {
    const known = qaErrorFromKnown(err instanceof Error ? err.message : "");
    if (known) return known;
    console.error("[QA] answer submit failed:", err);
    return qaError("Could not save the answer", 500);
  }
}
