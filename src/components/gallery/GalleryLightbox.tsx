"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { GalleryImage } from "@/lib/types";
import { useRTL } from "@/hooks/useRTL";
import SafeImage from "@/components/ui/SafeImage";

type Props = {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  closeLabel?: string;
  ofLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
};

export default function GalleryLightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  closeLabel,
  ofLabel = "of",
  previousLabel,
  nextLabel,
}: Props) {
  const { isRTL } = useRTL();
  const t = useTranslations("common");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          isRTL ? onNext() : onPrev();
          break;
        case "ArrowRight":
          isRTL ? onPrev() : onNext();
          break;
      }
    },
    [onClose, onPrev, onNext, isRTL]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const img = images[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-auto"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          aria-label=          {closeLabel || t("ui.close")}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Counter */}
        <div className="absolute top-4 start-4 text-white/60 text-sm font-medium">
          {currentIndex + 1} {ofLabel} {images.length}
        </div>

        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className={`absolute start-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer ${isRTL ? "scale-x-[-1]" : ""}`}
            aria-label={previousLabel || t("ui.previous")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Image */}
        <motion.div
          key={img.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {img.src && (
          <SafeImage
            src={img.src}
            alt={img.alt}
            width={img.width || 1200}
            height={img.height || 800}
            className="max-w-full max-h-[75vh] object-contain rounded-lg"
            style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }}
          />
          )}
          {(img.caption) && (
            <p className="mt-4 text-white/80 text-sm text-center max-w-lg">
              {img.caption}
            </p>
          )}
        </motion.div>

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className={`absolute end-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer ${isRTL ? "scale-x-[-1]" : ""}`}
            aria-label={nextLabel || t("ui.next")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
