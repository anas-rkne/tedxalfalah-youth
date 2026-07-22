"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import SectionBadge from "@/components/ui/SectionBadge";

/* ═══════════════════════════════════════════════════════════════
   أنواع البيانات
   ═══════════════════════════════════════════════════════════════ */
interface TimelinePhase {
  id: number;
  title: string;
  date?: string;
  dateRange?: string;
  description: string;
  whatToExpect: string;
  icon: React.ReactNode;
}

interface ApplyTimelineProps {
  title: string;          // عنوان القسم: "رحلة التقديم"
  expectLabel: string;    // "نتوقع منك:"
  phases: TimelinePhase[]; // مصفوفة المراحل المترجمة
  activePhase?: number;   // المرحلة النشطة (افتراضي 1)
}

/* ═══════════════════════════════════════════════════════════════
   شارة عنوان القسم
   ═══════════════════════════════════════════════════════════════ */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <SectionBadge>{title}</SectionBadge>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   بطاقة مرحلة — عمودية (موبايل)
   ═══════════════════════════════════════════════════════════════ */
function MobilePhaseCard({
  phase,
  isLast,
  expectLabel,
}: {
  phase: TimelinePhase;
  isLast: boolean;
  expectLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isFirst = phase.id === 1;

  return (
    <div className="relative pl-8">
      {/* الخط الرأسي */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-gradient-to-b from-border/80 to-transparent" />
      )}

      {/* الدائرة */}
      <div
        className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
          isFirst
            ? "bg-tedx-red border-tedx-red text-white shadow-[0_0_12px_rgba(230,43,30,0.3)]"
            : "bg-background border-border text-muted-foreground"
        }`}
      >
        {phase.id}
      </div>

      {/* المحتوى */}
      <div
        className={`pb-6 rounded-2xl border transition-all duration-300 ${
          isFirst
            ? "bg-tedx-red/5 border-tedx-red/10"
            : "bg-transparent border-transparent hover:bg-muted/30 hover:border-border"
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-start justify-between gap-3 text-start p-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-muted-foreground">{phase.icon}</span>
              <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
                {phase.date || phase.dateRange}
              </span>
            </div>
            <h3
              className={`text-[15px] font-semibold leading-snug ${
                isFirst ? "text-white" : "text-foreground"
              }`}
            >
              {phase.title}
            </h3>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="mt-1 text-muted-foreground flex-shrink-0"
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
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
              {phase.description}
            </p>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border">
              <span className="text-[11px] font-semibold text-tedx-red whitespace-nowrap mt-0.5">
                {expectLabel}
              </span>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
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
            ? "bg-tedx-red text-white shadow-[0_0_20px_rgba(230,43,30,0.25)]"
            : "bg-background text-muted-foreground border border-border group-hover:border-muted-foreground/30"
        }`}
      >
        <span className="text-sm font-bold">{phase.id}</span>
        {isActive && (
          <span className="absolute inset-0 rounded-full animate-ping bg-tedx-red/20" />
        )}
      </div>

      {/* التاريخ */}
      <span className="text-[11px] font-medium text-muted-foreground tracking-wide mb-2">
        {phase.date || phase.dateRange}
      </span>

      {/* العنوان */}
      <h3
        className={`text-[13px] font-semibold leading-snug mb-2 transition-colors duration-300 ${
          isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {phase.title}
      </h3>

      {/* الوصف — يظهر عند hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-[140px]">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {phase.description}
        </p>
      </div>

      {/* الأيقونة */}
      <div className="mt-2 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
        {phase.icon}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   المكون الرئيسي
   ═══════════════════════════════════════════════════════════════ */
export default function ApplyTimeline({
  title,
  expectLabel,
  phases,
  activePhase = 1,
}: ApplyTimelineProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <SectionHeader title={title} />

        {/* النسخة الموبايل — عمودية */}
        <div className="md:hidden">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.id}
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <MobilePhaseCard
                phase={phase}
                isLast={index === phases.length - 1}
                expectLabel={expectLabel}
              />
            </motion.div>
          ))}
        </div>

        {/* النسخة الديسكتوب — أفقية */}
        <div className="hidden md:block">
          {/* الخط الرئيسي */}
          <div className="relative mb-12">
            <div
              className="absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"
            />
            {/* الخط المكتمل (حتى المرحلة النشطة) */}
            <div
              className="absolute top-6 left-0 h-px transition-all duration-1000"
              style={{
                width: `${((activePhase - 1) / (phases.length - 1)) * 100}%`,
                background:
                  "linear-gradient(90deg, #e62b1e, rgba(230,43,30,0.2))",
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
            {phases.map((phase) => (
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
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-tedx-red/10 flex items-center justify-center text-tedx-red">
                  {phases[activePhase - 1].icon}
                </div>
                <div>
                  <h4 className="text-foreground font-semibold text-[15px]">
                    {phases[activePhase - 1].title}
                  </h4>
                  <span className="text-[12px] text-muted-foreground">
                    {phases[activePhase - 1].date || phases[activePhase - 1].dateRange}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-[14px] leading-relaxed mb-3">
                {phases[activePhase - 1].description}
              </p>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border">
                <span className="text-[11px] font-semibold text-tedx-red whitespace-nowrap">
                  {expectLabel}
                </span>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {phases[activePhase - 1].whatToExpect}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}