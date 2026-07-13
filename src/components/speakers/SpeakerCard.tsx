"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Speaker } from "@/lib/types";

interface SpeakerCardProps {
  speaker: Speaker;
  onClick: () => void;
}

function WavyText({ text }: { text: string }) {
  return (
    <motion.span
      className="inline-flex flex-wrap"
      whileHover="hover"
      initial="initial"
      transition={{ staggerChildren: 0.05, type: "spring" }}
    >
      {text.split("").map((char, i) =>
        char === " " ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <motion.span
            key={i}
            variants={{
              initial: { y: 0 },
              hover: { y: [0, -12, 0] },
            }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            {char}
          </motion.span>
        )
      )}
    </motion.span>
  );
}

export default function SpeakerCard({ speaker, onClick }: SpeakerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    setRotate({ x: -y / 15, y: x / 15 });
  }

  function handleMouseLeave() {
    setRotate({ x: 0, y: 0 });
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: rotate.x,
        rotateY: rotate.y,
        transformStyle: "preserve-3d",
        perspective: 900,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="cursor-pointer text-left group"
    >
      <motion.div
        className="relative w-full aspect-square rounded-lg overflow-hidden mb-3"
        whileInView={{ clipPath: "inset(0 0% 0 0%)", scale: 1 }}
        initial={{ clipPath: "inset(0 50% 0 50%)", scale: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ boxShadow: "0 0 30px rgba(234, 56, 76, 0.4)" }}
      >
        <Image
          src={speaker.imageUrl}
          alt={speaker.name}
          fill
          className="object-cover"
        />
      </motion.div>

      <h3 className="font-semibold text-lg">
        <WavyText text={speaker.name} />
      </h3>
      <p className="text-sm text-tedx-gray">
        <WavyText text={speaker.shortDescriptor} />
      </p>
      <p className="text-sm text-tedx-red mt-1">{speaker.talkTitle}</p>
    </motion.div>
  );
}
