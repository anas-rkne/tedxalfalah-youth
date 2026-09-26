"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicSnapshot } from "./public-view";

type StreamData = PublicSnapshot;

interface UseQaStreamOptions {
  /** أي شاشة تطلب البيانات — تخصّص مجموعة الأسئلة المعروضة. */
  view?: "live" | "speaker";
  pollInterval?: number;
}

/**
 * hook يقرأ من /api/qa/stream (SSE) ويعيد البيانات المحدثة فوراً،
 * مع fallback إلى polling عند تعذّر الاتصال.
 *
 * ملاحظة: SSE و polling يقرآن نفس نوع البيانات `PublicSnapshot` المعرَّف في
 * `public-view.ts`، فلا يحدث تعارض في الشكل بين المسارين.
 */
export function useQaStream({ view = "live", pollInterval = 5000 }: UseQaStreamOptions = {}) {
  const [data, setData] = useState<StreamData | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const query = `?view=${encodeURIComponent(view)}`;

  const loadPoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/qa/session/current${query}`, { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as StreamData);
    } catch {
      /* تجاهل مؤقت */
    }
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (cancelled) return;

      // متصفحات قديمة جداً لا تدعم EventSource إطلاقاً — نتخطّى إلى polling
      // بدل أن يرمي التأثير استثناءً غير معالَج.
      if (typeof EventSource === "undefined") return;

      const es = new EventSource(`/api/qa/stream${query}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!cancelled) setConnected(true);
      };

      es.onmessage = (event) => {
        if (cancelled) return;
        try {
          setData(JSON.parse(event.data) as StreamData);
        } catch {
          /* تجاهل بيانات غير صالحة */
        }
      };

      es.onerror = () => {
        if (cancelled) return;
        setConnected(false);
        es.close();
        eventSourceRef.current = null;
        // إعادة المحاولة بعد 3 ثوانٍ.(setConnected(false) يفعّل polling فوراً
        // عبر التأثير أدناه، فلا تبقى الشاشة بلا بيانات أثناء الانتظار).
        retry = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [query]);

  // Fallback: polling ما دمنا غير متصلين بـSSE.
  // لا نستدعي `loadPoll()` مباشرةً هنا: استدعاؤها في جسم التأثير يفعّل
  // setState متزامناً ويسبّب re-render متتالياً (يرفضه eslint). أول إطار من SSE
  // يصل فوراً، و`onerror` يعيد تشغيل هذا التأثير فتبدأ الدورة التالية.
  useEffect(() => {
    if (connected) return;
    const iv = setInterval(() => void loadPoll(), pollInterval);
    return () => clearInterval(iv);
  }, [connected, loadPoll, pollInterval]);

  return { data, connected };
}
