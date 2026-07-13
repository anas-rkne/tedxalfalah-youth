"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import { Speaker } from "@/lib/types";

interface SpeakersCarouselProps {
  speakers: Speaker[];
}

export default function SpeakersCarousel({ speakers }: SpeakersCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerView = 4;

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

  const totalPages = Math.max(1, Math.ceil(speakers.length / itemsPerView));
  const cardWidth = 192; // w-48 = 192px + 24px gap = 216px per unit

  function goNext() {
    const next = Math.min(currentPage + 1, totalPages - 1);
    setCurrentPage(next);
  }

  function goPrev() {
    const prev = Math.max(currentPage - 1, 0);
    setCurrentPage(prev);
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden cursor-grab active:cursor-grabbing relative"
      role="region"
      aria-label="Speaker carousel"
    >
      <motion.div
        ref={trackRef}
        drag={shouldReduceMotion ? false : "x"}
        dragConstraints={isRTL ? { left: 0, right: maxDrag } : { left: -maxDrag, right: 0 }}
        dragElastic={0.2}
        className="flex gap-6 w-max px-1"
        animate={shouldReduceMotion ? {} : { x: (isRTL ? 1 : -1) * currentPage * 216 * itemsPerView }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {speakers.map((speaker) => (
          <motion.div
            key={speaker.id}
            whileDrag={shouldReduceMotion ? {} : { rotate: 5 }}
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
                sizes="(max-width: 768px) 160px, 192px"
              />
            </div>
            <h3 className="font-semibold">{speaker.name}</h3>
            <p className="text-sm text-tedx-gray">{speaker.shortDescriptor}</p>
          </motion.div>
        ))}
      </motion.div>

      {totalPages > 1 && (
        <>
          <button
            onClick={goPrev}
            disabled={currentPage === 0}
            className="absolute start-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous speakers"
          >
            <ChevronLeft size={20} className={isRTL ? "rotate-180" : ""} />
          </button>
          <button
            onClick={goNext}
            disabled={currentPage >= totalPages - 1}
            className="absolute end-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next speakers"
          >
            <ChevronRight size={20} className={isRTL ? "rotate-180" : ""} />
          </button>
        </>
      )}
    </div>
  );
}
