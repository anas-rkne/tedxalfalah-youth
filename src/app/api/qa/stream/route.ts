/**
 * GET /api/qa/stream — Server-Sent Events للتحديثات الفورية.
 *
 * يرسل **نفس** اللقطة العامة التي ترسلها `/api/qa/session/current`، عبر
 * `buildPublicSnapshot` (src/lib/qa/public-view.ts).
 *
 * لماذا لا يمكن أن يبني هذا الملف استجابته بنفسه؟
 * ------------------------------------------
 * كان سابقاً يُبثّ كائن `QaData` الخام (كل الجلسات، بما فيها المعلّقة
 * والمرفوضة، وبما فيها أسماء الحاضرين). هذا يسرّب بيانات إدارية، والأخطر:
 * شكله مختلف عن الشكل الذي تنتظره الواجهة، فتبقى شاشة العرض على حالة
 * الانتظار ما دام البث متصلاً ولا تُجلب البيانات عبر polling.
 * استخدام نفس الدالة يجعل انحراف الشكل مستحيلاً بنيوياً.
 *
 * الإرسال عند التغيّر فقط: نقارن بصمة محتوى كاملة (hash) لا الطول فقط،
 * لأن تعديلاً بنفس عدد البايتات (مثلاً حرف واحد في نص) كان يمرّ دون بث.
 *
 * سلوك الإغلاق:
 * - بعد 30 دقيقة يُغلق الاتصال تلقائياً (العميل يعيد الاتصال).
 * - عند إغلاق العميل (AbortSignal / controller.cancel) يتوقف المؤقتات.
 */
import { NextRequest } from "next/server";
import { validateOrigin } from "@/lib/cors";
import { checkQaReadRateLimit } from "@/lib/rate-limit";
import { readQaData } from "@/lib/qa/storage";
import { buildPublicSnapshot, isQaView } from "@/lib/qa/public-view";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 3000;
const MAX_CONNECTION_MS = 30 * 60 * 1000;

/** بصمة سريعة للمحتوى (FNV-1a 32-bit) — تكشف أي تغيّر حتى بنفس الطول. */
function fingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${value.length}:${hash.toString(36)}`;
}

export async function GET(request: NextRequest) {
  // البث نقطة عامة مفتوحة لعشرات الشاشات، فبلا هذين الحاجزين يمكن لأي زائر
  // حجز عدد كبير من الاتصالات المفتوحة.
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkQaReadRateLimit(request, "qa-stream");
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const rawView = request.nextUrl.searchParams.get("view") ?? "live";
  if (!isQaView(rawView)) {
    return new Response(JSON.stringify({ error: "Invalid view" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const view = rawView;

  let closed = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      let lastHash = "";

      const stop = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        if (deadline) clearTimeout(deadline);
        try {
          controller.close();
        } catch {
          /* أُغلق مسبقاً */
        }
      };

      const send = async () => {
        if (closed) return;
        try {
          const json = JSON.stringify(buildPublicSnapshot(await readQaData(), view));
          const hash = fingerprint(json);
          if (hash === lastHash) return;
          lastHash = hash;
          controller.enqueue(`data: ${json}\n\n`);
        } catch (error) {
          // تعذّرت القراءة مؤقتاً (قفل كتابة، خطأ io). لا نغلق الاتصال ولا نرسل
          // إطاراً ناقصاً — الإطار التالي سيحاول مجدداً.
          console.error("[qa/stream] snapshot failed:", error);
        }
      };

      void send();

      interval = setInterval(() => void send(), POLL_INTERVAL_MS);
      deadline = setTimeout(stop, MAX_CONNECTION_MS);

      // إغلاق مبكر عند قطع العميل.
      request.signal.addEventListener("abort", stop, { once: true });
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
      if (deadline) clearTimeout(deadline);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
