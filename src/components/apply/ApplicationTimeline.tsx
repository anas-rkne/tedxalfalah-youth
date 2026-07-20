"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Clock, CheckCircle2, Circle, Users, Mic2, Award, PartyPopper } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   أنواع البيانات
   ═══════════════════════════════════════════════════════════════ */
interface TimelinePhase {
  id: number;
  title: string;
  date?: string;        // ← أصبحت اختيارية
  dateRange?: string;
  description: string;
  whatToExpect: string;
  icon: React.ReactNode;
}

/* ═══════════════════════════════════════════════════════════════
   البيانات — 11 مرحلة كاملة
   ═══════════════════════════════════════════════════════════════ */
const TIMELINE_PHASES: TimelinePhase[] = [
  {
    id: 1,
    title: "فتح باب التقديم",
    date: "15 سبتمبر 2026",
    description: "يفتح باب التقديم للمتحدثين الشباب والخبراء.",
    whatToExpect: "املأ النموذج بعناية وأرفق فيديو الاختبار إن أمكن.",
    icon: <Clock size={16} />,
  },
  {
    id: 2,
    title: "إغلاق باب التقديم",
    date: "15 أكتوبر 2026",
    description: "آخر موعد لاستلام الطلبات.",
    whatToExpect: "تأكد من إرسال طلبك قبل منتصف الليل.",
    icon: <Circle size={16} />,
  },
  {
    id: 3,
    title: "فحص الطلبات",
    dateRange: "16–31 أكتوبر 2026",
    description: "يقوم مجتمع المراجعة بتقييم جميع الطلبات.",
    whatToExpect: "نقرأ كل طلب بعناية ونقيمه حسب الأصالة والوضوح والاستعداد.",
    icon: <Users size={16} />,
  },
  {
    id: 4,
    title: "الإعلان عن القائمة المختصرة",
    date: "5 نوفمبر 2026",
    description: "نعلن عن المرشحين الذين وصلوا للقائمة المختصرة.",
    whatToExpect: "ستصلك رسالة بريد إلكتروني بغضون 48 ساعة.",
    icon: <CheckCircle2 size={16} />,
  },
  {
    id: 5,
    title: "المقابلة الأولى",
    dateRange: "10–20 نوفمبر 2026",
    description: "مقابلات فردية مع المرشحين المختصَرين.",
    whatToExpect: "نتحدث عن فكرتك ونرى مدى ارتباطها بالموضوع.",
    icon: <Mic2 size={16} />,
  },
  {
    id: 6,
    title: "تأكيد التقدم",
    date: "25 نوفمبر 2026",
    description: "إعلان المرشحين الذين تأهلوا للمرحلة التالية.",
    whatToExpect: "ستبدأ رحلة التدريب والإعداد للحديث.",
    icon: <CheckCircle2 size={16} />,
  },
  {
    id: 7,
    title: "المقابلة الثانية",
    dateRange: "1–10 ديسمبر 2026",
    description: "مقابلة ثانية للمرشحين المتقدمين.",
    whatToExpect: "نناقش تطور فكرتك ونحدد ملاحظات التحسين.",
    icon: <Mic2 size={16} />,
  },
  {
    id: 8,
    title: "الإعلان عن الاختيار النهائي",
    date: "20 ديسمبر 2026",
    description: "الإعلان الرسمي عن المتحدثين النهائيين.",
    whatToExpect: "تهانينا! ستبدأ رحلة التدريب المكثف.",
    icon: <Award size={16} />,
  },
  {
    id: 9,
    title: "التدريب والإرشاد",
    dateRange: "يناير – فبراير 2027",
    description: "برنامج تدريبي مكثف لتحضير الحديث.",
    whatToExpect: "جلسات أسبوعية مع مدربي TEDx المحترفين.",
    icon: <Users size={16} />,
  },
  {
    id: 10,
    title: "البروفات",
    dateRange: "1–10 مارس 2027",
    description: "بروفات نهائية على المسرح قبل الحدث.",
    whatToExpect: "تجربة المسرح الحقيقي والتعود على الإضاءة والصوت.",
    icon: <Mic2 size={16} />,
  },
  {
    id: 11,
    title: "يوم الحدث",
    date: "15 مارس 2027",
    description: "اليوم الكبير — خذ نفساً عميقاً وشارك قصتك.",
    whatToExpect: "أنت جاهز. العالم ينتظر أن يسمع صوتك.",
    icon: <PartyPopper size={16} />,
  },
];

/* ═══════════════════════════════════════════════════════════════
   شارة عنوان القسم
   ═══════════════════════════════════════════════════════════════ */
function SectionBadge({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
        }}
      />
      <span className="text-[13px] font-semibold text-slate-400/60 uppercase tracking-[0.08em] whitespace-nowrap px-5 py-2 bg-slate-400/[0.06] border border-slate-400/[0.08] rounded-full">
        {title}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   بطاقة مرحلة — عمودية (موبايل)
   ═══════════════════════════════════════════════════════════════ */
function MobilePhaseCard({
  phase,
  isLast,
}: {
  phase: TimelinePhase;
  isLast: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isFirst = phase.id === 1;

  return (
    <div className="relative pl-8">
      {/* الخط الرأسي */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-gradient-to-b from-slate-700/40 to-transparent" />
      )}

      {/* الدائرة */}
      <div
        className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
          isFirst
            ? "bg-[#e62b1e] border-[#e62b1e] text-white shadow-[0_0_12px_rgba(230,43,30,0.4)]"
            : "bg-[#0a0a0e] border-slate-700/50 text-slate-500"
        }`}
      >
        {phase.id}
      </div>

      {/* المحتوى */}
      <div
        className={`pb-6 rounded-2xl border transition-all duration-300 ${
          isFirst
            ? "bg-white/[0.04] border-white/[0.08]"
            : "bg-transparent border-transparent hover:bg-white/[0.02]"
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-start justify-between gap-3 text-start p-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-500">{phase.icon}</span>
              <span className="text-[11px] font-medium text-slate-500/70 tracking-wide">
                {phase.date || phase.dateRange}
              </span>
            </div>
            <h3
              className={`text-[15px] font-semibold leading-snug ${
                isFirst ? "text-white" : "text-slate-300"
              }`}
            >
              {phase.title}
            </h3>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="mt-1 text-slate-500 flex-shrink-0"
          >
            <ChevronDown size={16} />
          </motion.div>
        </button>

        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="px-4 pb-4 overflow-hidden"
          >
            <p className="text-[13px] text-slate-400/70 leading-relaxed mb-2">
              {phase.description}
            </p>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-[#e62b1e]/80 whitespace-nowrap mt-0.5">
                نتوقع منك:
              </span>
              <p className="text-[12px] text-slate-400/60 leading-relaxed">
                {phase.whatToExpect}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   بطاقة مرحلة — أفقية (ديسكتوب)
   ═══════════════════════════════════════════════════════════════ */
function DesktopPhaseCard({
  phase,
  isActive,
}: {
  phase: TimelinePhase;
  isActive: boolean;
}) {
  return (
    <motion.div
      className={`relative flex flex-col items-center text-center group cursor-pointer ${
        isActive ? "z-10" : "z-0"
      }`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* الدائرة */}
      <div
        className={`relative w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${
          isActive
            ? "bg-[#e62b1e] text-white shadow-[0_0_20px_rgba(230,43,30,0.35)]"
            : "bg-[#1a1a1f] text-slate-500 border border-slate-700/40 group-hover:border-slate-600/60"
        }`}
      >
        <span className="text-sm font-bold">{phase.id}</span>
        {isActive && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[#e62b1e]/20" />
        )}
      </div>

      {/* التاريخ */}
      <span className="text-[11px] font-medium text-slate-500/60 tracking-wide mb-2">
        {phase.date || phase.dateRange}
      </span>

      {/* العنوان */}
      <h3
        className={`text-[13px] font-semibold leading-snug mb-2 transition-colors duration-300 ${
          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-300"
        }`}
      >
        {phase.title}
      </h3>

      {/* الوصف — يظهر عند hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-[140px]">
        <p className="text-[11px] text-slate-500/60 leading-relaxed">
          {phase.description}
        </p>
      </div>

      {/* الأيقونة */}
      <div className="mt-2 text-slate-600/40 group-hover:text-slate-500/60 transition-colors">
        {phase.icon}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   المكون الرئيسي
   ═══════════════════════════════════════════════════════════════ */
export default function ApplyTimeline() {
  const shouldReduceMotion = useReducedMotion();
  const activePhase = 1; // المرحلة النشطة حالياً

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0e]">
      <div className="max-w-7xl mx-auto">
        <SectionBadge title="رحلة التقديم" />

        {/* النسخة الموبايل — عمودية */}
        <div className="md:hidden">
          {TIMELINE_PHASES.map((phase, index) => (
            <motion.div
              key={phase.id}
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <MobilePhaseCard
                phase={phase}
                isLast={index === TIMELINE_PHASES.length - 1}
              />
            </motion.div>
          ))}
        </div>

        {/* النسخة الديسكتوب — أفقية */}
        <div className="hidden md:block">
          {/* الخط الرئيسي */}
          <div className="relative mb-12">
            <div
              className="absolute top-6 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.12) 10%, rgba(148,163,184,0.12) 90%, transparent 100%)",
              }}
            />
            {/* الخط المكتمل (حتى المرحلة النشطة) */}
            <div
              className="absolute top-6 left-0 h-px transition-all duration-1000"
              style={{
                width: `${((activePhase - 1) / (TIMELINE_PHASES.length - 1)) * 100}%`,
                background:
                  "linear-gradient(90deg, #e62b1e, rgba(230,43,30,0.3))",
              }}
            />
          </div>

          {/* الشبكة */}
          <motion.div
            className="grid grid-cols-11 gap-2"
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {TIMELINE_PHASES.map((phase) => (
              <DesktopPhaseCard
                key={phase.id}
                phase={phase}
                isActive={phase.id === activePhase}
              />
            ))}
          </motion.div>

          {/* بطاقة تفاصيل المرحلة النشطة */}
          <motion.div
            className="mt-12 max-w-2xl mx-auto"
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
            whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#e62b1e]/10 flex items-center justify-center text-[#e62b1e]">
                  {TIMELINE_PHASES[activePhase - 1].icon}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-[15px]">
                    {TIMELINE_PHASES[activePhase - 1].title}
                  </h4>
                  <span className="text-[12px] text-slate-500">
                    {TIMELINE_PHASES[activePhase - 1].date ||
                      TIMELINE_PHASES[activePhase - 1].dateRange}
                  </span>
                </div>
              </div>
              <p className="text-slate-400/70 text-[14px] leading-relaxed mb-3">
                {TIMELINE_PHASES[activePhase - 1].description}
              </p>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[11px] font-semibold text-[#e62b1e]/80 whitespace-nowrap">
                  نتوقع منك:
                </span>
                <p className="text-[13px] text-slate-400/60 leading-relaxed">
                  {TIMELINE_PHASES[activePhase - 1].whatToExpect}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}