"use client";

import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import { useRTL } from "@/hooks/useRTL";

interface ScheduleBannerContentProps {
  badgeLabel: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export default function ScheduleBannerContent(_props: ScheduleBannerContentProps) {
  const { isRTL } = useRTL();

  const isScheduleReady = false; // غيّرها إلى true عند تفعيل الجدول الفعلي

  if (!isScheduleReady) {
    return null;
  }

  return (
    <section
      className="relative w-full overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* خلفية TEDx — تمتد عرض الصفحة بالكامل */}
      <div className="relative section-padding">
        {/* 1. خلفية داكنة */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-zinc-950" />

        {/* 2. خط علوي TEDx */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tedx-red/30 to-transparent" />

        {/* 3. خط سفلي TEDx */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tedx-red/20 to-transparent" />

        {/* زر الأجندة — عند تفعيل الجدول الفعلي */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <AnimatedSlidingButton
            href="/schedule"
            variant="primary"
            className="min-w-[280px] sm:min-w-[340px] py-4 text-base sm:text-lg"
          >
            See the Agenda
          </AnimatedSlidingButton>
        </div>
      </div>
    </section>
  );
}