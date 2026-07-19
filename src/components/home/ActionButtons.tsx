"use client";

import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

interface ActionButtonsProps {
  applyLabel: string;
  ticketsLabel: string;
}

export default function ActionButtons({
  applyLabel,
  ticketsLabel,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-row flex-nowrap items-center justify-center gap-2 sm:gap-4  w-full max-w-xs sm:max-w-sm mx-auto">
      {/* زر Apply - أحمر افتراضي */}
      <AnimatedSlidingButton href="/apply" variant="primary" className="flex-1">
        {applyLabel}
      </AnimatedSlidingButton>

      {/* زر Tickets - تم تحويله إلى الأسود باستخدام className */}
      <AnimatedSlidingButton
        href="/tickets"
        variant="primary" // استخدام primary وتجاوزه بالأسود هو الأكثر أماناً
        className="bg-black text-white border-black hover:bg-gray-900 flex-1"
      >
        {ticketsLabel}
      </AnimatedSlidingButton>
    </div>
  );
}