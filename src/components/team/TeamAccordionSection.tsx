"use client";

import { motion } from "framer-motion";
import { TeamMember } from "@/lib/types";
import TeamMemberCard from "./TeamMemberCard";

export default function TeamFunctionGroup({
  functionName,
  members,
}: {
  functionName: string;
  members: TeamMember[];
}) {
  return (
    <section className="relative z-10">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="text-[11px] font-bold text-[#e62b1e] uppercase tracking-[0.15em]">{functionName}</div>
        
        {/* ✅ تم استبدال bg-white/10 بـ bg-border ليظهر كخط رمادي على الخلفية البيضاء */}
        <div className="flex-1 h-px bg-border" />
        
        {/* ✅ تم استبدال opacity-40 بـ text-muted-foreground ليكون النص رمادياً واضحاً */}
        <span className="text-[10px] text-muted-foreground">
          {members.length < 10 ? `0${members.length}` : members.length}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            <TeamMemberCard member={member} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}