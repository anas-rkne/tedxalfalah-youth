"use client";

import { motion, Variants } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { MapPin, Star, Users, ArrowUpRight, TrendingUp, Calendar, Mic } from "lucide-react";
import AnimatedStats from "@/components/home/AnimatedStats";
import { useRTL } from "@/hooks/useRTL";
import SectionBadge from "@/components/ui/SectionBadge"; // ✅ المكون الموحد
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton"; // ✅ استخدام الزر الموحد للبطاقة الحمراء

interface HighlightsContentProps {
  mainHeading: string;
  mainSubtitle: string;
  venueTitle: string;
  venueTeaser: string;
  venueBadgeText: string;
  venueLinkText: string;
  activationsTitle: string;
  activationsTeaser: string;
  activationsBadgeText: string;
  activationsLinkText: string;
  statsBadgeText: string;
  statsTitle: string;
  statsDescription: string;
  dateBadgeText: string;
  dateNumber: string;
  dateMonthYear: string;
  dateDescription: string;
  speakerBadgeText: string;
  speakerTitle: string;
  speakerDescription: string;
  speakerCta: string;
  stats?: Array<{ label: string; targetValue: number; suffix: string }>;
}

/* ═══════════════════════════════════════════════════════════════
   تأثيرات الظهور المتتالي
   ═══════════════════════════════════════════════════════════════ */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] },
  },
};

/* ═══════════════════════════════════════════════════════════════
   مكون سهم الرابط
   ═══════════════════════════════════════════════════════════════ */
function ArrowLink({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-tedx-red mt-2
      opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0
      transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
      {text}
      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-[3px] group-hover:-translate-y-[3px] transition-transform duration-300" />
    </span>
  );
}

export default function HighlightsContent({
  mainHeading,
  mainSubtitle,
  venueTitle,
  venueTeaser,
  venueBadgeText,
  venueLinkText,
  activationsTitle,
  activationsTeaser,
  activationsBadgeText,
  activationsLinkText,
  statsBadgeText,
  statsTitle,
  statsDescription,
  dateBadgeText,
  dateNumber,
  dateMonthYear,
  dateDescription,
  speakerBadgeText,
  speakerTitle,
  speakerDescription,
  speakerCta,
  stats,
}: HighlightsContentProps) {
  const { isRTL } = useRTL(); // ✅ فقط لعكس اتجاهات بسيطة إذا لزم الأمر

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      
      {/* ═══════════════════════════════════════════════════════════════
          HEADER — عنوان القسم
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative pb-12 md:pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 max-w-5xl mx-auto text-center">
          {/* ✅ الشارة الموحدة */}
          <div className="flex justify-center mb-4">
            <SectionBadge>
              {mainHeading} {/* يمكنك تمرير "Highlights" من الترجمة */}
            </SectionBadge>
          </div>

          <h2 className="heading-h1 tracking-[-0.03em] mt-5 heading-margin">
            {mainHeading}
          </h2>

          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-border" />
            <div className="h-1 w-14 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
            <div className="h-px w-10 bg-border" />
          </div>
          
          <p className="text-muted-foreground mt-6 text-lg font-light max-w-2xl mx-auto leading-relaxed" dir={isRTL ? "rtl" : "ltr"}>
            {mainSubtitle}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BENTO GRID — الشبكة الرئيسية
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative pb-24 md:pb-32">
        <div className="container-padding max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {/* ═══════ 1. بطاقة المكان — كبيرة (تشغل عمودين) ═══════ */}
            <motion.div
              variants={cardVariants}
              className="group relative md:col-span-2 rounded-[24px] bg-card border border-border overflow-hidden cursor-pointer
                hover:border-tedx-red/20 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]
                hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              <Link href="/venue" className="absolute inset-0 z-20" />

              <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.05), transparent 60%)" }}
              />

              <div className="relative z-10 flex flex-col lg:flex-row items-stretch">
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center gap-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-tedx-red/10 text-tedx-red flex items-center justify-center
                      group-hover:scale-105 transition-transform duration-400 shadow-sm">
                      <MapPin className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <SectionBadge>
                      {venueBadgeText}
                    </SectionBadge>
                  </div>

                  <h3 className="font-bold text-2xl md:text-3xl text-foreground tracking-[-0.02em] leading-tight
                    group-hover:text-tedx-red transition-colors duration-300">
                    {venueTitle}
                  </h3>

                  <p className="text-sm md:text-base text-muted-foreground leading-[1.8] max-w-md">
                    {venueTeaser}
                  </p>

                  <ArrowLink text={venueLinkText} />
                </div>

                {/* الصورة - تأكد من توفير الصورة الفعلية في `public/` */}
                <div className="lg:w-[45%] relative min-h-[240px] lg:min-h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 m-6 rounded-2xl overflow-hidden">
                    <img
                      src="/images/venue-preview.jpg"
                      alt={venueTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ═══════ 2. بطاقة الفعاليات — عمود واحد ═══════ */}
            <motion.div
              variants={cardVariants}
              className="group relative rounded-[24px] bg-card border border-border overflow-hidden cursor-pointer
                hover:border-tedx-red/20 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]
                hover:-translate-y-1 transition-all duration-500 p-8 flex flex-col justify-between"
            >
              <Link href="/activations" className="absolute inset-0 z-20" />

              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center
                    group-hover:scale-105 transition-transform duration-400 shadow-sm">
                <Star className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <SectionBadge>
                    {activationsBadgeText}
                  </SectionBadge>
                </div>

                <h3 className="font-bold text-xl md:text-2xl text-foreground tracking-[-0.02em] leading-tight
                  group-hover:text-tedx-red transition-colors duration-300">
                  {activationsTitle}
                </h3>

                <p className="text-sm text-muted-foreground leading-[1.8]">
                  {activationsTeaser}
                </p>

                <ArrowLink text={activationsLinkText} />
              </div>

              <div className="mt-6 h-[3px] w-full bg-border rounded-full overflow-hidden">
                <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-tedx-red to-red-400 rounded-full transition-all duration-700 ease-out" />
              </div>
            </motion.div>

            {/* ═══════ 3. بطاقة الإحصائيات — تشغل 3 أعمدة ═══════ */}
            <motion.div
              variants={cardVariants}
              className="group relative lg:col-span-3 rounded-[24px] bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 overflow-hidden
                hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] hover:-translate-y-1
                transition-all duration-500 p-8 md:p-10"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-tedx-red/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-1 text-center lg:text-start">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm text-white flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <SectionBadge className="bg-white/5 border-white/10 text-white/60">
                      <Users className="w-3 h-3" />
                      {statsBadgeText}
                    </SectionBadge>
                  </div>

                  <h3 className="font-bold text-2xl md:text-3xl text-white tracking-[-0.02em] mb-3">
                    {statsTitle}
                  </h3>
                  <p className="text-sm md:text-base text-zinc-400 leading-[1.8] max-w-lg mx-auto lg:mx-0">
                    {statsDescription}
                  </p>
                </div>

                <div className="flex-1 w-full lg:w-auto">
                  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 md:p-8">
                    <AnimatedStats stats={stats || []} />
                  </div>
                </div>
              </div>
            </motion.div>

                     {/* ═══════ 4. بطاقة إضافية — تاريخ الحدث ═══════ */}
            <motion.div
              variants={cardVariants}
              className="group relative rounded-[24px] bg-card border border-border overflow-hidden cursor-pointer h-full
                hover:border-tedx-red/30 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] /* ✅ حدود حمراء خفيفة عند التمرير */
                hover:-translate-y-1 transition-all duration-500 p-8 flex flex-col justify-between"
            >
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  {/* ✅ تم تغيير الخلفية واللون إلى الأحمر */}
                  <div className="w-12 h-12 rounded-2xl bg-tedx-red/10 text-tedx-red flex items-center justify-center
                    group-hover:scale-105 transition-transform duration-400 shadow-sm">
                    <Calendar className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <SectionBadge>
                    <Calendar className="w-3 h-3" />
                    {dateBadgeText}
                  </SectionBadge>
                </div>

                <div>
                  <div className="text-4xl md:text-5xl font-bold text-foreground tracking-[-0.03em]">{dateNumber}</div>
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1">{dateMonthYear}</div>
                </div>

                <p className="text-sm text-muted-foreground leading-[1.8]">
                  {dateDescription}
                </p>
              </div>

              {/* ✅ تم تغيير لون الشريط من الأخضر إلى الأحمر */}
              <div className="mt-6 h-[3px] w-full bg-border rounded-full overflow-hidden">
                <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-tedx-red to-red-400 rounded-full transition-all duration-700 ease-out" />
              </div>
            </motion.div>

            {/* ═══════ 5. بطاقة إضافية — كن متحدثاً ═══════ */}
            <motion.div
              variants={cardVariants}
              className="group relative md:col-span-2 rounded-[24px] bg-gradient-to-br from-tedx-red to-red-700 border border-red-500/30 overflow-hidden cursor-pointer
                hover:shadow-[0_24px_48px_-12px_rgba(230,43,30,0.3)] hover:-translate-y-1
                transition-all duration-500"
            >
              <Link href="/apply" className="absolute inset-0 z-20" />

              <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
              />

              <div className="relative z-10 p-8 md:p-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center">
                      <Mic className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <SectionBadge className="bg-white/10 border-white/20 text-white/80">
                      {speakerBadgeText}
                    </SectionBadge>
                  </div>

                  <h3 className="font-bold text-2xl md:text-3xl text-white tracking-[-0.02em] mb-3">
                    {speakerTitle}
                  </h3>
                  <p className="text-sm md:text-base text-white/70 leading-[1.8] max-w-lg">
                    {speakerDescription}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {/* ✅ استخدام الزر الموحد AnimatedSlidingButton هنا أيضاً */}
                  <AnimatedSlidingButton href="/apply" variant="primary" className="bg-white text-tedx-red hover:bg-white/90">
                    {speakerCta}
                  </AnimatedSlidingButton>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}