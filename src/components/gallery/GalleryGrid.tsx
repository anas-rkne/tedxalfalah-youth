"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GalleryImage } from "@/lib/types";
import SectionContainer from "@/components/ui/SectionContainer";
import SafeImage from "@/components/ui/SafeImage";

type Props = {
  images: GalleryImage[];
  categories: { key: string; label: string }[];
  onImageClick: (index: number) => void;
};

export default function GalleryGrid({ images, categories, onImageClick }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? images
        : images.filter((img) => img.category === activeCategory),
    [images, activeCategory]
  );

  return (
    <section className="py-20 md:py-32 bg-background">
      <SectionContainer>
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.key
                  ? "bg-tedx-red text-white shadow-lg shadow-tedx-red/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((img, i) => (
              <motion.button
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => onImageClick(i)}
                className={`cursor-pointer group relative overflow-hidden rounded-2xl bg-muted ${
                  i === 0 && activeCategory === "all"
                    ? "sm:col-span-2 sm:row-span-2"
                    : ""
                }`}
                style={{
                  aspectRatio:
                    activeCategory === "all" && i === 0
                      ? undefined
                      : `${img.width}/${img.height}`,
                }}
              >
                {img.src && (
                <SafeImage
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-all duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium">{img.caption}</p>
                  </div>
                )}
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      </SectionContainer>
    </section>
  );
}
