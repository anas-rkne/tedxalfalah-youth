"use client";

import { memo, useState, useEffect, useCallback, useRef } from "react";
import { TeamMember } from "@/lib/types";
import SafeImage from "@/components/ui/SafeImage";
import { useTranslations } from "next-intl";

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
  isArabic: boolean;
  interactive?: boolean; // <--- إضافة هذا السطر
}

const TeamMemberCard = memo(function TeamMemberCard({
  member,
  index,
  isArabic,
  interactive = false, // <--- إضافة هذا السطر
}: TeamMemberCardProps) {
  const t = useTranslations("page.team.bio");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openTop, setOpenTop] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const imageSrc = member.imageUrl;
  const fullName = member.name ?? "";
  const firstLetter = fullName.charAt(0).toUpperCase() || "?";
  const hasBio = !!member.bio;

  const openModal = useCallback(() => {
    if (interactive && hasBio) {
      const top = cardRef.current?.getBoundingClientRect().top ?? 0;
      setOpenTop(Math.max(0, top));
      setIsModalOpen(true);
    }
  }, [interactive, hasBio]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal();
      }
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    },
    [openModal, closeModal, isModalOpen]
  );

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // كشف الجوال (لتحديد موضع اللوحة المربوطة بالبطاقة)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen, closeModal]);

  if (!member) return null;

  const isInteractive = interactive && hasBio;

  return (
    <>
      <div
        ref={cardRef}
        className={`group relative rounded-3xl overflow-hidden bg-card border border-border hover:border-tedx-red/30 transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(230,43,30,0.15)] flex flex-col hero-fade-up ${
          isInteractive ? "cursor-pointer" : ""
        }`}
        style={{ animationDelay: `${(index % 4) * 0.1}s` }}
        onClick={openModal}
        onKeyDown={handleKeyDown}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-900">
          {/* طبقة الحرف الأول (احتياطية) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 z-0">
            <span className="text-5xl md:text-6xl font-black text-white/80 select-none drop-shadow-xl">
              {firstLetter}
            </span>
          </div>

          {/* الصورة (SafeImage) */}
          {imageSrc && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
              <SafeImage
                src={imageSrc}
                alt={fullName}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-all duration-700 z-0"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </>
          )}

          {/* المحتوى النصي */}
          <div
            className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tedx-red/90 backdrop-blur-sm rounded-full mb-3 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span
                className={`text-[10px] font-bold text-white uppercase tracking-wider ${
                  isArabic ? "font-arabic" : ""
                }`}
              >
                {member.role || member.department || ""}
              </span>
            </div>
            <h3
              className={`text-xl md:text-2xl font-bold text-white mb-1 truncate drop-shadow-md ${
                isArabic ? "font-arabic" : ""
              }`}
            >
              {fullName}
            </h3>

            {/* شارة "عرض السيرة" إذا كان تفاعليًا */}
            {isInteractive && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-white/70 group-hover:text-white transition-colors duration-300">
                  {t("view")}
                </span>
                <span className="text-tedx-red text-lg">↗</span>
              </div>
            )}

            <div className="h-px w-0 group-hover:w-full bg-tedx-red transition-all duration-700 ease-out mt-3" />
          </div>
        </div>
      </div>

      {/* النافذة المنبثقة (Modal) */}
{isModalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-md transition-opacity duration-300 modal-fade p-0 md:p-4"
    dir={isArabic ? "rtl" : "ltr"}
  >
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={fullName}
      className="relative w-full md:w-full md:max-w-2xl max-h-[90dvh] md:max-h-[85vh] flex flex-col overflow-hidden bg-zinc-900 shadow-2xl rounded-t-[2.5rem] md:rounded-3xl border border-zinc-800 transition-all duration-300 transform modal-slide-up"
    >
      {/* مؤشر السحب للموبايل (Handle) */}
      <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mt-3 md:hidden flex-shrink-0" />

      {/* زر الإغلاق */}
      <button
        onClick={closeModal}
        className="absolute top-4 end-4 z-30 p-2.5 rounded-full bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all duration-200 shadow-md backdrop-blur-sm"
        aria-label={t("close")}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* محتوى المودل القابل للتمرير */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 md:p-8 flex flex-col items-center text-center md:items-start md:text-start">
        
        {/* رأس المودل: الصورة والاسم والمنصب */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 w-full pb-6 border-b border-zinc-800/80">
          
          {/* صورة العضو (دائرية احترافية في الموبايل والديسكتوب) */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl md:rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-xl border-2 border-zinc-700/50">
            {imageSrc ? (
              <SafeImage
                src={imageSrc}
                alt={fullName}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 96px, 112px"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950">
                <span className="text-3xl md:text-4xl font-black text-white/90">
                  {firstLetter}
                </span>
              </div>
            )}
          </div>

          {/* الاسم والمنصب */}
          <div className="flex flex-col justify-center gap-2 flex-1">
            <span className="inline-flex items-center justify-center md:justify-start gap-1.5 px-3 py-1 bg-tedx-red/10 text-tedx-red rounded-full text-xs font-bold w-fit mx-auto md:mx-0">
              {member.role || member.department || ""}
            </span>
            <h3 className={`text-2xl md:text-3xl font-bold text-white tracking-tight ${isArabic ? "font-arabic" : ""}`}>
              {fullName}
            </h3>
          </div>
        </div>

        {/* السيرة الذاتية */}
        {hasBio && (
          <div className="w-full py-6 text-start">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
              {isArabic ? "السيرة الذاتية" : "Biography"}
            </h4>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-sm md:text-base font-normal">
              {member.bio}
            </p>
          </div>
        )}

        {/* زر LinkedIn */}
        {member.linkedinUrl && (
          <div className="w-full pt-2 mt-auto">
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-xl bg-tedx-red text-white hover:bg-tedx-red/90 active:scale-[0.98] transition-all duration-200 text-sm font-semibold shadow-lg shadow-tedx-red/20"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064 2.065 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              {isArabic ? "التواصل عبر لينكد إن" : "Connect on LinkedIn"}
            </a>
          </div>
        )}

      </div>
    </div>
  </div>
)}

{/* إضافة أنيميشن خاصة للـ Modal */}
<style>{`

  .modal-fade {
    animation: modalFadeIn 0.25s ease-out both;
  }
  .modal-slide-up {
    animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes modalSlideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @media (min-width: 768px) {
    @keyframes modalSlideUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .modal-fade, .modal-slide-up { animation: none; }
  }
    
`}</style>
    </>
  );
});

export default TeamMemberCard;