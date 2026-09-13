"use client";

import { useMemo } from "react";

interface WordEntry {
  text: string;
  count: number;
}

interface Props {
  words: WordEntry[];
  maxWords?: number;
}

/** إزالة كلمات التوقف الشائعة (عربي + إنكليزي). */
const STOP_WORDS = new Set([
  // English
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "out", "off", "over",
  "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same",
  "so", "than", "too", "very", "just", "about", "also", "what", "which",
  "who", "whom", "this", "that", "these", "those", "and", "but", "or",
  "if", "because", "while", "although", "until", "since", "i", "me",
  "my", "myself", "we", "our", "ours", "you", "your", "he", "him",
  "his", "she", "her", "it", "its", "they", "them", "their",
  // Arabic
  "من", "في", "على", "إلى", "عن", "مع", "بين", "بعد", "قبل", "أن",
  "إن", "لا", "ما", "هل", "كيف", "لماذا", "متى", "أين", "هذا",
  "هذه", "ذلك", "تلك", "التي", "الذي", "هي", "هو", "نحن", "أنت",
  "أنا", "كل", "بعض", "قد", "لم", "لن", "كان", "يكون", "என்",
  "و", "أو", "ثم", "بل", "لكن", "حتى", "إذا", "لو", "عند",
  "أكثر", "أقل", "جداً", "كثير", "قليل", "يمكن", "يجب", "ضد",
]);

/**
 * يحسب تكرار الكلمات من مصفوفة نصوص.
 * يُزيل كلمات التوقف ويُعيد أعلى N كلمة.
 */
export function calculateWordFrequency(texts: string[], maxWords = 50): WordEntry[] {
  const freq = new Map<string, number>();

  for (const text of texts) {
    // تنظيف النص وتقسيمه لكلمات
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    for (const word of words) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxWords);
}

export default function WordCloud({ words, maxWords = 30 }: Props) {
  const display = useMemo(() => words.slice(0, maxWords), [words, maxWords]);

  if (display.length === 0) {
    return null;
  }

  const maxCount = display[0]?.count ?? 1;

  // ألوان متدرجة
  const colors = [
    "text-red-400",
    "text-red-300",
    "text-orange-400",
    "text-amber-400",
    "text-yellow-400",
    "text-zinc-300",
    "text-zinc-400",
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-8">
      {display.map((w, i) => {
        const ratio = w.count / maxCount;
        const fontSize = Math.max(0.8, ratio * 2.5);
        const color = colors[i % colors.length];
        return (
          <span
            key={w.text}
            className={`${color} font-bold transition-all duration-300 cursor-default`}
            style={{ fontSize: `${fontSize}rem` }}
            title={`${w.count} occurrences`}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
