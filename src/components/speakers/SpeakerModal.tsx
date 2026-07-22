"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import { InstagramIcon, LinkedinIcon, XIcon as XSocialIcon } from "@/components/ui/SocialIcons";
import { Speaker } from "@/lib/types";

interface SpeakerModalProps {
  speaker: Speaker | null;
  onClose: () => void;
}

export default function SpeakerModal({ speaker, onClose }: SpeakerModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (speaker) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
      requestAnimationFrame(() => {
        const focusable = modalRef.current?.querySelector<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [speaker, handleKeyDown]);

  return (
    <AnimatePresence>
      {speaker && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? {} : { opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="speaker-modal-title"
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            className="bg-card rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden relative outline-none flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
            initial={shouldReduceMotion ? {} : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={shouldReduceMotion ? {} : { scale: 0, opacity: 0 }}
            transition={shouldReduceMotion ? {} : { type: "spring", stiffness: 260, damping: 25 }}
          >
            <motion.button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 end-4 z-10 bg-card rounded-full p-2 shadow-sm hover:shadow-md"
              whileHover={shouldReduceMotion ? {} : { rotate: 360 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <X size={20} className="text-muted-foreground" />
            </motion.button>

            {/* الصورة تأخذ عرض 40% على الشاشات الكبيرة */}
            <div className="relative w-full md:w-2/5 h-64 md:h-auto shrink-0 bg-muted">
              <Image
                src={speaker.imageUrl}
                alt={speaker.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>

            {/* النص يأخذ مساحة الـ flex-1 المتبقية */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              <h2 id="speaker-modal-title" className="text-2xl font-bold text-foreground">
                <span dir="ltr">{speaker.name}</span>
              </h2>
              <p className="text-tedx-red font-medium mb-1">
                {speaker.shortDescriptor}
              </p>
              <p className="text-lg font-semibold text-foreground mb-1">
                {speaker.talkTitle}
              </p>
              <p className="text-sm text-muted-foreground italic mb-4">
                {speaker.themeConnection}
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {speaker.bio}
              </p>

              <div className="flex gap-4 text-muted-foreground">
                {speaker.socialLinks.instagram && (
                  <a
                    href={speaker.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="hover:text-tedx-red transition-colors"
                  >
                    <InstagramIcon size={20} />
                  </a>
                )}
                {speaker.socialLinks.linkedin && (
                  <a
                    href={speaker.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="hover:text-tedx-red transition-colors"
                  >
                    <LinkedinIcon size={20} />
                  </a>
                )}
                {speaker.socialLinks.x && (
                  <a
                    href={speaker.socialLinks.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X"
                    className="hover:text-tedx-red transition-colors"
                  >
                    <XSocialIcon size={20} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}