"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRTL } from "@/hooks/useRTL";
import ScrollReveal from "@/components/ui/ScrollReveal";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import SectionBadge from "@/components/ui/SectionBadge";

/* ═══════════════════════════════════════════════════════════════
   أيقونات التواصل الاجتماعي (SVG يدوي لتفادي أخطاء المكتبات)
   ═══════════════════════════════════════════════════════════════ */
const SocialIcon = ({ type }: { type: "twitter" | "instagram" | "linkedin" }) => {
  const color = "currentColor";
  if (type === "twitter") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
      </svg>
    );
  }
  if (type === "instagram") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
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
  subtitle: string;
  badgeLabel: string;
  speakers: Speaker[];
  seeAllLabel: string;
  seeAllHref: string;
}

export default function SpeakersStage({
  heading,
  subtitle,
  badgeLabel,
  speakers,
  seeAllLabel,
  seeAllHref,
}: SpeakersStageProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL(); // ✅ عكس اتجاه النص في البطاقات
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      className="section-padding relative flex flex-col items-center justify-center px-4 md:px-8 overflow-hidden bg-background"
    >
      {/* نمط خلفي دقيق (استخدام متغيرات ألوان CSS) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        {/* ═══════ العنوان ═══════ */}
        <ScrollReveal>
          <div className="text-center mb-16">
            {/* ✅ الشارة الموحدة */}
            <div className="flex justify-center mb-4">
              <SectionBadge>{badgeLabel}</SectionBadge>
            </div>
            
            <h2 className="heading-h1 tracking-[-0.03em] mb-3 text-center">
              {heading}
            </h2>
            
            <p className="text-muted-foreground text-base max-w-md mx-auto leading-[1.7]">
              {subtitle}
            </p>
          </div>
        </ScrollReveal>

        {/* ═══════ شبكة المتحدثين ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {speakers.map((speaker, index) => (
            <motion.div
              key={speaker.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: shouldReduceMotion ? 0 : index * 0.1,
              }}
              className="group relative flex flex-col sm:flex-row gap-6 p-8 rounded-3xl bg-card border border-border overflow-hidden
                hover:border-tedx-red/20 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)]
                hover:-translate-y-[3px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              {/* توهج خلفي عند التمرير */}
              <div
                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 30% 20%, rgba(230,43,30,0.04), transparent 60%)",
                }}
              />

              {/* ═══════ الصورة ═══════ */}
              <div className="relative w-[120px] h-[120px] rounded-[20px] overflow-hidden flex-shrink-0 mx-auto sm:mx-0 bg-muted">
                {speaker.imageUrl ? (
                  <Image
                    src={speaker.imageUrl}
                    alt={speaker.name}
                    fill
                    className="object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] saturate-[0.85] contrast-[1.02] group-hover:saturate-[0.95] group-hover:contrast-[1.04] group-hover:scale-[1.06]"
                    sizes="120px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                    {speaker.name.charAt(0)}
                  </div>
                )}
                {/* إطار داخلي */}
                <div className="absolute inset-0 rounded-[20px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] group-hover:shadow-[inset_0_0_0_1px_rgba(230,43,30,0.15)] transition-shadow duration-300 pointer-events-none" />
              </div>

              {/* ═══════ المحتوى ═══════ */}
              <div className="flex-1 flex flex-col text-center sm:text-left relative z-10">
                <h3 className="font-bold text-xl text-foreground leading-[1.3] tracking-[-0.01em] group-hover:text-tedx-red transition-colors duration-300">
                  {speaker.name}
                </h3>
                <p className="text-[13px] font-semibold text-tedx-red mt-1 tracking-[0.02em]">
                  {speaker.role}
                </p>

                {/* فاصل */}
                <div className="h-px my-3.5 bg-border/50" />
                <div className="hidden sm:block h-px my-3.5 bg-border/50" />

                <p className="text-sm text-muted-foreground leading-[1.7] line-clamp-3">
                  {speaker.bio}
                </p>

                {/* ═══════ أزرار التواصل ═══════ */}
                <div className={`flex gap-2 mt-4 ${isRTL ? "sm:justify-end" : "sm:justify-start"} justify-center`}>
                  {speaker.socialLinks?.twitter && (
                    <a
                      href={speaker.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-muted text-muted-foreground
                        hover:bg-tedx-red/10 hover:text-tedx-red hover:border hover:border-tedx-red/10 hover:-translate-y-0.5
                        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    >
                      <SocialIcon type="twitter" />
                    </a>
                  )}
                  {speaker.socialLinks?.instagram && (
                    <a
                      href={speaker.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-muted text-muted-foreground
                        hover:bg-tedx-red/10 hover:text-tedx-red hover:border hover:border-tedx-red/10 hover:-translate-y-0.5
                        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    >
                      <SocialIcon type="instagram" />
                    </a>
                  )}
                  {speaker.socialLinks?.linkedin && (
                    <a
                      href={speaker.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-muted text-muted-foreground
                        hover:bg-tedx-red/10 hover:text-tedx-red hover:border hover:border-tedx-red/10 hover:-translate-y-0.5
                        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    >
                      <SocialIcon type="linkedin" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════ زر عرض الكل ═══════ */}
        <ScrollReveal>
          <div className="flex justify-center mt-12">
            <AnimatedSlidingButton href={seeAllHref} variant="primary">
              {seeAllLabel}
            </AnimatedSlidingButton>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}