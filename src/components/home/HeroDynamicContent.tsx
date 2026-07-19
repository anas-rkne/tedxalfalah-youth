"use client";

import { useReducedMotion, motion } from "framer-motion";
import Image from "next/image";
import { useLocale } from "next-intl"; 
import { cn } from "@/lib/utils"; 
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import Countdown from "@/components/shared/Countdown";
import ActionButtons from "@/components/home/ActionButtons";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";

const EVENT_DATE = "2026-11-15T09:00:00+04:00";

interface Props {
  eventName: string;    // اسم الحدث
  tagline: string;      // الشعار (يذهب للـ Typewriter)
  dateText: string;     // التاريخ
  venueText: string;    // المكان
  scrollLabel: string;
  applyLabel: string;
  ticketsLabel: string;
}

export default function HeroDynamicContent({
  eventName,
  tagline,
  dateText,
  venueText,
  scrollLabel,
  applyLabel,
  ticketsLabel,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const locale = useLocale(); // الحصول على اللغة الحالية

  // تحديد هل اللغة هي الإنجليزية أم لا (لعكس الصور عند الحاجة)
  const isEnglish = locale === "en";
  const leftImageFlip = isEnglish ? "scale-x-[-1]" : "";
  const rightImageFlip = isEnglish ? "scale-x-[-1]" : "";

  // ✅ تم إصلاح هذه الكلاسات: إضافة lg:flex-1 و lg:w-auto لضمان عدم اختفاء الصور الجانبية في الشاشات الكبيرة
  const containerClasses = "relative z-10 px-4 flex flex-col items-center gap-8 md:gap-10 min-h-[calc(100vh-80px)] pb-0 justify-center w-full lg:flex-1 lg:w-auto";

  if (shouldReduceMotion) {
    return (
      <BackgroundBeamsWithCollision className="h-full">
        <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl mx-auto px-4">
          {/* 1. الصورة اليسرى (الولد) */}
          <div className="hidden lg:flex flex-shrink-0 lg:w-48 xl:w-80 items-center justify-center">
            <Image
              src="/images/boy-pointing-left.jpg"
              alt="Boy pointing"
              width={300}
              height={400}
              className={cn("w-full h-auto object-contain", leftImageFlip)}
            />
          </div>

          {/* 2. المحتوى المركزي - النصوص الجديدة */}
          <div className={containerClasses}>
            <HeroTypewriterTitle title={tagline} />
            <div className="text-base md:text-lg text-gray-700 max-w-3xl text-center flex flex-col gap-3 leading-relaxed">
              <p className="text-tedx-red dark:text-red-400 font-bold text-lg md:text-xl">
                {eventName}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 text-gray-600 text-base">
                <span>{dateText}</span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span>{venueText}</span>
              </div>
            </div>
            <Countdown targetDate={EVENT_DATE} />
            <ActionButtons applyLabel={applyLabel} ticketsLabel={ticketsLabel} />
          </div>

          {/* 3. الصورة اليمنى (الفتاة) */}
          <div className="hidden lg:flex flex-shrink-0 lg:w-48 xl:w-80 items-center justify-center">
            <Image
              src="/images/girl-pointing-right.jpg"
              alt="Girl pointing"
              width={300}
              height={400}
              className={cn("w-full h-auto object-contain", rightImageFlip)}
            />
          </div>
        </div>
        <ScrollIndicator />
      </BackgroundBeamsWithCollision>
    );
  }

  return (
    <BackgroundBeamsWithCollision className="h-full">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl mx-auto px-4">        
        {/* 1. الصورة اليسرى (الولد) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:flex flex-shrink-0 lg:w-48 xl:w-80 items-center justify-center"
        >
          <Image
            src="/images/boy-pointing-left.jpg"
            alt="Boy pointing"
            width={300}
            height={400}
            className={cn("w-full h-auto object-contain", leftImageFlip)}
          />
        </motion.div>

        {/* 2. المحتوى المركزي */}
        <div className={containerClasses}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
          >
            {/* العنوان المتحرك (الشعار) */}
            <HeroTypewriterTitle title={tagline} />
          </motion.div>
          
          {/* النص الفرعي الجديد (اسم الحدث + التاريخ والمكان) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="text-base md:text-lg text-gray-700 max-w-3xl text-center flex flex-col gap-3 leading-relaxed"
          >
            <p className="text-tedx-red dark:text-red-400 font-bold text-lg md:text-xl">
              {eventName}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 text-gray-600 text-base">
              <span>{dateText}</span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span>{venueText}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
          >
            <Countdown targetDate={EVENT_DATE} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          >
            <ActionButtons applyLabel={applyLabel} ticketsLabel={ticketsLabel} />
          </motion.div>
        </div>

        {/* 3. الصورة اليمنى (الفتاة) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="hidden lg:flex flex-shrink-0 lg:w-48 xl:w-80 items-center justify-center"
        >
          <Image
            src="/images/girl-pointing-right.jpg"
            alt="Girl pointing"
            width={300}
            height={400}
            className={cn("w-full h-auto object-contain", rightImageFlip)}
          />
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
      >
        <ScrollIndicator />
      </motion.div>
    </BackgroundBeamsWithCollision>
  );
}