"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { TeamMember } from "@/lib/types";
import TeamMemberCard from "./TeamMemberCard";

interface TeamAccordionSectionProps {
  departmentName: string;
  members: TeamMember[];
  defaultOpen?: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 25 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function TeamAccordionSection({
  departmentName,
  members,
  defaultOpen = false,
}: TeamAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-2xl font-bold mb-2 border-b border-gray-200 pb-2"
      >
        <span>{departmentName}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown size={24} />
        </motion.span>
      </button>

      <AnimatePresence mode="popLayout">
        {isOpen && (
          <motion.div
            key="card-grid"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            layout
          >
            {members.map((member, index) => (
              <motion.div key={member.id} variants={childVariants} layout>
                <TeamMemberCard member={member} index={index} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
