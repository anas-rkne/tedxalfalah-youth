"use client";

import { memo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import DarkHeroSection from "@/components/shared/DarkHeroSection";

export interface TimelineStage {
  date: string;
  title: string;
}

interface TimelinePageClientProps {
  stages: TimelineStage[];
}

/* ═══ حركة متتابعة تُلغى تلقائياً عند تفضيل تقليل الحركة ═══ */
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const riseItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const TimelinePageClient = memo(function TimelinePageClient({
  stages,
}: TimelinePageClientProps) {
  const t = useTranslations("page.timeline");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const shouldReduceMotion = useReducedMotion();

  const hidden = shouldReduceMotion ? "show" : "hidden";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* ═══════════ HERO ═══════════ */}
      <DarkHeroSection
        badgeLabel={t("hero.badge")}
        mainTitle={t("hero.titleLine1")}
        highlightTitle={t("hero.titleHighlight")}
        description={t("hero.description")}
        isArabic={isArabic}
        heroImage={undefined}
      />

      {/* ═══════════ شريط المحطات ═══════════ */}
      <section className="relative bg-white overflow-hidden">
        {/* خلفية متوهجة */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(230,43,30,0.05), transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            variants={stagger}
            initial={hidden}
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-12 md:mb-16"
          >
            <motion.h2
              variants={riseItem}
              className={`text-2xl md:text-4xl font-black text-black mb-2 ${
                isArabic ? "font-arabic" : "font-alexandria"
              }`}
            >
              {t("section.title")}
            </motion.h2>
            <motion.p
              variants={riseItem}
              className={`text-sm md:text-base text-zinc-500 ${isArabic ? "font-arabic" : ""}`}
            >
              {t("section.subtitle")}
            </motion.p>
          </motion.div>

          {/* ── الشريط الأفقي (الشاشات الكبيرة) ──
              ثلاثة صفوف في شبكة واحدة: التواريخ، ثم صفّ الخيط والنقاط، ثم
              العناوين. الخيط يُرسم داخل صفّ النقاط على `top-1/2`، فلا يعتمد
              ارتفاعَ التاريخ الحسابَ اليدوي — النقطة في منتصف الخيط دائماً. */}
          <motion.div
            variants={stagger}
            initial={hidden}
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="hidden lg:block"
          >
            <div className="grid grid-cols-8">
              {/* الصف الأول: التواريخ */}
              {stages.map((stage, i) => (
                <motion.div
                  key={`date-${stage.date}-${i}`}
                  variants={riseItem}
                  className="h-6 flex items-center justify-center px-1 text-center"
                >
                  <span
                    className={`text-xs font-bold text-tedx-red whitespace-nowrap ${
                      isArabic ? "font-arabic" : ""
                    }`}
                  >
                    {stage.date}
                  </span>
                </motion.div>
              ))}

              {/* صفّ الخيط والنقاط */}
              <motion.div
                variants={riseItem}
                className="relative col-span-8 h-4 my-3 flex"
              >
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-tedx-red/30 rounded-full" />
                {stages.map((stage, i) => (
                  <div
                    key={`dot-${stage.date}-${i}`}
                    className="flex-1 flex items-center justify-center"
                  >
                    <span className="relative z-10 w-4 h-4 rounded-full bg-tedx-red border-[3px] border-tedx-red/20" />
                  </div>
                ))}
              </motion.div>

              {/* الصف الثالث: العناوين */}
              {stages.map((stage, i) => (
                <motion.div
                  key={`title-${stage.date}-${i}`}
                  variants={riseItem}
                  className="px-2 text-center"
                >
                  <span
                    className={`text-[13px] leading-snug text-zinc-700 ${
                      isArabic ? "font-arabic" : ""
                    }`}
                  >
                    {stage.title}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── الشريط الرأسي (الجوال) ── */}
          <motion.div
            variants={stagger}
            initial={hidden}
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="lg:hidden border-s-2 border-tedx-red/30 ms-3 space-y-7"
          >
            {stages.map((stage, i) => (
              <motion.div
                key={`${stage.date}-${i}`}
                variants={riseItem}
                className="relative ps-6"
              >
                <span className="absolute -start-[9px] top-1 w-4 h-4 rounded-full bg-tedx-red border-2 border-tedx-red/20" />
                <div
                  className={`text-xs font-bold text-tedx-red mb-1 ${
                    isArabic ? "font-arabic" : ""
                  }`}
                >
                  {stage.date}
                </div>
                <div className={`text-sm text-zinc-700 ${isArabic ? "font-arabic" : ""}`}>
                  {stage.title}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
});

export default TimelinePageClient;
