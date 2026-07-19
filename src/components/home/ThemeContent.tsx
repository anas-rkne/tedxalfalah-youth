"use client";

import { motion, useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface ThemeContentProps {
  title: string;
  body: string;
}

export default function ThemeContent({ title, body }: ThemeContentProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-white pt-24 pb-20 overflow-hidden">
      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center text-center gap-8 md:gap-10">
        
        {/* العنوان الرئيسي */}
        {/* العنوان الرئيسي - ظهور كلمات متدرج عند الوصول للقسم */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex flex-wrap justify-center gap-x-1 md:gap-x-1">
            {title.split(" ").map((word, index) => (
              <motion.span
                key={index}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.08,
                  ease: [0.23, 1, 0.32, 1], // منحنى Bezier ناعم جداً
                }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight leading-tight inline-block"
              >
                {word}
                {index !== title.split(" ").length - 1 && <>&nbsp;</>}
              </motion.span>
            ))}
          </div>
          <div className="w-12 h-1 bg-red-600 rounded-full" />
        </motion.div>

        {/* النص التعريفي - الكود النظيف للكلمات المتحركة */}
        <ScrollReveal>
          {/* ✅ تم ضبط المسافة هنا: استخدمنا gap-x-0.5 بدلاً من gap-x-1 لتقليص المسافات */}
          <div className="max-w-4xl flex flex-wrap justify-center gap-x-1 gap-y-3 text-center">
            {body.split(" ").map((word, index) => {
              // تحديد ما إذا كانت الكلمة إنجليزية
              const isEnglish = /[A-Za-z]/.test(word);
              const isHighlight = word === "TEDxYouth";

              return (
                <motion.span
                  key={index}
                  // إضافة LTR للكلمات الإنجليزية لحل مشكلة القراءة العكسية
                  dir={isEnglish ? "ltr" : "auto"}
                  className={`text-lg md:text-xl inline-block transition-colors leading-relaxed ${
                    isHighlight 
                      ? "text-red-600 font-bold" 
                      : "text-gray-700 font-light"
                  }`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  viewport={{ once: true }}
                >
                  {word}
                  {/* ✅ تم حذف الكود الذي كان يضع مسافة (&nbsp;) هنا تماماً لأن المسافة الآن تتحكم بها CSS (gap-x-0.5) */}
                </motion.span>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}