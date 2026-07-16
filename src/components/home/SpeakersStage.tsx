"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";

// (حل بديل لأيقونات التواصل في حال واجهت مشكلة في lucide-react)
const SocialIcon = ({ type }: { type: "twitter" | "instagram" | "linkedin" }) => {
  const color = "currentColor";
  if (type === "twitter") {
    return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>;
  }
  if (type === "instagram") {
    return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
  }
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
};

interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string | null;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface SpeakersStageProps {
  heading: string;
  subtitle?: string;
  speakers: Speaker[];
  seeAllLabel: string;
  seeAllHref: string;
}

export default function SpeakersStage({
  heading,
  subtitle = "تعرف على الأشخاص الذين يصنعون هذا الحدث.",
  speakers,
  seeAllLabel,
  seeAllHref,
}: SpeakersStageProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center bg-white pt-20 pb-16 dark:bg-black overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 flex flex-col items-center">
        {/* العنوان والنص الفرعي */}
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white tracking-tight">
              {heading}
            </h2>
            <p className="text-gray-500 mt-4 text-lg font-light max-w-2xl mx-auto dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </ScrollReveal>

        {/* شبكة المتحدثين (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full">
          {speakers.map((speaker, index) => (
            <motion.div
              key={speaker.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-black/50 dark:border-gray-800"
            >
              {/* الصورة مع الحلقة الحمراء */}
              <div className="relative shrink-0 w-28 h-28 md:w-32 md:h-32 mx-auto sm:mx-0 rounded-full p-1 bg-gradient-to-br from-red-600 to-red-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {speaker.imageUrl ? (
                    <Image
                      src={speaker.imageUrl}
                      alt={speaker.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black text-3xl font-bold bg-gray-200 dark:bg-gray-600">
                      {speaker.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* تفاصيل المتحدث */}
              <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-black dark:text-white">
                  {speaker.name}
                </h3>
                <p className="text-sm text-red-600 font-medium mt-1 dark:text-red-500">
                  {speaker.role}
                </p>
                
                {/* الخط الفاصل الرمادي الناعم */}
                <hr className="my-3 border-gray-200 dark:border-gray-700" />

                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3 dark:text-gray-400">
                  {speaker.bio || "متحدث ملهم ينضم إلينا لمشاركة رحلته وأفكاره."}
                </p>

                {/* أزرار التواصل الاجتماعي (بأسلوب هوية TEDx) */}
                <div className="flex gap-2 justify-center sm:justify-start">
                  <a
                    href={speaker.socialLinks?.twitter || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors duration-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  >
                    <SocialIcon type="twitter" />
                  </a>
                  <a
                    href={speaker.socialLinks?.instagram || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors duration-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  >
                    <SocialIcon type="instagram" />
                  </a>
                  <a
                    href={speaker.socialLinks?.linkedin || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors duration-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  >
                    <SocialIcon type="linkedin" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* زر "عرض الكل" بأسلوب Neubrutalism (نفس أسلوب الأزرار السابقة) */}
        <ScrollReveal>
          <div className="mt-16">
            <Link
              href={seeAllHref}
              className="inline-flex items-center justify-center rounded-lg border-2 border-black bg-red-600 px-8 py-3 text-white font-bold shadow-[4px_4px_0px_0px_#000] transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] dark:shadow-[4px_4px_0px_0px_#fff] dark:border-white dark:hover:shadow-none"
            >
              {seeAllLabel}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}