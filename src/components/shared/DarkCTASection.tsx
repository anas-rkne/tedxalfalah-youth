// src/components/shared/DarkCTASection.tsx
"use client";

import { useReducedMotion } from "framer-motion";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import FadeUp from "@/components/shared/FadeUp";

interface DarkCTASectionProps {
  heading: string;
  description: string;
  primaryButton: {
    href: string;
    label: string;
    className?: string;
  };
  secondaryButton?: {   // ✅ أصبح اختيارياً
    href: string;
    label: string;
    className?: string;
  };
  className?: string;
}

export default function DarkCTASection({
  heading,
  description,
  primaryButton,
  secondaryButton,
  className = "",
}: DarkCTASectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={` relative ${className}`}>
      <div className="container-padding max-w-4xl mx-auto text-center">
        <FadeUp>
          <div className="p-10 md:p-14 rounded-[32px] bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-tedx-red/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-tedx-red/5 rounded-full blur-2xl" />

            <div className="relative z-10">
              <h2 className="heading-h2 mb-4 text-white">{heading}</h2>
              <p className="text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
                {description}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* الزر الثانوي (اختياري) */}
                {secondaryButton && (
                  <AnimatedSlidingButton
                    href={secondaryButton.href}
                    variant="primary"
                    className={`min-w-[140px] bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30 ${secondaryButton.className ?? ""}`}
                  >
                    {secondaryButton.label}
                  </AnimatedSlidingButton>
                )}

                {/* الزر الأساسي (دائماً موجود) */}
                <AnimatedSlidingButton
                  href={primaryButton.href}
                  variant="primary"
                  className={`min-w-[140px] shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)] ${primaryButton.className ?? ""}`}
                >
                  {primaryButton.label}
                </AnimatedSlidingButton>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}