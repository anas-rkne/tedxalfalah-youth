"use client";

import { useState } from "react";
import Image from "next/image";
import { Speaker } from "@/lib/types";
import SpeakerModal from "./SpeakerModal";

interface SpeakersGridProps {
  speakers: Speaker[];
}

export default function SpeakersGrid({ speakers }: SpeakersGridProps) {
  const [activeSpeaker, setActiveSpeaker] = useState<Speaker | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {speakers.map((speaker) => (
          <button
            key={speaker.id}
            onClick={() => setActiveSpeaker(speaker)}
            className="text-left group"
          >
            <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">
              <Image
                src={speaker.imageUrl}
                alt={speaker.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h3 className="font-semibold text-lg">{speaker.name}</h3>
            <p className="text-sm text-tedx-gray">{speaker.shortDescriptor}</p>
            <p className="text-sm text-tedx-red mt-1">{speaker.talkTitle}</p>
          </button>
        ))}
      </div>

      <SpeakerModal
        speaker={activeSpeaker}
        onClose={() => setActiveSpeaker(null)}
      />
    </>
  );
}
