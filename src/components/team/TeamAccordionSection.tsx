"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TeamMember } from "@/lib/types";
import TeamMemberCard from "./TeamMemberCard";

interface TeamFunctionGroupProps {
  functionName: string;
  members: TeamMember[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 350, damping: 28 },
  },
} as const;

function GroupHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
        }}
      />
      <span className="text-[13px] font-semibold text-slate-400/60 uppercase tracking-[0.08em] whitespace-nowrap px-4 py-1.5 bg-slate-400/[0.06] border border-slate-400/[0.08] rounded-full">
        {title}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
        }}
      />
    </div>
  );
}

export default function TeamFunctionGroup({
  functionName,
  members,
}: TeamFunctionGroupProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0e]">
      <div className="max-w-7xl mx-auto">
        <GroupHeader title={functionName} />

        <motion.div
          className="flex flex-wrap justify-center gap-5"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {members.map((member) => (
            <motion.div
              key={member.id}
              className="w-[220px] flex-shrink-0"
              variants={shouldReduceMotion ? {} : itemVariants}
            >
              <TeamMemberCard member={member} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}