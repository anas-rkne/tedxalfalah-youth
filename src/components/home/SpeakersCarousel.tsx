"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Speaker } from "@/lib/types";

interface SpeakersCarouselProps {
  speakers: Speaker[];
}

export default function SpeakersCarousel({ speakers }: SpeakersCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(0);

  useEffect(() => {
    function updateBounds() {
      if (containerRef.current && trackRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const trackWidth = trackRef.current.scrollWidth;
        setMaxDrag(Math.max(0, trackWidth - containerWidth));
      }
    }

    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [speakers]);

  return (
    <div ref={containerRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
      <motion.div
        ref={trackRef}
        drag="x"
        dragConstraints={{ left: -maxDrag, right: 0 }}
        dragElastic={0.2}
        className="flex gap-6 w-max px-1"
      >
        {speakers.map((speaker) => (
          <motion.div
            key={speaker.id}
            whileDrag={{ rotate: 5 }}
            className="text-center w-40 md:w-48 flex-shrink-0 select-none"
          >
            <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 pointer-events-none">
              <Image
                src={speaker.imageUrl}
                alt={speaker.name}
                fill
                loading="lazy"
                className="object-cover"
                draggable={false}
              />
            </div>
            <h3 className="font-semibold">{speaker.name}</h3>
            <p className="text-sm text-tedx-gray">{speaker.shortDescriptor}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
