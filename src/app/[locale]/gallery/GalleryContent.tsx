"use client";

import { useState, useCallback } from "react";
import type { GalleryImage } from "@/lib/types";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import GalleryLightbox from "@/components/gallery/GalleryLightbox";

type Props = {
  images: GalleryImage[];
  categories: { key: string; label: string }[];
  closeLabel: string;
  ofLabel: string;
  emptyLabel?: string;
};

export default function GalleryContent({
  images,
  categories,
  closeLabel,
  ofLabel,
  emptyLabel,
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const onPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );
  }, [images.length]);

  const onNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : null
    );
  }, [images.length]);

  if (images.length === 0) {
    return (
      <section className="py-20 md:py-32 bg-background">
        <p className="text-center text-muted-foreground py-16">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <>
      <GalleryGrid
        images={images}
        categories={categories}
        onImageClick={(i) => setLightboxIndex(i)}
      />
      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={onPrev}
          onNext={onNext}
          closeLabel={closeLabel}
          ofLabel={ofLabel}
        />
      )}
    </>
  );
}
