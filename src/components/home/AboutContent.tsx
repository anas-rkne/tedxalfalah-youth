"use client";

import { motion } from "framer-motion";
import { Lightbulb, Rocket, Target, Users } from "lucide-react";
import { TedxGlobe } from "@/components/ui/tedx-globe";

interface AboutContentProps {
  heading: string;
  body: string;
  licenseNote: string;
}

export default function AboutContent({
  heading,
  body,
  licenseNote,
}: AboutContentProps) {
  const features = [
    {
      title: "إلهام الشباب",
      desc: "منحهم منصة لإيصال أصواتهم وأفكارهم للمجتمع.",
      icon: Lightbulb,
    },
    {
      title: "تواصل عالمي",
      desc: "ربط العقول الشابة بخبراء في مختلف المجالات.",
      icon: Users,
    },
    {
      title: "ابتكار حقيقي",
      desc: "استكشاف حلول جديدة لتحديات المستقبل.",
      icon: Rocket,
    },
    {
      title: "تأثير مستدام",
      desc: "بناء مجتمع من المفكرين والقادة الشباب.",
      icon: Target,
    },
  ];

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-red-50/20 to-white pt-20 pb-0 dark:from-black dark:via-red-900/10 overflow-hidden">
      
      {/* 1. العنوان الرئيسي للقسم (في المنتصف) */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center gap-12 md:gap-16">
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white text-center tracking-tight"
        >
          {heading}
        </motion.h2>

        {/* 2. المحتوى الرئيسي (الكرة الأرضية + القائمة) */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
          
          {/* ===== الجانب الأيسر (أو الأول في التخطيط): الكرة الأرضية ===== */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full max-w-md flex items-center justify-center"
          >
            <TedxGlobe />
          </motion.div>

          {/* ===== الجانب الأيمن (أو الثاني في التخطيط): القائمة الجانبية ===== */}
          <div className="flex flex-col gap-8 w-full max-w-lg order-1 lg:order-2">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-6"
                >
                  <div className="flex-1 text-right">
                    <h4 className="text-lg md:text-xl font-bold text-black dark:text-white">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
                  </div>
                  <div className="hidden lg:flex items-center w-12 h-[2px] bg-red-400 relative">
                    <div className="absolute -right-1 w-2 h-2 rounded-full bg-red-600" />
                  </div>
                  <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-red-200 bg-white/80 flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}