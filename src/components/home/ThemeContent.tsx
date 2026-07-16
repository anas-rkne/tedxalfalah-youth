"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lightbulb, Rocket, Sparkles } from "lucide-react";
import { TypeAnimation } from "react-type-animation";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface ThemeContentProps {
  title: string;
  body: string;
}

export default function ThemeContent({ title, body }: ThemeContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  // توليد الأيقونات العائمة فقط على العميل لتجنب اختلاف الهيدرات
  const [floatingIcons, setFloatingIcons] = useState<
    Array<{ Icon: any; size: number; top: number; left: number; duration: number; delay: number }>
  >([]);

  useEffect(() => {
    setIsClient(true);
    // توليد مواقع عشوائية للأيقونات
    const icons = [
      { Icon: Lightbulb, size: 64, top: 10 + Math.random() * 15, left: 5 + Math.random() * 10, duration: 10, delay: 0 },
      { Icon: Sparkles, size: 48, top: 20 + Math.random() * 15, left: 80 + Math.random() * 10, duration: 8, delay: 2 },
      { Icon: Rocket, size: 56, top: 70 + Math.random() * 15, left: 8 + Math.random() * 10, duration: 12, delay: 4 },
    ];
    setFloatingIcons(icons);
  }, []);

  return (
    <section className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-red-50/20 to-white pt-20 pb-0 dark:from-black dark:via-red-900/10 overflow-hidden">
      
      {/* الشبكة النقطية الناعمة */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#dc2626 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.15,
        }}
      />

      {/* دائرة توهج خلفية */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-red-500/5 blur-3xl pointer-events-none z-0" />

      {/* الأيقونات العائمة (تظهر فقط بعد التحميل على العميل) */}
      {isClient && !shouldReduceMotion &&
        floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute z-0 text-red-300/30 dark:text-red-800/30 pointer-events-none"
            style={{ top: `${item.top}%`, left: `${item.left}%` }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 15, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <item.Icon size={item.size} />
          </motion.div>
        ))
      }

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center text-center">
        
        {/* عنوان Typewriter */}
        <div className="mb-10">
          <TypeAnimation
            sequence={[title, 2000]}
            wrapper="h1"
            speed={{ type: "keyStrokeDelayInMs", value: 80 }}
            cursor={true}
            repeat={0}
            className="text-5xl md:text-8xl font-black leading-tight text-black dark:text-white drop-shadow-sm"
          />
        </div>

        {/* النص الفرعي مع تأثير Stagger */}
        <ScrollReveal>
          <div className="max-w-3xl flex flex-wrap justify-center gap-x-1 gap-y-2 text-center">
            {body.split(" ").map((word, index) => {
              const isHighlight = word === "TEDxYouth";
              return (
                <motion.span
                  key={index}
                  className={`text-lg md:text-xl inline-block transition-colors ${
                    isHighlight 
                      ? "text-red-600 dark:text-red-400 font-bold" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  viewport={{ once: true }}
                >
                  {word}
                  {index < body.split(" ").length - 1 && " "}
                </motion.span>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}