"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <motion.div
            key={item.question}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
            whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className={`rounded-2xl border transition-all duration-300 ${
              isOpen 
                ? "bg-white/[0.05] border-white/[0.12] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.2)]" 
                : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1]"
            }`}
          >
            <button
              id={buttonId}
              className="w-full flex items-center justify-between py-5 px-6 text-start gap-4"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className={`text-sm font-semibold transition-colors duration-200 ${
                isOpen ? "text-[#e62b1e]" : "text-white"
              }`}>
                {item.question}
              </span>
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                  isOpen ? "bg-[#e62b1e]/[0.12] text-[#e62b1e] border border-[#e62b1e]/[0.2]" : "bg-white/[0.06] text-slate-400 border border-white/[0.08]"
                }`}
              >
                <ChevronDown size={14} strokeWidth={2.5} />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="answer"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
                  transition={shouldReduceMotion ? {} : { duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-sm text-slate-400/70 leading-[1.8]">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}