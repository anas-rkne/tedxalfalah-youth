"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { TeamMember } from "@/lib/types";

interface TeamMemberCardProps {
  member: TeamMember;
}

export default function TeamMemberCard({ member }: TeamMemberCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="text-center p-4 rounded-lg transition-colors duration-300"
      whileHover={shouldReduceMotion ? {} : { y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden mb-3">
        <Image
          src={member.imageUrl}
          alt={member.name}
          fill
          className="object-cover grayscale hover:grayscale-0 hover:scale-110 transition-all duration-500"
          sizes="96px"
        />
      </div>
      <h3 className="font-semibold">{member.name}</h3>
      <p className="text-sm text-gray-500">{member.role}</p>
      {member.quote && (
        <p className="text-xs text-gray-500 italic mt-1">
          &ldquo;{member.quote}&rdquo;
        </p>
      )}
    </motion.div>
  );
}
