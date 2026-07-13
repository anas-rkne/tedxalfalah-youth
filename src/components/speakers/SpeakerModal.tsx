"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import { InstagramIcon, LinkedinIcon, XIcon as XSocialIcon } from "@/components/ui/SocialIcons";
import { Speaker } from "@/lib/types";

interface SpeakerModalProps {
  speaker: Speaker | null;
  onClose: () => void;
}

export default function SpeakerModal({ speaker, onClose }: SpeakerModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {speaker && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-tedx-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            <motion.button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 bg-tedx-white rounded-full p-2 shadow"
              whileHover={{ rotate: 360 }}
              whileTap={{ scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <X size={20} />
            </motion.button>

            <div className="relative w-full h-64">
              <Image
                src={speaker.imageUrl}
                alt={speaker.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold">{speaker.name}</h2>
              <p className="text-tedx-red font-medium mb-1">
                {speaker.shortDescriptor}
              </p>
              <p className="text-lg font-semibold mb-1">{speaker.talkTitle}</p>
              <p className="text-sm text-tedx-gray italic mb-4">
                {speaker.themeConnection}
              </p>
              <p className="text-tedx-gray leading-relaxed mb-6">
                {speaker.bio}
              </p>

              <div className="flex gap-4">
                {speaker.socialLinks.instagram && (
                  <a
                    href={speaker.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
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
