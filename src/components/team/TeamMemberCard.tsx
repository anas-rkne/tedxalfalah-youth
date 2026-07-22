"use client";

import Image from "next/image";
import { TeamMember } from "@/lib/types";

// ✅ أيقونة LinkedIn (تم الاحتفاظ بها كما هي)
export const LinkedinIcon = ({ size = 24, color = 'currentColor', ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="group relative bg-[#0a0a0a] rounded-[24px] overflow-hidden border border-white/10 hover:border-[#e62b1e]/50 hover:shadow-[0_0_40px_-10px_rgba(230,43,30,0.15)] transition-all duration-500 ease-out cursor-pointer h-full flex flex-col">
      
      {/* Image Container */}
      <div className="h-64 sm:h-72 relative overflow-hidden bg-zinc-900 shrink-0">
        <div className="absolute inset-0 bg-[#e62b1e]/0 group-hover:bg-[#e62b1e]/10 transition-colors duration-500 z-10 mix-blend-color"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-10"></div>
        
        <div className="absolute top-4 left-4 z-20 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-md text-[10px] font-bold text-white border border-white/20 tracking-widest uppercase">
          {member.department}
        </div>
        
        {/* LinkedIn Button */}
        {member.linkedinUrl && (
          <a
            href={member.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center
              border border-white/20 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out hover:bg-[#e62b1e] hover:border-[#e62b1e]"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkedinIcon size={16} />
          </a>
        )}

        <Image
          src={member.imageUrl}
          alt={member.name}
          fill
          className="object-cover w-full h-full filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-[0.22,1,0.36,1]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 pb-6 -mt-12 relative z-20 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-2xl font-black tracking-tight text-white mb-1 group-hover:text-[#e62b1e] transition-colors duration-300">{member.name}</h3>
          <p className="text-xs text-white/60 font-medium uppercase tracking-widest">{member.role}</p>
        </div>

        {member.quote && (
          <div className="flex-1 mb-6 mt-2">
            <p className="text-[12px] text-white/50 italic leading-relaxed border-l-2 border-[#e62b1e]/30 pl-3 group-hover:border-[#e62b1e] transition-colors duration-300">
              "{member.quote}"
            </p>
          </div>
        )}

        {/* Footer info/wave */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[2px] h-3">
              <div className="w-[2px] h-[6px] bg-white/40 group-hover:bg-[#e62b1e] rounded-full group-hover:animate-pulse transition-colors duration-300"></div>
              <div className="w-[2px] h-[10px] bg-white/40 group-hover:bg-[#e62b1e] rounded-full group-hover:animate-[pulse_1s_ease-in-out_infinite_0.1s] transition-colors duration-300"></div>
              <div className="w-[2px] h-[4px] bg-white/40 group-hover:bg-[#e62b1e] rounded-full group-hover:animate-[pulse_1s_ease-in-out_infinite_0.2s] transition-colors duration-300"></div>
              <div className="w-[2px] h-[8px] bg-white/40 group-hover:bg-[#e62b1e] rounded-full group-hover:animate-[pulse_1s_ease-in-out_infinite_0.15s] transition-colors duration-300"></div>
            </div>
            <span className="text-[9px] font-bold text-white/40 tracking-[0.2em] uppercase group-hover:text-white/60 transition-colors duration-300">TEDx</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#e62b1e] group-hover:shadow-[0_0_15px_rgba(230,43,30,0.5)] transition-all duration-300">
            <svg className="w-3.5 h-3.5 text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}