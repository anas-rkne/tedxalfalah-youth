"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

interface CountdownProps {
  targetDate: string; // ISO date string
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const difference = new Date(targetDate).getTime() - Date.now();
  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function Countdown({ targetDate }: CountdownProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("countdown");
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(targetDate)
  );
  const [justFinished, setJustFinished] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setMounted(true);
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = calculateTimeLeft(targetDate);
        if (prev && !next) {
          setJustFinished(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) return <div className="h-24" />;

  if (!timeLeft) {
    return (
      <motion.p
        className="text-3xl md:text-5xl font-bold text-red-600 drop-shadow-md"
        role="status"
        animate={
          !shouldReduceMotion && justFinished
            ? { scale: [1, 1.3, 0.9, 1] }
            : {}
        }
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {t("live")}
      </motion.p>
    );
  }

  // دالة لتحويل رقم إلى مصفوفة من الأرقام (مع محاذاة لليسار)
  const getDigits = (value: number, length: number) => {
    return String(value).padStart(length, "0").split("");
  };

  // ترتيب الوحدات كما في التصميم: Days (3 أرقام) -> Hours (2) -> Minutes (2) -> Seconds (2)
  const units = [
    { label: t("days"), value: timeLeft.days, digits: 3 },
    { label: t("hours"), value: timeLeft.hours, digits: 2 },
    { label: t("minutes"), value: timeLeft.minutes, digits: 2 },
    { label: t("seconds"), value: timeLeft.seconds, digits: 2 },
  ];

  return (
    <motion.div
      className="flex flex-wrap justify-center items-start gap-x-2 md:gap-x-4 gap-y-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
      aria-live="polite"
      aria-label={t("ariaLabel")}
      role="timer"
    >
      {units.map((unit, index) => {
        const digitsArray = getDigits(unit.value, unit.digits);

        return (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="flex items-center gap-1 md:gap-2">
              {/* عرض الصناديق بناءً على عدد الأرقام المطلوبة */}
              {digitsArray.map((digit, i) => (
                <div
                  key={i}
                  className="relative w-9 h-13 md:w-12 md:h-17 bg-[#181818] rounded-sm overflow-hidden flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-gray-800"
                >
                  {/* خط المنتصف الأبيض */}
                  <div className="absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 bg-white/40 shadow-[0_0_6px_rgba(220,38,38,0.2)] blur-[0.5px]" />
                   <motion.span
                    key={digit}
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="relative z-10 text-xl md:text-3xl font-bold text-white antialiased"
                  >
                    {digit}
                  </motion.span>
                </div>
              ))}

              {/* النقاط الحمراء الفاصلة بين الوحدات (باستثناء الوحدة الأخيرة) */}
              {index < units.length - 1 && (
                <div className="flex flex-col justify-center items-center gap-1 px-1 md:px-2 text-red-600 font-bold text-lg md:text-3xl leading-none">
                  <span>:</span>
                </div>
              )}
            </div>

            {/* تسمية الوحدة */}
            <span className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider mt-2 md:mt-3 text-center w-full">
              {unit.label}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}