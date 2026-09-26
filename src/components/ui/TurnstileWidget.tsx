"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  /**
   * Changing this value resets the widget.
   *
   * Turnstile tokens are SINGLE USE: the server consumes them on the first
   * successful siteverify. Without a reset the form accepts exactly one
   * token, and every later submit fails with 403 until the page is reloaded.
   */
  resetKey?: string | number;
  className?: string;
  /**
   * يُستدعى `true` إذا لم يصل تحدٍّ بعد مهلة، و`false` عند وصول رمز.
   *
   * ⚠️ لماذا يلزم: لو منع النموذج الإرسال حتى يصل الرمز، فإن **تعذّر تحميل**
   * سكربت Cloudflare (واي فاي القاعة، CSP، ad-blocker، انقطاع) يعني زراً
   * معطّلاً إلى الأبد ولا يستطيع أحد المشاركة. مع هذا التنبيه يُعاد تفعيل
   * الزر ويُترك الخادم هو الحَكَم (وهو fail-closed في الإنتاج).
   */
  onStalled?: (stalled: boolean) => void;
}

/** مهلة انتظار التحدّي قبل إعلان التعذّر. */
const STALL_MS = 8000;

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_ID = "cf-turnstile-script";

/**
 * هل التحقق البصري مفعّل في هذه الواجهة؟
 *
 * التصدير مهم لأن النماذج يجب أن **تعرف** إن كانت تنتظر رمزاً: عند غياب
 * المفتاح العام لا يُرسَل رمز إطلاقاً، وطلب معطّل بدون تفسير يبدو للمستخدم
 * كأنه الموقع معطّل. تُبنى القيمة وقت البناء (NEXT_PUBLIC_*)، فإن كانت
 * فارغة فلا نطلب رمزاً ولا نعطّل الزر.
 */
export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

/**
 * The Turnstile script loads once; every widget instance has to share it.
 *
 * The previous implementation only wired `load` on the branch that CREATES
 * the script. Mounting a second widget while the script was still loading
 * (join + question + poll all render one) left it waiting for an event that
 * had already fired, so it never rendered and no challenge was shown.
 */
const loadWaiters: Array<() => void> = [];

function flushWaiters() {
  while (loadWaiters.length > 0) {
    const cb = loadWaiters.shift();
    try {
      cb?.();
    } catch {
      /* one failing widget must not break the rest */
    }
  }
}

function whenTurnstileReady(callback: () => void) {
  if (typeof window === "undefined") return;
  if (window.turnstile) {
    callback();
    return;
  }
  loadWaiters.push(callback);
  // Script tag already present and still loading: wait for its event instead
  // of injecting a second copy.
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  script.addEventListener("load", flushWaiters, { once: true });
  // Also drain waiters on failure so the list cannot grow without bound.
  script.addEventListener("error", flushWaiters, { once: true });
  document.body.appendChild(script);
}

export default function TurnstileWidget({
  onVerify,
  resetKey,
  className,
  onStalled,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  // The widget is built once inside useEffect, so keep the latest onVerify in
  // a ref instead of capturing the callback from the first render forever.
  const onVerifyRef = useRef(onVerify);
  const onStalledRef = useRef(onStalled);
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onStalledRef.current = onStalled;
  });

  useEffect(() => {
    if (!SITE_KEY) return;

    whenTurnstileReady(() => {
      if (!containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY as string,
        callback: (token: string) => {
          onStalledRef.current?.(false);
          onVerifyRef.current(token);
        },
        "expired-callback": () => onVerifyRef.current(""),
        "error-callback": () => onVerifyRef.current(""),
      });
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* the widget may already be gone with the DOM */
        }
        widgetIdRef.current = undefined;
      }
    };
  }, []);

  // Invalidate the consumed token and wait for a fresh one.
  useEffect(() => {
    if (resetKey === undefined) return;
    // ⚠️ الترتيب مقصود: نمحو الرمز **قبل** `reset` لا بعده. لو عكسناها، فإن
    // أي تنفيذ يستدعي `callback` بشكل متزامن أثناء `reset` (وهو سلوك معقول
    // في التنفيذات) شاهد المحو فيمحو الرمز الجديد الذي وصل للتو،
    // فيبقى النموذج بلا رمز إلى ما لا نهاية. بهذا الترتيب يصمد في الحالتين:
    // استدعاء متزامن (وصل الرمز فيبقى) أو غير متزامن (نمحو القديم أولاً).
    onVerifyRef.current("");
    if (!widgetIdRef.current || !window.turnstile) return;
    try {
      window.turnstile.reset(widgetIdRef.current);
    } catch {
      /* ignore */
    }
  }, [resetKey]);

  /** هل تعذّر الوصول إلى التحدّي؟ يُعاد الضبط مع كل `resetKey`. */
  useEffect(() => {
    if (!SITE_KEY || !onStalledRef.current) return;
    const timer = setTimeout(() => onStalledRef.current?.(true), STALL_MS);
    return () => clearTimeout(timer);
  }, [resetKey]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className={className ?? "my-2"} />;
}
