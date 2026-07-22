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
    <div className="flex flex-row flex-nowrap items-center justify-center gap-2 sm:gap-4 w-full max-w-xs sm:max-w-sm mx-auto">
      {/* زر Apply - أحمر أساسي (Primary) */}
      <AnimatedSlidingButton href="/apply" variant="primary" className="flex-1">
        {applyLabel}
      </AnimatedSlidingButton>

      {/* زر Tickets - أزرق/أسود (استخدام متغيرات CSS الموحدة بدلاً من الألوان الثابتة) */}
      <AnimatedSlidingButton
        href="/tickets"
        variant="primary"
        className="bg-[var(--color-tedx-black)] text-white border-[var(--color-tedx-black)] hover:bg-[var(--color-tedx-black)]/90 flex-1"
      >
        {ticketsLabel}
      </AnimatedSlidingButton>
    </div>
  );
}