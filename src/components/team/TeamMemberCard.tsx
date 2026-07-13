"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { TeamMember } from "@/lib/types";

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
}

export default function TeamMemberCard({ member, index }: TeamMemberCardProps) {
  return (
    <motion.div
      className="text-center p-4 rounded-lg hover:bg-gray-50/50 transition-colors duration-300"
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
        delay: index * 0.15,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden mb-3">
        <Image
          src={member.imageUrl}
          alt={member.name}
          fill
          className="object-cover grayscale hover:grayscale-0 hover:scale-110 transition-all duration-500"
        />
      </div>
      <h3 className="font-semibold">{member.name}</h3>
      <p className="text-sm text-tedx-gray">{member.role}</p>
      {member.quote && (
        <p className="text-xs text-tedx-gray italic mt-1">
          &ldquo;{member.quote}&rdquo;
        </p>
      )}
    </motion.div>
  );
}
