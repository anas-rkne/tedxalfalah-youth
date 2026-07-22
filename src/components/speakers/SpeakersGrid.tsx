"use client";

import { useState } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { Speaker } from "@/lib/types";
import SpeakerCard from "./SpeakerCard";
import SpeakerModal from "./SpeakerModal";

interface SpeakersGridProps {
  speakers: Speaker[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const childVariants: Variants = {
  hidden: { 
    y: 40, 
    opacity: 0, 
    scale: 0.95, 
    filter: "blur(10px)" 
  },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1, 
    filter: "blur(0px)", 
    transition: { 
      type: "spring",
      stiffness: 250, 
      damping: 25, 
      mass: 1 
    } 
  },
};

export default function SpeakersGrid({ speakers }: SpeakersGridProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeSpeaker, setActiveSpeaker] = useState<Speaker | null>(null);

  // إعدادات الشبكة الموحدة
  const gridClasses = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10 max-w-7xl mx-auto px-4";

  if (shouldReduceMotion) {
    return (
      <>
        <div className={gridClasses}>
          {speakers.map((speaker) => (
            <SpeakerCard
              key={speaker.id}
              speaker={speaker}
              onClick={() => setActiveSpeaker(speaker)}
            />
          ))}
        </div>
        {activeSpeaker && (
          <SpeakerModal
            speaker={activeSpeaker}
            onClose={() => setActiveSpeaker(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <motion.div
        className={gridClasses}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {speakers.map((speaker) => (
          <motion.div key={speaker.id} variants={childVariants} className="h-full">
            <SpeakerCard
              speaker={speaker}
              onClick={() => setActiveSpeaker(speaker)}
            />
          </motion.div>
        ))}
      </motion.div>

      {activeSpeaker && (
        <SpeakerModal
          speaker={activeSpeaker}
          onClose={() => setActiveSpeaker(null)}
        />
      )}
    </>
  );
}