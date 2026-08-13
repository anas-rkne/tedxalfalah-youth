"use client";

import { memo, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge";
import FadeUp from "@/components/shared/FadeUp";

// استيراد CSS الخاص بـ Leaflet (ضروري لظهور الخريطة والأزرار)
import "leaflet/dist/leaflet.css";

// الخريطة التفاعلية تُحمَّل من جهة العميل فقط (ssr: false) لأن Leaflet يعتمد على واجهة المتصفح (window)
const LeafletMap = dynamic(
  () => import("@/components/ui/LeafletMap").then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] md:min-h-[400px] bg-muted/20 animate-pulse rounded-xl flex items-center justify-center text-muted-foreground text-sm">
        جاري تحميل الخريطة...
      </div>
    )
  }
);

interface AboutContentProps {
  heading: string;
  body: string;
  licenseNote: string;
  badgeLabel: string;
  mapAlt: string;
  venueLabel: string;
  valuesLabels: {
    platform: string;
    community: string;
    ideas: string;
  };
  ctaHeading: string;
  ctaDescription: string;
  applyLabel: string;
  ticketsLabel: string;
}

/* ═══════════════════════════════════════════════════════════════
   مكونات فرعية مستخرجة (ثابتة، تُنشأ مرة واحدة)
   ═══════════════════════════════════════════════════════════════ */

const AnimatedWord = memo(function AnimatedWord({
  word,
  index,
  isHighlight,
  shouldReduceMotion,
}: {
  word: string;
  index: number;
  isHighlight: boolean;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <motion.span
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 40, rotateX: -40 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`inline-block mx-1 md:mx-1.5 ${
        isHighlight ? "text-tedx-red" : "text-foreground"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {word}
    </motion.span>
  );
});

const FormattedParagraph = memo(function FormattedParagraph({
  text,
  className,
  isRTL,
}: {
  text: string;
  className?: string;
  isRTL: boolean;
}) {
  const parts = useMemo(() => {
    const highlightRegex = /(TEDx|TED)(?![A-Za-z0-9])/g;
    const result: { type: "text" | "highlight"; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = highlightRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      result.push({ type: "highlight", content: match[0] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      result.push({ type: "text", content: text.slice(lastIndex) });
    }
    if (result.length === 0) {
      result.push({ type: "text", content: text });
    }
    return result;
  }, [text]);

  return (
    <p className={className} dir={isRTL ? "rtl" : "ltr"}>
      {parts.map((part, index) => {
        if (part.type === "highlight") {
          return (
            <span key={index} dir="ltr" className="inline-block text-tedx-red font-semibold">
              {part.content}
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </p>
  );
});

/* ═══════════════════════════════════════════════════════════════
   المكون الرئيسي
   ═══════════════════════════════════════════════════════════════ */
export default function AboutContent({
  heading,
  body,
  licenseNote,
  badgeLabel,
  mapAlt,
  venueLabel,
  valuesLabels,
  ctaHeading,
  ctaDescription,
  applyLabel,
  ticketsLabel,
}: AboutContentProps) {
  const { isRTL } = useRTL();
  const shouldReduceMotion = useReducedMotion();

  // تصحيح مسارات أيقونات Marker الخاصة بـ Leaflet في بيئة Next.js
  useEffect(() => {
    // يتم تنفيذ هذا الكود فقط في المتصفح (العميل)
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        // حذف المسار المخزن مؤقتاً للأيقونة الافتراضية وإعادة تعيينه
        delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      });
    }
  }, []);

  const titleWords = useMemo(() => heading.split(" "), [heading]);
  const highlightWords = ["TED", "TEDx"];

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      {/* ─── HEADER ─── */}
      <div className="container-padding max-w-5xl mx-auto text-center">
        <FadeUp>
          <div className="flex justify-center mb-4">
            <SectionBadge>{badgeLabel}</SectionBadge>
          </div>
        </FadeUp>

        <div className="perspective-[1000px] mt-6 heading-margin">
          <h1 className="heading-h1 tracking-[-0.03em] leading-[1.1]">
            {titleWords.map((word, index) => (
              <AnimatedWord
                key={index}
                word={word}
                index={index}
                isHighlight={highlightWords.some((hw) =>
                  word.toLowerCase().includes(hw.toLowerCase())
                )}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </h1>
        </div>

        <motion.div
          initial={shouldReduceMotion ? {} : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center justify-center gap-3 origin-center"
        >
          <div className="h-px w-10 bg-border" />
          <div className="h-1 w-14 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
          <div className="h-px w-10 bg-border" />
        </motion.div>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="container-padding max-w-7xl mx-auto mt-10 md:mt-16">
        {/* dir="ltr" يثبت الترتيب البصري: النص يسار، الخريطة يمين، في كل اللغات */}
        <div
          dir="ltr"
          className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
        >
          {/* النص التعريفي (dir="auto" لاستجابة الاتجاه للغة) */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 max-w-xl"
            dir="auto"
          >
            <div className="relative p-8 md:p-10 rounded-[24px] bg-card border border-border">
              <div className="w-12 h-12 rounded-2xl bg-tedx-red/10 flex items-center justify-center text-tedx-red mb-6">
                <Lightbulb className="w-6 h-6" />
              </div>

              <FormattedParagraph
                text={body}
                className="text-base md:text-lg text-muted-foreground leading-[1.9] font-light"
                isRTL={isRTL}
              />
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-card border border-border">
              <p
                className="text-sm text-muted-foreground italic leading-relaxed"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {licenseNote}
              </p>
            </div>
          </motion.div>

          {/* خريطة دبي التفاعلية (Leaflet — تحريك وتكبير) على الجانب الأيمن من النص في كل اللغات
              تم إضافة ارتفاع ثابت للحاوية لضمان ظهور الخريطة */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 md:order-last flex justify-center w-full"
          >
            <div 
              className="relative w-full max-w-md lg:max-w-lg h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-lg" 
              aria-label={mapAlt}
            >
              <LeafletMap
                center={[24.4356691, 54.7326539]} // إحداثيات نبض الفلاح في أبوظبي
                zoom={16}
                venueLabel={venueLabel}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}