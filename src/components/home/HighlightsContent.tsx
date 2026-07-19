"use client";

import { motion, Variants } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { MapPin, Sparkles, Users } from "lucide-react";
import AnimatedStats from "@/components/home/AnimatedStats";

interface HighlightsContentProps {
  venueTitle?: string;
  venueTeaser?: string;
  activationsTitle?: string;
  activationsTeaser?: string;
  stats?: Array<{ label: string; targetValue: number; suffix: string }>;
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
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-white pt-20 pb-16 overflow-hidden">
      <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 flex flex-col items-center">
        
        {/* عنوان القسم ونص ترحيبي إماراتي */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">
            أبرز النقاط
          </h2>
          <div className="w-12 h-1 bg-red-600 mx-auto mt-4 rounded-full" />
          <p className="text-gray-500 mt-6 text-lg font-light max-w-2xl mx-auto leading-relaxed">
            عندك أسئلة أو أفكار أو بس تبي تقول مرحبا؟ بنحب نسمع منك. 
            وتعال اكتشف المكان، الفعاليات، والأرقام اللي تجعل هالحدث فريد.
          </p>
        </div>

        {/* شبكة البطاقات */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full"
        >
          
          {/* ========================================== */}
          {/* ✅ 1. بطاقة المكان (تمت إزالة الحدود الحمراء) */}
          {/* ========================================== */}
          <motion.div
            variants={cardVariants}
            className="relative lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
          >
            <Link href="/venue" className="absolute inset-0 z-20" />

            {/* عنصر ديكور (أيقونة ضخمة جداً في الخلفية) */}
            <div className="absolute -right-12 -bottom-12 z-0 pointer-events-none select-none hidden lg:block">
              <MapPin className="w-64 h-64 text-red-600/5 transform rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 md:p-10 gap-6">
              {/* قسم المعلومات */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-row items-center gap-3">
                  <div className="flex-shrink-0 p-2.5 bg-red-50 rounded-full">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                  {/* ⭐ نص إماراتي افتراضي */}
                  <h3 className="text-3xl md:text-4xl font-bold text-black group-hover:text-red-600 transition-colors">
                    {venueTitle || "المكان اللي يجمعنا"}
                  </h3>
                </div>
                {/* ⭐ نص إماراتي افتراضي */}
                <p className="text-base text-gray-600 leading-relaxed max-w-lg border-l-2 border-gray-200 pl-4">
                  {venueTeaser || "دبي وجهتنا هذا العام، مكان يلفّ الإبداع من كل الجهات. الكل مرحب به، سواء شارك بفكرة أو جاء يلهم ويستلهم."}
                </p>
                <span className="inline-flex items-center gap-2 text-red-600 font-semibold text-sm mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                  تفضل وشوف المكان
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </span>
              </div>

              {/* أيقونة للموبايل تختفي في الشاشات الكبيرة */}
              <div className="lg:hidden block w-fit">
                 <MapPin className="w-12 h-12 text-red-500/20" />
              </div>
            </div>
          </motion.div>

          {/* ========================================== */}
          {/* ✅ 2. بطاقة الفعاليات (أسلوب نظيف) */}
          {/* ========================================== */}
          <motion.div
            variants={cardVariants}
            className="relative lg:col-span-1 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group p-8 flex flex-col items-start justify-between"
          >
            <Link href="/activations" className="absolute inset-0 z-10" />
            <div className="z-20 flex flex-col gap-4 w-full">
              <div className="w-fit p-2.5 bg-red-50 rounded-full">
                <Sparkles className="w-6 h-6 text-red-600" />
              </div>
              {/* ⭐ نص إماراتي افتراضي */}
              <h3 className="text-2xl font-bold text-black group-hover:text-red-600 transition-colors">
                {activationsTitle || "فعاليات بتنوّع الأفكار"}
              </h3>
              {/* ⭐ نص إماراتي افتراضي */}
              <p className="text-base text-gray-600 leading-relaxed">
                {activationsTeaser || "جلسات حوارية وأفكار جديدة، تشجع الكل يعبر عن رأيه ويشارك حلمه. المرح والفائدة ضيوفنا في كل زاوية."}
              </p>
            </div>
            {/* شريط سفلي رمادي يتحول لأحمر خفيف عند التمرير */}
            <div className="mt-4 w-full h-1 bg-gray-100 rounded-full group-hover:bg-red-500/40 transition-colors duration-300" />
          </motion.div>

          {/* ========================================== */}
          {/* ✅ 3. بطاقة الإحصائيات (إزالة الحدود العلوية الحمراء) */}
          {/* ========================================== */}
          <motion.div
            variants={cardVariants}
            className="relative lg:col-span-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8"
          >
            <div className="flex flex-col gap-2 w-full lg:w-2/5">
              <div className="flex items-center gap-3">
                <div className="w-fit p-2.5 bg-red-50 rounded-full">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
                {/* ⭐ نص إماراتي افتراضي */}
                <h3 className="text-2xl font-bold text-black">
                  حدث بحجم طموحنا
                </h3>
              </div>
              {/* ⭐ نص إماراتي افتراضي */}
              <p className="text-base text-gray-600 max-w-md">
                نحن نجمع العقول الشبابية والخبرات عشان نصنع أثر حقيقي بالمجتمع. الكل يختار إنه يكون جزء من هالشيء.
              </p>
            </div>
            
            {/* العداد الإحصائي */}
            <div className="flex-1 w-full lg:w-3/5 flex justify-end">
              <div className="bg-black rounded-xl p-4 md:p-6 w-full border border-gray-800 rounded-xl p-4 md:p-6 w-full border border-gray-200">
                <AnimatedStats stats={stats || []} />
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}