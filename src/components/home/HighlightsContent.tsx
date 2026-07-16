"use client";

import { motion, Variants } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { MapPin, Sparkles, Users } from "lucide-react";
import AnimatedStats from "@/components/home/AnimatedStats";

interface HighlightsContentProps {
  venueTitle: string;
  venueTeaser: string;
  activationsTitle: string;
  activationsTeaser: string;
  stats: Array<{ label: string; targetValue: number; suffix: string }>;
}

export default function HighlightsContent({
  venueTitle,
  venueTeaser,
  activationsTitle,
  activationsTeaser,
  stats,
}: HighlightsContentProps) {
  // تعريف تأثيرات الظهور المتتالي
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-white pt-20 pb-16 dark:bg-black overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 flex flex-col items-center">
        {/* عنوان القسم */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white">
            أبرز النقاط
          </h2>
          <p className="text-gray-500 mt-4 text-lg font-light max-w-2xl mx-auto dark:text-gray-400">
            اكتشف المكان، الفعاليات، وأرقام الحدث التي تجعل تجربتك فريدة.
          </p>
        </div>

        {/* شبكة البطاقات (تخطيط الصورة تماماً) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full"
        >
          {/* 1. البطاقة الكبيرة (المكان) - تحتل 2/3 من الشاشة */}
          <motion.div
            variants={cardVariants}
            className="relative lg:col-span-2 overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 via-white to-red-100/40 dark:from-red-950/10 dark:via-black dark:to-red-900/20 border border-red-200/30 dark:border-red-900/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-6"
          >
            <Link href="/venue" className="absolute inset-0 z-10" />
            <div className="z-20 flex flex-col gap-4 flex-1 w-full lg:w-3/5">
              <div className="w-fit p-3 bg-red-100 dark:bg-red-900/40 rounded-full">
                <MapPin className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-black dark:text-white group-hover:text-red-600 transition-colors">
                {venueTitle}
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                {venueTeaser}
              </p>
            </div>
            <div className="z-20 flex-1 w-full lg:w-2/5 flex justify-center lg:justify-end">
              <div className="relative w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-red-500 to-red-200 opacity-20 group-hover:opacity-30 transition-opacity blur-xl flex items-center justify-center">
                <MapPin className="w-24 h-24 text-red-600/80 dark:text-red-400/80 relative z-10 drop-shadow-xl" />
              </div>
            </div>
          </motion.div>

          {/* 2. البطاقة الصغيرة (الفعاليات) - تحتل 1/3 من الشاشة */}
          <motion.div
            variants={cardVariants}
            className="relative lg:col-span-1 overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 via-white to-red-100/40 dark:from-red-950/10 dark:via-black dark:to-red-900/20 border border-red-200/30 dark:border-red-900/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group p-8 flex flex-col items-start justify-between"
          >
            <Link href="/activations" className="absolute inset-0 z-10" />
            <div className="z-20 flex flex-col gap-4 w-full">
              <div className="w-fit p-3 bg-red-100 dark:bg-red-900/40 rounded-full">
                <Sparkles className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white group-hover:text-red-600 transition-colors">
                {activationsTitle}
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {activationsTeaser}
              </p>
            </div>
            <div className="mt-6 w-full">
              <div className="relative w-full h-32 rounded-xl bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center border border-red-200/30 dark:border-red-800/30">
                <Sparkles className="w-12 h-12 text-red-400/80 dark:text-red-500/80" />
              </div>
            </div>
          </motion.div>

          {/* 3. البطاقة السفلية العريضة (الإحصائيات) - تحتل 3/3 من الشاشة */}
          <motion.div
            variants={cardVariants}
            className="relative lg:col-span-3 overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 via-white to-red-100/40 dark:from-red-950/10 dark:via-black dark:to-red-900/20 border border-red-200/30 dark:border-red-900/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group p-8 md:p-12"
          >
            <div className="z-20 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex flex-col gap-2">
                <div className="w-fit p-3 bg-red-100 dark:bg-red-900/40 rounded-full">
                  <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-black dark:text-white">
                  حدث بحجم تأثيرك
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400 max-w-lg">
                  نحن نجمع بين العقول الشابة والخبراء لنصنع تأثيرًا مستدامًا.
                </p>
              </div>
              <div className="flex-1 w-full flex justify-end">
                <AnimatedStats stats={stats} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}