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
            className="group relative lg:col-span-2 rounded-3xl bg-white border border-black/[0.06] overflow-hidden cursor-pointer
              hover:border-black/[0.1] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)]
              hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <Link href="/venue" className="absolute inset-0 z-20" />

            {/* توهج خلفي */}
            <div
              className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.04), transparent 60%)",
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 md:p-10 gap-6">
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0
                    bg-gradient-to-br from-red-50 to-rose-50 text-[#e62b1e] group-hover:scale-105 transition-transform duration-400">
                    <MapPin className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-[22px] text-zinc-900 leading-[1.25] tracking-[-0.01em] group-hover:text-[#e62b1e] transition-colors duration-300">
                    {venueTitle || "المكان اللي يجمعنا"}
                  </h3>
                </div>
                <p className="text-sm text-zinc-500 leading-[1.7]">
                  {venueTeaser || "دبي وجهتنا هذا العام، مكان يلفّ الإبداع من كل الجهات. الكل مرحب به، سواء شارك بفكرة أو جاء يلهم ويستلهم."}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e62b1e] mt-1
                  opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0
                  transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
                  تفضل وشوف المكان
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-[3px] transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </span>
              </div>

              {/* صورة توضيحية */}
              <div className="w-full max-w-[280px] aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-rose-100 flex-shrink-0">
                <img
                  src="/mock/venue-preview.svg"
                  alt=""
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[600ms]"
                />
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
  {/* الأيقونة والعنوان في سطر واحد */}
  <div className="flex flex-row items-center gap-3">
    <div className="w-fit p-2.5 bg-red-50 rounded-full">
      <Sparkles className="w-6 h-6 text-red-600" />
    </div>
    <h3 className="text-2xl font-bold text-black group-hover:text-red-600 transition-colors">
      {activationsTitle || "فعاليات بتنوّع الأفكار"}
    </h3>
  </div>
  {/* الوصف يبقى أسفل السطر الأول */}
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