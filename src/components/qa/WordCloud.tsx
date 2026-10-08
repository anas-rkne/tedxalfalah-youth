"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeFontSizes,
  layoutSpiral,
  type PlacedWord,
  type WordEntry,
} from "@/lib/qa/service";

interface Props {
  words: WordEntry[];
  maxWords?: number;
  /** نص يعرض عدد الأسئلة، يُمرَّر مترجَماً من `LiveScreen`. */
  countLabel?: (count: number) => string;
}

const MIN_FONT_PX = 20;
const MAX_FONT_PX = 64;
const FONT_STACK = "ui-sans-serif, system-ui, sans-serif";

const COLORS = [
  "text-red-400",
  "text-red-300",
  "text-orange-400",
  "text-amber-400",
  "text-yellow-400",
  "text-zinc-300",
  "text-zinc-400",
];

/**
 * مقياس عرض النص عبر canvas: أدقّ من تقدير `length * fontSize * 0.55`،
 * ومخزَّن مؤقتاً لأن القياس يُستدعى لكل كلمة في كل إعادة تخطيط.
 *
 * يحترم الخيار `actualBoundingBox*` فيعطي ارتفاعاً يغطّي النّبرة والذيل
 * لا صندوق الخط فقط، وإلا تلامست الكلماتُ ذات الحروف النازلة (ج، ب).
 *
 * بلا canvas (بيئة اختبار) نعود لتقدير متحفّظ لا يرمي.
 */
function createMeasurer(): (text: string, fontPx: number) => {
  width: number;
  height: number;
} {
  const cache = new Map<string, { width: number; height: number }>();
  let ctx: CanvasRenderingContext2D | null = null;

  return (text, fontPx) => {
    const key = `${fontPx}|${text}`;
    const hit = cache.get(key);
    if (hit) return hit;

    let width = text.length * fontPx * 0.58;
    let height = fontPx * 1.25;

    if (ctx === null && typeof document !== "undefined") {
      ctx = document.createElement("canvas").getContext("2d");
    }
    if (ctx) {
      ctx.font = `700 ${fontPx}px ${FONT_STACK}`;
      const m = ctx.measureText(text);
      width = m.width;
      height =
        (m.actualBoundingBoxAscent ?? fontPx * 0.78) +
        (m.actualBoundingBoxDescent ?? fontPx * 0.26);
    }

    const result = { width, height };
    cache.set(key, result);
    return result;
  };
}

export default function WordCloud({ words, maxWords = 30, countLabel }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  // ⚠️ تمرير `createMeasurer` مباشرة مرفوض: `useMemo` بلا مصفوفة تبعية
  // يخلط الدالة في كل تصيير، ومع مصفوفة `[]` يرفضه eslint لأنه ليس
  // تعبيراً دالّياً سطرياً. الحل: غلاف سطري.
  const measure = useMemo(() => createMeasurer(), []);

  // قياس الحاوية: التخطيط لا معنى له قبل معرفة الأبعاد، وقبل أول قياس
  // تُرجع `layoutSpiral` مصفوفة فارغة فلا يُومض المكوّن.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const sync = () =>
      setBox({ width: el.clientWidth, height: el.clientHeight });

    sync();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", sync);
      return () => window.removeEventListener("resize", sync);
    }
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const placed = useMemo<PlacedWord[]>(() => {
    const entries = words.slice(0, maxWords);
    if (entries.length === 0 || box.width <= 0 || box.height <= 0) return [];
    const sizes = computeFontSizes(entries, MIN_FONT_PX, MAX_FONT_PX);
    return layoutSpiral(entries, sizes, {
      width: box.width,
      height: box.height,
      measure,
      gap: 6,
    });
  }, [words, maxWords, box, measure]);

  // ⚠️ الحاوية تُقاس بـ`h-full`، فلا داعي لأن يحدّد المكوّن ارتفاعاً.
  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      data-testid="qa-word-cloud"
      data-placed-count={placed.length}
    >
      {placed.map((w, i) => (
        <span
          key={w.text}
          className={`absolute whitespace-nowrap font-bold leading-none ${
            COLORS[i % COLORS.length]
          }`}
          style={{
            left: `${w.x}px`,
            top: `${w.y}px`,
            fontSize: `${w.fontPx}px`,
            // مركز الصندوق أفقياً على نقطة اللولب لا من زاويته.
            width: `${w.boxWidth}px`,
            textAlign: "center",
          }}
          title={countLabel ? countLabel(w.count) : String(w.count)}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}
