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
  secondaryButton?: {
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
    <div className={`relative w-full ${className}`}>
      <div className="container-padding max-w-4xl mx-auto text-center">
        <FadeUp>
          {/* 
            تمت إزالة `group` – الآن كل تأثير هوفر يتم بشكل مستقل 
            العناصر الزخرفية تستخدم `hover:` مباشرة لتجنب أي تداخل مع الأزرار
          */}
          <div className="p-10 md:p-16 rounded-[32px] bg-black border border-zinc-800/50 text-white relative overflow-hidden text-center shadow-2xl">
            
            {/* 1. العلامة المائية X – تتحرك عند هوفر البطاقة */}
            <div 
              className="absolute -right-12 -bottom-24 text-[320px] font-black text-white/[0.02] leading-none select-none pointer-events-none rotate-12 transition-transform duration-700 ease-out hover:scale-105 hover:-rotate-12 will-change-transform"
              style={{ transition: shouldReduceMotion ? 'none' : undefined }}
            >
              X
            </div>

            {/* 2. النمط الشبكي (بدون أي تأثير هوفر) */}
            <div 
              className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
              style={{ 
                backgroundImage: 'radial-gradient(circle at center, #ffffff 1.5px, transparent 1.5px)', 
                backgroundSize: '32px 32px' 
              }} 
            />

            {/* 3. توهج المسرح – يتغير عند هوفر البطاقة */}
            <div 
              className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-tedx-red/15 rounded-full blur-[120px] pointer-events-none transition-opacity duration-700 hover:opacity-80 will-change-transform"
              style={{ transition: shouldReduceMotion ? 'none' : undefined }}
            />
            <div 
              className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-tedx-red/10 rounded-full blur-[100px] pointer-events-none"
            />

            {/* 4. خط علوي حاد – يظهر عند هوفر البطاقة */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-tedx-red/70 to-transparent opacity-50 transition-opacity duration-700 hover:opacity-100"
              style={{ transition: shouldReduceMotion ? 'none' : undefined }}
            />

            {/* المحتوى النصي */}
            <div className="relative z-10">
              <h2 className="heading-h2 mb-5 text-white tracking-tight drop-shadow-sm">
                {heading}
              </h2>
              <p className="text-zinc-300 max-w-lg mx-auto mb-10 text-lg leading-relaxed font-medium">
                {description}
              </p>

              {/* الأزرار – مستقلة تماماً، كل زر له هوفر خاص به */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {secondaryButton && (
                  <AnimatedSlidingButton
                    href={secondaryButton.href}
                    variant="primary"
                    className={`min-w-[150px] bg-zinc-900/80 backdrop-blur-md border border-zinc-700 text-zinc-300 transition-all duration-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-500 ${secondaryButton.className ?? ""}`}
                  >
                    {secondaryButton.label}
                  </AnimatedSlidingButton>
                )}

                <AnimatedSlidingButton
                  href={primaryButton.href}
                  variant="primary"
                  className={`min-w-[150px] bg-tedx-red text-white border border-transparent shadow-[0_0_40px_-10px_rgba(230,43,30,0.5)] transition-all duration-300 hover:shadow-[0_0_60px_-12px_rgba(230,43,30,0.7)] ${primaryButton.className ?? ""}`}
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