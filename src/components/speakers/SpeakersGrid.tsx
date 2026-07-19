"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Speaker } from "@/lib/types";
import SpeakerCard from "./SpeakerCard";
import SpeakerModal from "./SpeakerModal";

interface SpeakersGridProps {
  speakers: Speaker[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const childVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function SpeakersGrid({ speakers }: SpeakersGridProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeSpeaker, setActiveSpeaker] = useState<Speaker | null>(null);

  if (shouldReduceMotion) {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {speakers.map((speaker) => (
            <SpeakerCard
              key={speaker.id}
              speaker={speaker}
              onClick={() => setActiveSpeaker(speaker)}
            />
          ))}
        </div>
        <SpeakerModal
          speaker={activeSpeaker}
          onClose={() => setActiveSpeaker(null)}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {speakers.map((speaker) => (
          <motion.div key={speaker.id} variants={childVariants}>
            <SpeakerCard
              speaker={speaker}
              onClick={() => setActiveSpeaker(speaker)}
            />
          </motion.div>
        ))}
      </motion.div>

      <SpeakerModal
        speaker={activeSpeaker}
        onClose={() => setActiveSpeaker(null)}
      />
    </>
  );
}