import FaqAccordion, { FaqItem } from "@/components/shared/FaqAccordion";

const FAQ_ITEMS: FaqItem[] = [
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
  return <FaqAccordion items={FAQ_ITEMS} />;
}
