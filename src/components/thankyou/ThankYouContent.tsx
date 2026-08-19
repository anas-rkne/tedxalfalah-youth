"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Calendar } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRTL } from "@/hooks/useRTL";

interface TimelineStage {
  date: string;
  title: string;
}

interface ThankYouContentProps {
  headerSubtitle: string;
  stepper1: string;
  stepper2: string;
  stepper3: string;
  verticalLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  stat1: string;
  stat2: string;
  stat3: string;
  cta: string;
  ctaHref: string;
  showTimeline: boolean;
  timelineButton: string;
  timelineTitle: string;
  timelineSubtitle: string;
  timelineStages: TimelineStage[];
  footerHashtag: string;
  footerDate: string;
  footerContact: string;
}

export default function ThankYouContent({
  title,
  body,
  cta,
  ctaHref,
  showTimeline,
  timelineButton,
  timelineTitle,
  timelineSubtitle,
  timelineStages,
}: ThankYouContentProps) {
  const { isRTL } = useRTL();
  const [timelineOpen, setTimelineOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-white text-black relative overflow-hidden flex flex-col selection:bg-tedx-red selection:text-white"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center w-full">
          {/* القسم الأيسر: النصوص */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center lg:items-start min-w-0"
          >
{/* العنوان + الخط الأحمر — حاوية بعرض العنوان نفسه (w-fit) فيكون الخط على قد النص في كل المقاسات */}
            <div className="w-fit max-w-full mx-auto lg:mx-0 flex flex-col items-center lg:items-start">
              <h1
                className={`whitespace-pre-line text-[clamp(2.75rem,9vw,5.5rem)] lg:text-[96px] font-extrabold text-center lg:text-start ${
                  isRTL
                    ? "font-arabic tracking-normal leading-[1.25]"
                    : "font-alexandria tracking-[-2px] leading-[1.1]"
                }`}
              >
                {title}
              </h1>

              {/* الخط الأحمر — Inline SVG بـ viewBox مضبوط (116 494 810 91) = حدود الرسم الفعلي، بنسبه الطبيعية (meet) بلا هوامش */}
              <svg
                viewBox="116 494 810 91"
                aria-hidden
                className="w-full h-auto -mt-1 lg:-mt-2 pointer-events-none"
              >
                <path
                  d="M204.15,545.17c-9.96,1.09-19.98,1.45-29.99,1.29-4.46-.07-8.91-.25-13.36-.56-2.16-.15-4.32-.33-6.48-.55-.85-.09-1.7-.19-2.55-.29-2.97-.36,4.05.92-.5-.12-1.26-.29-2.55-.46-3.81-.77-.65-.16-1.44-.5-2.08-.56-1.66-.18-.12-1.07.57.32-.12-.24,2.26,1.32.9.29,1.34,2.39,2.68,4.79,4.03,7.18,3.82,3.44,4.95,7.39,3.4,11.86.23-.86.58-1.41-.81,1.82-.94,2.18-3.26,7.02-6.14,7.25.56-.05,1.74-1,2.28-1.26,1.11-.56-5.75,2.01-2.73,1.17.65-.18,1.3-.46,1.95-.67,3.16-1.03,6.43-1.77,9.68-2.44,4.63-.97,9.3-1.75,13.98-2.46,1.28-.19,2.56-.38,3.84-.57.72-.1,1.44-.2,2.16-.3,3.4-.49-2.77.36-1.99.26,3.21-.39,6.41-.83,9.62-1.21,16.08-1.91,32.22-3.38,48.36-4.71,48.49-3.99,97.09-6.65,145.68-9.05,70.29-3.47,140.63-6.15,210.96-8.54,92.07-3.13,184.15-5.72,276.24-8.04,13.16-.33,26.32-.66,39.48-.98,23.52-.57,23.61-37.19,0-36.61-98.6,2.41-197.18,5.08-295.76,8.35-74.57,2.47-149.13,5.24-223.65,8.86-51.02,2.47-102.05,5.21-152.97,9.4-28.92,2.38-58.53,4.38-86.95,10.56-7.8,1.69-16.86,3.89-22.68,9.72-7.22,7.24-8.88,18.15-2.37,26.64,4.95,6.45,12.8,8.8,20.51,10.03,9.96,1.6,20.03,2.37,30.11,2.57,10.37.21,20.75-.14,31.06-1.26,9.83-1.07,18.31-7.65,18.31-18.31,0-9.07-8.41-19.38-18.31-18.31h0Z"
                  fill="#f80200"
                />
              </svg>
            </div>

            {/* نص الشرح الفرعي — مترجم */}
            <p
              className={`text-[18px] lg:text-[22px] text-zinc-700 leading-[1.6] max-w-[500px] mt-4 lg:mt-6 text-center lg:text-start ${
                isRTL ? "font-arabic" : ""
              }`}
            >
              {body}
            </p>

            {/* الأزرار: العودة للرئيسية + الجدول الزمني — على نفس السطر */}
            <div className="flex flex-nowrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mt-8 lg:mt-12 w-full">
              {showTimeline && (
                <button
                  type="button"
                  onClick={() => setTimelineOpen((open) => !open)}
                  aria-expanded={timelineOpen}
                  className={`inline-flex items-center gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-tedx-red text-white font-bold text-[13px] sm:text-base border border-tedx-red transition-all duration-300 hover:bg-tedx-red/90 hover:border-tedx-red/90 focus:outline-none focus:ring-2 focus:ring-tedx-red focus:ring-offset-2 whitespace-nowrap ${
                    isRTL ? "font-arabic" : "font-alexandria"
                  }`}
                >
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  {timelineButton}
                </button>
              )}
              <Link
                href={ctaHref}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-tedx-red text-white font-bold text-[13px] sm:text-base border border-tedx-red transition-all duration-300 hover:bg-tedx-red/90 hover:border-tedx-red/90 focus:outline-none focus:ring-2 focus:ring-tedx-red focus:ring-offset-2 whitespace-nowrap ${
                  isRTL ? "font-arabic" : "font-alexandria"
                }`}
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                {cta}
              </Link>
            </div>
          </motion.div>

          {/* القسم الأيمن: أيقونة الصح — Inline SVG بـ viewBox مضبوط (351 391 340 297 = حدود الرسم، نسبة 1.144:1) فيملأ صندوقه كاملًا */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center lg:justify-end items-center"
          >
            <svg
              viewBox="351 390 341 300"
              aria-hidden
              className="w-[clamp(180px,26vw,320px)] lg:w-[360px] aspect-[1.144/1] pointer-events-none"
            >
              <path
                d="M427.17,510.81c-3.69,26.08-11.72,62.67,8.13,84.61,13.83,15.29,36.42,14.11,54.45,8.56,23.14-7.12,44.66-19.83,64.94-32.79,22.87-14.62,44.82-30.64,66.53-46.9,19.92-14.92,39.43-30.48,59.91-44.63,8.13-5.62,11.83-16.06,6.57-25.06-4.71-8.05-16.88-12.22-25.06-6.57-37.29,25.77-72.12,54.93-109.63,80.43-19.03,12.94-38.62,25.52-59.59,35.11-1.12.51-2.26.99-3.38,1.51-3.87,1.78,3.89-1.42-.03,0-2.14.77-4.24,1.65-6.39,2.4-4.22,1.46-8.48,2.53-12.83,3.5-3.05.68-.82,1.28,1.24-.08-.46.3-2.06.24-2.62.26-1.39.04-2.76.14-4.15.1-.77-.02-1.59-.17-2.36-.14-3.1.1,4.7,1.32,1.89.21-.62-.24-1.46-.38-2.11-.52-4.4-.97,1.63-.25,1.1.6-.28.46-6.52-4.78-.85-.16-.51-.42-1.07-.95-1.48-1.47-1.68-2.13,2.49,4.59.69.83-.29-.6-.72-1.48-1.13-1.99-1.56-1.98,1.06,4.02.56,1.4-.36-1.9-1-4.27-1.64-6.1-1.18-3.38.22,4.61.08.86-.05-1.47-.24-2.94-.29-4.41-.17-4.56-.05-9.16.12-13.72.34-9.48,1.48-17.67,2.67-26.1,1.38-9.78-2.39-19.68-12.79-22.53-8.58-2.36-21.14,2.94-22.53,12.79h0Z"
                fill="#fa0000"
              />
              <path
                d="M645.91,464.27c-32.74-40.98-81.83-72.39-135.65-71.77-65.66.76-128.92,43.07-149.84,106.15-16.95,51.12-5.95,112.24,33.5,150.04,34.56,33.12,85.58,44.3,131.98,36.36,70.42-12.05,120.81-77.97,131.98-145.58,1.61-9.75-2.55-19.72-12.79-22.53-8.76-2.41-20.91,2.98-22.53,12.79-2.19,13.28-6.64,29.58-11.2,39.99-2.71,6.2-5.85,12.22-9.3,18.04-3.17,5.34-8.32,12.85-10.73,15.83-4.09,5.04-8.48,9.83-13.16,14.31-5.4,5.17-9.15,8.29-14.02,11.68-5.17,3.6-10.57,6.86-16.18,9.72-1.4.71-2.81,1.38-4.22,2.06-.59.29-4.23,1.89-1.64.79-3.45,1.46-7.02,2.7-10.6,3.81-4.93,1.54-9.97,2.81-15.06,3.7-.61.11-1.23.16-1.83.3-3.41.79,5.91-.61.68-.1-7.08.7-14.14,1.09-21.26.93-4.69-.1-9.33-.48-14-.92-1.04-.1-4.46-.64-.42-.02-1.29-.2-2.59-.4-3.88-.62-2.94-.51-5.86-1.1-8.76-1.79-13.52-3.22-20.43-5.87-31.93-12.93-10.53-6.46-20.47-15.35-28.25-26.96-8.32-12.42-12.79-23.83-15.58-38.62-1.66-8.76-2.13-21.85-1.06-33.81.12-1.3,1.19-8.95.37-3.85.34-2.15.67-4.29,1.08-6.43.7-3.69,1.52-7.35,2.5-10.98,5.35-19.71,16.51-36.6,31.64-50.81,19.03-17.88,43.75-29.8,71.21-33.2-2.63.33,1.59-.11,2.17-.16,2.35-.21,4.71-.38,7.07-.47,4.22-.17,8.45-.15,12.67.09s5.82.39,8.89.92c4.06.69,8.08,1.59,12.05,2.67,3.54.96,7.04,2.07,10.48,3.33,4.79,1.74,4.23,1.54,8.15,3.4,6.67,3.17,13.1,6.84,19.27,10.9,2.91,1.92,5.73,3.95,8.55,6,.47.34,2.75,2.15.28.2,1.49,1.18,2.96,2.37,4.41,3.59,4.36,3.66,8.57,7.51,12.61,11.52,5.83,5.78,11.3,11.91,16.43,18.32,6.18,7.73,19.46,6.45,25.9,0,7.64-7.64,6.2-18.15,0-25.9h0Z"
                fill="#fa0000"
              />
            </svg>
          </motion.div>
        </div>

        {/* الجدول الزمني — يظهر عند الضغط على الزر */}
        {timelineOpen && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full mt-10 lg:mt-14 pb-4"
          >
            <div className="max-w-5xl mx-auto w-full">
              <h2
                className={`text-2xl lg:text-3xl font-black text-black mb-1 ${
                  isRTL ? "font-arabic" : "font-alexandria"
                }`}
              >
                {timelineTitle}
              </h2>
              <p className={`text-sm text-zinc-500 mb-8 ${isRTL ? "font-arabic" : ""}`}>
                {timelineSubtitle}
              </p>

              {/* أفقي — ديسكتوب */}
              <div className="hidden lg:flex items-start justify-between gap-2 relative">
                <div className="absolute top-[32px] left-0 right-0 h-[3px] bg-tedx-red/30 rounded-full" />
                {timelineStages.map((stage, i) => (
                  <div
                    key={i}
                    className="relative flex-1 flex flex-col items-center text-center px-1"
                  >
                    <span
                      className={`text-[11px] font-bold text-tedx-red whitespace-nowrap mb-2 ${
                        isRTL ? "font-arabic" : ""
                      }`}
                    >
                      {stage.date}
                    </span>
                    <span className="relative w-4 h-4 rounded-full bg-tedx-red border-[3px] border-tedx-red/20 z-10" />
                    <span
                      className={`text-[12px] text-black mt-2 leading-snug ${
                        isRTL ? "font-arabic" : ""
                      }`}
                    >
                      {stage.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* عمودي — موبايل */}
              <div className="lg:hidden border-s-2 border-tedx-red/30 ms-2 space-y-6">
                {timelineStages.map((stage, i) => (
                  <div key={i} className="relative ps-5">
                    <span className="absolute -start-[7px] top-[2px] w-3 h-3 rounded-full bg-tedx-red border-2 border-tedx-red/20" />
                    <div
                      className={`text-[11px] font-bold text-tedx-red mb-0.5 ${
                        isRTL ? "font-arabic" : ""
                      }`}
                    >
                      {stage.date}
                    </div>
                    <div className={`text-sm text-black ${isRTL ? "font-arabic" : ""}`}>
                      {stage.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}