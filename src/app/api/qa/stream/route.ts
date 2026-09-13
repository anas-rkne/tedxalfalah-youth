/**
 * GET /api/qa/stream — Server-Sent Events للتحديثات الفورية.
 *
 * يُرسل تحديثات فقط عند تغيير البيانات ( Questions / Polls / Attendees ).
 * لا يحتاج JWT — للقراءة فقط (الجمهور والشاشة).
 *
 * سلوك الإغلاق:
 * - بعد 30 دقيقة يُغلق الاتصال تلقائيًا.
 * - عند إغلاق العميل (AbortSignal) يُوقف البث.
 */
import { readQaData } from "@/lib/qa/storage";
import { normalizeData } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

export async function GET() {
  let closed = false;
  let timeout: ReturnType<typeof setTimeout>;

  const stream = new ReadableStream({
    start(controller) {
      let lastHash = "";

      const send = async () => {
        try {
          const raw = await readQaData();
          const data = normalizeData(raw);
          const json = JSON.stringify(data);
          const hash = String(json.length) + ":" + data.meta.totalVotes;

          if (hash !== lastHash) {
            lastHash = hash;
            controller.enqueue(`data: ${json}\n\n`);
          }
        } catch {
          /* تجاهل مؤقت */
        }
      };

      // أول إرسال فوراً
      send();

      // التحديث كل 3 ثوانٍ
      const interval = setInterval(() => {
        if (closed) {
          clearInterval(interval);
          return;
        }
        send();
      }, 3000);

      // إغلاق بعد 30 دقيقة
      timeout = setTimeout(() => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* أُغلق مسبقاً */
        }
      }, 30 * 60 * 1000);

      // إغلاق عندDisconnect
      // (controller.cancel يُستدعى عند إغلاق العميل)
    },
    cancel() {
      closed = true;
      if (timeout) clearTimeout(timeout);
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
