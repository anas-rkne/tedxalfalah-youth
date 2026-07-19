"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Theme from "@/components/home/Theme";
import SpeakersPreview from "@/components/home/SpeakersPreview";
import Highlights from "@/components/home/Highlights";
import ApplyBanner from "@/components/home/ApplyBanner";
import SponsorsStrip from "@/components/home/SponsorsStrip";
import ContactForm from "@/components/home/ContactForm";

export default function HomeClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  // تتبع حركة التمرير داخل الحاوية الرئيسية
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // تحويل الحجم (Scale) لكل قسم بناءً على تقدم التمرير
  // القسم 1 (Hero): من 1 إلى 0.95
  const scaleHero = useTransform(scrollYProgress, [0, 0.33], [1, 0.95]);
  // القسم 2 (About): من 0.95 إلى 1
  const scaleAbout = useTransform(scrollYProgress, [0.33, 0.66], [0.95, 1]);
  // القسم 3 (Theme): من 1 إلى 0.95
  const scaleTheme = useTransform(scrollYProgress, [0.66, 1], [1, 0.95]);

  return (
    <>
      {/* 1. حاوية الأقسام المتداخلة (المكدس) */}
      <main ref={containerRef} className="relative h-[300vh] bg-white">
        
        {/* القسم الأول: Hero */}
        <motion.div
          style={{ scale: scaleHero }}
          className="sticky top-0 h-screen z-10 overflow-hidden"
        >
          <Hero />
        </motion.div>

        {/* القسم الثاني: About */}
        <motion.div
          style={{ scale: scaleAbout }}
          className="sticky top-0 h-screen z-20 overflow-hidden"
        >
          <About />
        </motion.div>

        {/* القسم الثالث: Theme */}
        <motion.div
          style={{ scale: scaleTheme }}
          className="sticky top-0 h-screen z-30 overflow-hidden"
        >
          <Theme />
        </motion.div>

      </main>

      {/* 2. الأقسام العادية (خارج المكدس، تعمل بشكل طبيعي) */}
      <SpeakersPreview />
      <Highlights />
      <ApplyBanner />
      <SponsorsStrip />
      <ContactForm 
        leftImageSrc="/images/boy-lap.jpg"
        rightImageSrc="/images/girl-lap.jpg"
      />
    </>
  );
}