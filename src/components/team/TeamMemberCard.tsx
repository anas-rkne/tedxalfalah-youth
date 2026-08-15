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
  const modalRef = useRef<HTMLDivElement>(null);

  const imageSrc = member.imageUrl;
  const fullName = member.name ?? "";
  const firstLetter = fullName.charAt(0).toUpperCase() || "?";
  const hasBio = !!member.bio;

  const openModal = useCallback(() => {
    if (interactive && hasBio) {
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-3xl shadow-2xl"
          >
            {/* زر الإغلاق */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
              aria-label={t("close")}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row">
                {/* صورة العضو — تمتد بارتفاع البطاقة كاملاً على الشاشات المتوسطة فأكبر */}
                <div className="relative w-full md:w-[38%] md:self-stretch flex-shrink-0">
                  <div className="relative aspect-[3/4] md:aspect-auto md:h-full overflow-hidden rounded-2xl md:rounded-s-3xl md:rounded-e-none bg-zinc-800">
                    {imageSrc ? (
                      <SafeImage
                        src={imageSrc}
                        alt={fullName}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 38vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950">
                        <span className="text-6xl font-black text-white/80">
                          {firstLetter}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* تفاصيل العضو */}
                <div className="w-full md:w-[62%] p-6 md:p-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-tedx-red/10 text-tedx-red rounded-full text-xs font-bold w-fit">
                      {member.role || member.department || ""}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      {fullName}
                    </h3>
                  </div>

                  {/* السيرة الذاتية */}
                  {hasBio && (
                    <div className="mt-2">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                        {member.bio}
                      </p>
                    </div>
                  )}

                  {/* رابط LinkedIn */}
                  {member.linkedinUrl && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-tedx-red hover:text-tedx-red/80 transition-colors duration-200"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064 2.065 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      )}
    </>
  );
});

export default TeamMemberCard;