"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Check, ArrowLeft, Home, Calendar, Mail, Users } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";

interface ThankYouContentProps {
  headerSubtitle: string;
  brandLabel: string;
  stepper1: string;
  stepper2: string;
  stepper3: string;
  verticalLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  stat1: string;
  stat2: string;
  stat3: string;
  cta: string;
  secondaryCta: string;
  ctaHref: string;
  footerHashtag: string;
  footerDate: string;
  footerContact: string;
}

function AnimatedCheckIcon() {
  return (
    <div className="relative flex justify-center items-center">
      <div className="w-[380px] h-[380px] border border-tedx-red/30 rounded-full flex justify-center items-center relative scale-75 lg:scale-100">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="w-[300px] h-[300px] rounded-full flex justify-center items-center"
          style={{ background: "radial-gradient(circle, rgba(230,43,30,0.2) 0%, transparent 70%)" }}
        >
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Check className="w-[120px] h-[120px] text-tedx-red stroke-[3]" />
          </motion.div>
        </motion.div>
        <div className="absolute top-[20%] right-[10%] w-3 h-3 bg-tedx-red rounded-full" />
        <div className="absolute bottom-[15%] left-[15%] w-5 h-5 border-2 border-tedx-red rounded-full" />
      </div>
    </div>
  );
}

function StatPill({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-2.5 text-[14px] text-white"
    >
      <div className="w-2 h-2 bg-tedx-red rounded-full shrink-0" />
      <span>{label}</span>
    </motion.div>
  );
}

function Stepper({ s1, s2, s3 }: { s1: string; s2: string; s3: string }) {
  const steps = [
    { id: 1, label: s1, status: "completed" },
    { id: 2, label: s2, status: "completed" },
    { id: 3, label: s3, status: "active" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-2 mb-10 w-full max-w-[400px]"
    >
      {steps.map((step) => (
        <div key={step.id} className="flex flex-col gap-2 flex-1">
          <div className={`h-[2px] w-full ${step.status === 'completed' || step.status === 'active' ? 'bg-tedx-red' : 'bg-white/20'}`} />
          <span className={`text-[11px] uppercase tracking-[1px] font-bold ${step.status === 'active' ? 'text-white' : step.status === 'completed' ? 'text-tedx-red' : 'text-white/40'}`}>
            {step.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

export default function ThankYouContent({
  headerSubtitle,
  brandLabel,
  stepper1,
  stepper2,
  stepper3,
  verticalLabel,
  eyebrow,
  title,
  body,
  stat1,
  stat2,
  stat3,
  cta,
  secondaryCta,
  ctaHref,
  footerHashtag,
  footerDate,
  footerContact,
}: ThankYouContentProps) {
  const { isRTL } = useRTL();

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col selection:bg-tedx-red selection:text-white" dir={isRTL ? "rtl" : "ltr"}>
      {/* إخفاء الـ Footer العام للموقع */}
      <style>{`#global-footer { display: none !important; }`}</style>

      {/* Background Accent X */}
      <div className="absolute -bottom-[100px] -left-[100px] text-[800px] font-black text-tedx-red opacity-5 leading-none pointer-events-none z-0">
        X
      </div>

      {/* Vertical Label */}
      <div className="hidden lg:block absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-[10px] text-white/30 tracking-[3px] uppercase whitespace-nowrap z-10 origin-center">
        {verticalLabel}
      </div>

      {/* Header */}
      <header className="h-[100px] px-6 lg:px-[60px] flex items-center justify-between border-b border-white/10 z-10 shrink-0">
        <div className="text-[28px] font-black tracking-[-1px]" dir="ltr">
          TED<span className="text-tedx-red">x</span> {brandLabel}
        </div>
        <div className="text-[14px] opacity-60 text-end">
          {headerSubtitle}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] px-6 lg:px-[60px] items-center z-10 pb-[60px] overflow-y-auto lg:overflow-hidden">
        {/* Left Column (Hero Text Area) */}
        <div className="pt-10 lg:pt-0 lg:pb-10">
          <Stepper s1={stepper1} s2={stepper2} s3={stepper3} />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[48px] lg:text-[88px] font-black leading-[0.9] tracking-[-2px] mb-6 whitespace-pre-line"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-[20px] text-zinc-400 leading-[1.6] mb-10 max-w-[500px]"
          >
            {body}
          </motion.p>

          <div className="flex flex-wrap items-center gap-3 mb-12">
            <StatPill label={stat1} delay={0.6} />
            <StatPill label={stat2} delay={0.7} />
            <StatPill label={stat3} delay={0.8} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex flex-wrap items-center gap-6"
          >
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-tedx-red text-white font-bold text-base border border-tedx-red transition-all duration-300 hover:bg-tedx-red/90 hover:border-tedx-red/90 focus:outline-none focus:ring-2 focus:ring-tedx-red focus:ring-offset-2"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
              {cta}
            </Link>
            <Link
              href="/schedule"
              className="text-white/60 text-[14px] border-b border-white/20 pb-1 hover:text-white hover:border-white transition-all duration-300"
            >
              {secondaryCta}
            </Link>
          </motion.div>
        </div>

        {/* Right Column (Visual Area) */}
        <div className="relative flex justify-center items-center py-10 lg:py-0">
          <AnimatedCheckIcon />
        </div>
      </main>

      {/* Footer Rail */}
      <div className="absolute bottom-0 left-0 w-full bg-black border-t border-zinc-800/60 overflow-hidden z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[80px] bg-tedx-red/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="h-[60px] flex items-center px-6 lg:px-[60px] justify-between text-xs text-zinc-500 relative z-10 overflow-x-auto lg:overflow-visible" dir="ltr">
          <span className="whitespace-nowrap shrink-0">{footerHashtag}</span>
          <span className="whitespace-nowrap shrink-0 ml-6 lg:ml-0">{footerDate}</span>
          <span className="whitespace-nowrap shrink-0 ml-6 lg:ml-0">{footerContact}</span>
        </div>
      </div>
    </div>
  );
}
