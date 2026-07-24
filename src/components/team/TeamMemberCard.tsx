"use client";

import { useState } from "react";
import Image from "next/image";

interface TeamMemberCardProps {
  member: any;
  index: number;
  isArabic: boolean;
}

export default function TeamMemberCard({ member, index, isArabic }: TeamMemberCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = member.image || member.imageUrl;

  return (
    <div
      className="group relative rounded-3xl overflow-hidden bg-card border border-border hover:border-tedx-red/30 transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(230,43,30,0.15)] flex flex-col hero-fade-up"
      style={{ animationDelay: `${(index % 4) * 0.1}s` }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-900">
        
        {/* 1. طبقة الحرف الأول (تظهر دائماً تحت الصورة) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 z-0">
          <span className="text-5xl md:text-6xl font-black text-white/80 select-none drop-shadow-xl">
            {member.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* 2. الصورة الفعلية (تظهر فقط إذا لم يكن هناك خطأ) */}
        {imageSrc && !imageError && (
          <>
            {/* تدرج لوني فوق الصورة لضمان وضوح النص */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
            
            <Image
              src={imageSrc}
              alt={member.name}
              fill
              className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 z-0"
              onError={() => setImageError(true)} // ✅ هذا يعمل الآن داخل Client Component
            />
          </>
        )}

        {/* 3. المحتوى النصي أسفل البطاقة */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tedx-red/90 backdrop-blur-sm rounded-full mb-3 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {member.role || member.position || member.department}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1 truncate drop-shadow-md">
            {member.name}
          </h3>
          <div className="h-px w-0 group-hover:w-full bg-tedx-red transition-all duration-700 ease-out mt-3" />
        </div>
      </div>
    </div>
  );
}