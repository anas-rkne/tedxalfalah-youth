"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl"; 
import { TedxGlobe } from "@/components/ui/tedx-globe";
import ScrollReveal from "@/components/ui/ScrollReveal"; // ✅ استيراد ScrollReveal

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
  const locale = useLocale();
  const isArabic = locale === "ar";

  // ✅ دالة معالجة النص + إبراز الكلمات المفتاحية
  const formatTextWithLTR = (text: string, highlightKeywords: string[] = []) => {
    let formatted = text;

    // 1. عزل الكلمات الإنجليزية وإضافة dir="ltr"
    formatted = formatted.replace(/([A-Za-z0-9._-]+)/g, (match) => {
      return `<span dir="ltr" class="inline-block text-inherit">${match}</span>`;
    });

    // 2. إبراز الكلمات المفتاحية باللون الأحمر (اختياري)
    highlightKeywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "g");
      formatted = formatted.replace(regex, `<span class="text-red-600 font-semibold">$1</span>`);
    });

    return formatted;
  };

  // ✅ كلمات مفتاحية للإبراز
  const keywordsToHighlight = ["TED", "الإمارات", "عقول شابة", "الشباب"];

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-red-50/20 to-white pt-20 pb-0 dark:from-black dark:via-red-900/10 overflow-hidden">
      
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center gap-12 md:gap-16">
        
        {/* 1. العنوان الرئيسي مع وسام علوي */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          {/* الوسام العلوي */}
          <span className="inline-block px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-wider">
            {isArabic ? "عن الحدث" : "About The Event"}
          </span>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white text-center tracking-tight">
            {heading}
          </h2>
        </motion.div>

        {/* 2. المحتوى (التخطيط العكسي حسب اللغة) */}
        <div 
          className={`w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 ${
            isArabic ? "lg:flex-row-reverse" : "lg:flex-row"
          }`}
        >
          {/* الكرة الأرضية */}
          <motion.div
            initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full max-w-md flex items-center justify-center"
          >
            <TedxGlobe />
          </motion.div>

          {/* النص التعريفي مع تحسينات جمالية */}
          <ScrollReveal className="flex flex-col gap-6 max-w-lg w-full">
            
            {/* ✅ حاوية الفقرة مع شريط جانبي بلون TEDx */}
            <div 
              className={`relative pl-6 ${
                isArabic ? "border-r-4 border-red-600 pr-6 pl-0" : "border-l-4 border-red-600 pl-6"
              }`}
            >
              <p 
                className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatTextWithLTR(body, keywordsToHighlight) }}
              />
            </div>

            {/* ✅ ملاحظة الترخيص (مع خط فاصل رفيع) */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <p 
                className="text-sm text-gray-500 italic dark:text-gray-400 font-light"
                dangerouslySetInnerHTML={{ __html: formatTextWithLTR(licenseNote) }}
              />
            </div>

          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}