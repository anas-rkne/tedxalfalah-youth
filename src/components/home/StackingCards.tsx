"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Eye, Target, Sparkles, Users } from "lucide-react";

interface CardData {
  id: number;
  icon: React.ReactNode;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  accent: string;
  bgColor: string;
}

const cards: CardData[] = [
  {
    id: 1,
    icon: <Eye className="w-8 h-8" />,
    title: "Our Vision",
    titleAr: "رؤيتنا",
    body: "We believe ideas change the world. Every great movement started with a single thought shared boldly.",
    bodyAr: "نؤمن بأن الأفكار تغير العالم. كل حركة عظيمة بدأت بفكرة واحدة تُشارك بجرأة.",
    accent: "#E62B1E",
    bgColor: "bg-white",
  },
  {
    id: 2,
    icon: <Target className="w-8 h-8" />,
    title: "Our Mission",
    titleAr: "مهمتنا",
    body: "To inspire youth to start tomorrow, now. We create spaces where young voices become powerful ideas.",
    bodyAr: "نُلهِم الشباب ليبدأوا غداً، الآن. نخلق مساحات تتحول فيها الأصوات الشابة إلى أفكار قوية.",
    accent: "#1a1a1a",
    bgColor: "bg-zinc-50",
  },
  {
    id: 3,
    icon: <Sparkles className="w-8 h-8" />,
    title: "The Experience",
    titleAr: "التجربة",
    body: "18 minutes that could change your life. TEDx talks are designed to spark curiosity and ignite action.",
    bodyAr: "18 دقيقة قد تُغير حياتك. محادثات TEDx مصممة لإشعال الفضول وإطلاق الشرارة.",
    accent: "#E62B1E",
    bgColor: "bg-white",
  },
  {
    id: 4,
    icon: <Users className="w-8 h-8" />,
    title: "Join Us",
    titleAr: "انضم إلينا",
    body: "Be a speaker, a partner, or an attendee. The stage is set — all we need is you.",
    bodyAr: "كن متحدثاً أو شريكاً أو حضوراً. المسرح جاهز — كل ما نحتاجه هو أنت.",
    accent: "#ffffff",
    bgColor: "bg-[#E62B1E]",
  },
];

const easeOut = [0.23, 1, 0.32, 1] as const;

export default function StackingCards() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  if (shouldReduceMotion) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          {cards.map((card) => (
            <div key={card.id} className={`${card.bgColor} rounded-3xl p-10 shadow-sm border border-zinc-100`}>
              <div className="text-[#E62B1E] mb-4">{card.icon}</div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-3">
                {isRTL ? card.titleAr : card.title}
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                {isRTL ? card.bodyAr : card.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative bg-white"
      style={{ height: `${cards.length * 150}vh` }}  /* ← أطول: 600vh لـ 4 بطاقات */
    >
      {/* Section Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-zinc-100 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#E62B1E] mb-2"
          >
            <span className="w-6 h-px bg-[#E62B1E]" />
            {isRTL ? "رحلتنا" : "Our Journey"}
            <span className="w-6 h-px bg-[#E62B1E]" />
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
            className="text-3xl md:text-4xl font-bold text-zinc-900"
          >
            {isRTL ? "قصة TEDxAlFalah Youth" : "The TEDxAlFalah Youth Story"}
          </motion.h2>
        </div>
      </div>

      {/* Stacking Cards */}
      {cards.map((card, index) => {
        // Each card gets its own scroll range
        const cardStart = index / cards.length;
        const cardEnd = (index + 1) / cards.length;

        const cardProgress = useTransform(
          scrollYProgress,
          [cardStart, cardEnd],
          [0, 1]
        );

        // Scale: starts at 1, shrinks to 0.9 as next card comes
        const scale = useTransform(cardProgress, [0, 1], [1, 0.88]);

        // Opacity: stays 1 until 70%, then fades to 0.3
        const opacity = useTransform(cardProgress, [0, 0.7, 1], [1, 1, 0.3]);

        // Y offset: slight push up as it gets covered
        const y = useTransform(cardProgress, [0, 1], [0, -20]);

        return (
          <motion.div
            key={card.id}
            className="sticky flex items-start justify-center"
            style={{
              top: `${100 + index * 60}px`,  /* ← offset أكبر: 60px بين كل بطاقة */
              height: "100vh",
              zIndex: index + 1,
              paddingTop: "2rem",
            }}
          >
            <motion.div
              className={`w-full max-w-3xl mx-6 ${card.bgColor} rounded-3xl shadow-2xl border border-zinc-100/50 overflow-hidden stacking-card-inner`}
              style={{
                scale: index < cards.length - 1 ? scale : 1,
                opacity: index < cards.length - 1 ? opacity : 1,
                y: index < cards.length - 1 ? y : 0,
              }}
            >
              {/* Accent bar */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: card.accent }}
              />

              <div className="p-10 md:p-14">
                {/* Icon + Number */}
                <div className="flex items-center justify-between mb-8">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: card.id === 4 ? "rgba(255,255,255,0.2)" : `${card.accent}10`,
                      color: card.id === 4 ? "#fff" : card.accent,
                    }}
                  >
                    {card.icon}
                  </div>
                  <span
                    className="text-7xl font-black opacity-10 select-none"
                    style={{ color: card.id === 4 ? "#fff" : card.accent }}
                  >
                    0{card.id}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={`text-3xl md:text-4xl font-bold mb-4 ${
                    card.id === 4 ? "text-white" : "text-zinc-900"
                  }`}
                >
                  {isRTL ? card.titleAr : card.title}
                </h3>

                {/* Body */}
                <p
                  className={`text-lg leading-relaxed max-w-xl ${
                    card.id === 4 ? "text-white/90" : "text-zinc-600"
                  }`}
                >
                  {isRTL ? card.bodyAr : card.body}
                </p>

                {/* CTA on last card */}
                {card.id === 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5, ease: easeOut }}
                    className="mt-8 flex flex-wrap gap-4"
                  >
                    <a
                      href="/ar/apply"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#E62B1E] rounded-full font-semibold text-sm hover:bg-zinc-100 transition-colors"
                    >
                      {isRTL ? "تقديم كمتحدث" : "Apply as Speaker"}
                    </a>
                    <a
                      href="/ar/contact"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white rounded-full font-semibold text-sm hover:bg-white/10 transition-colors"
                    >
                      {isRTL ? "تواصل معنا" : "Contact Us"}
                    </a>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </section>
  );
}