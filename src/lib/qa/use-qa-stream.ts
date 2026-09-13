"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface StreamData {
  active: boolean;
  settings?: { eventName?: string; eventNameAr?: string };
  session: {
    id: string;
    title: string;
    titleAr?: string;
    acceptingQuestions: boolean;
    attendeeCount: number;
  } | null;
  questions?: Array<{
    id: string;
    author: string;
    text: string;
    votes: number;
    featured: boolean;
    answered?: boolean;
  }>;
  polls?: Array<{
    id: string;
    prompt: string;
    promptAr?: string;
    options: string[];
    optionsAr?: string[];
    active: boolean;
    showResults: boolean;
    tallies: number[] | null;
    totalVotes: number | null;
  }>;
  meta?: {
    totalAttendees: number;
    totalQuestions: number;
    totalVotes: number;
  };
}

/**
 * hook يقرأ من /api/qa/stream (SSE) ويعيد البيانات المحدثة فوراً.
 * ي fallback إلى polling إذا فشل الاتصال.
 */
export function useQaStream(pollInterval = 5000) {
  const [data, setData] = useState<StreamData | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadPoll = useCallback(async () => {
    try {
      const res = await fetch("/api/qa/session/current");
      const d = await res.json();
      setData(d);
    } catch {
      /* تجاهل مؤقت */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      try {
        const es = new EventSource("/api/qa/stream");
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!cancelled) setConnected(true);
        };

        es.onmessage = (event) => {
          if (cancelled) return;
          try {
            const parsed = JSON.parse(event.data) as StreamData;
            setData(parsed);
          } catch {
            /* تجاهل بيانات غير صالحة */
          }
        };

        es.onerror = () => {
          if (!cancelled) {
            setConnected(false);
            es.close();
            eventSourceRef.current = null;
            // إعادة محاولة بعد 3 ثوانٍ
            setTimeout(connect, 3000);
          }
        };
      } catch {
        // SSE غير مدعوم — fallback إلى polling
        if (!cancelled) {
          setConnected(false);
          loadPoll();
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [loadPoll]);

  // fallback: polling إذا لم يتصل SSE خلال 5 ثوانٍ
  useEffect(() => {
    if (connected) return;
    const iv = setInterval(loadPoll, pollInterval);
    return () => clearInterval(iv);
  }, [connected, loadPoll, pollInterval]);

  return { data, connected };
}
