"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Who is eligible for the Young Speaker track?",
    answer:
      "[PLACEHOLDER: eligibility details for ages 10-14 to be confirmed by client.]",
  },
  {
    question: "Who is eligible for the Expert track?",
    answer:
      "[PLACEHOLDER: eligibility details for adult experts to be confirmed by client.]",
  },
  {
    question: "What language should the talk be in?",
    answer: "[PLACEHOLDER: language requirements to be confirmed by client.]",
  },
  {
    question: "Will I receive coaching support?",
    answer:
      "[PLACEHOLDER: details on coaching and talk development support.]",
  },
  {
    question: "What is the time commitment if selected?",
    answer:
      "[PLACEHOLDER: expected time commitment for coaching, rehearsals, and event day.]",
  },
];

export default function ApplyFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto flex flex-col divide-y divide-gray-200 border-t border-b border-gray-200">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              className="w-full flex items-center justify-between py-4 text-left font-medium"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              {item.question}
              <ChevronDown
                size={18}
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <p className="pb-4 text-sm text-tedx-gray leading-relaxed">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
