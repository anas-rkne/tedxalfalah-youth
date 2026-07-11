import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import FaqAccordion, { FaqItem } from "@/components/shared/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about attending TEDxAlFalah Youth.",
};

const GENERAL_FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I get to the venue?",
    answer:
      "[PLACEHOLDER: directions summary — full details, map, and parking guidance are on the Venue page.]",
  },
  {
    question: "Are parents and guardians allowed to attend?",
    answer:
      "[PLACEHOLDER: confirm whether parents/guardians of Young Speakers and general attendees are welcome, and whether they need a separate ticket.]",
  },
  {
    question: "Is there an age requirement to attend as a guest?",
    answer:
      "[PLACEHOLDER: age guidance for general attendees, as opposed to Young Speaker applicants specifically.]",
  },
  {
    question: "Will food and drinks be available?",
    answer:
      "[PLACEHOLDER: confirm catering, food trucks, or whether attendees should eat beforehand.]",
  },
  {
    question: "What happens if I arrive late?",
    answer:
      "[PLACEHOLDER: late arrival policy — e.g. entry allowed between talks only.]",
  },
  {
    question: "Is the event accessible for people with disabilities?",
    answer:
      "[PLACEHOLDER: accessibility details — full information is also on the Venue page.]",
  },
  {
    question: "Will the talks be recorded or livestreamed?",
    answer:
      "[PLACEHOLDER: confirm if a recording/livestream will be available afterward.]",
  },
  {
    question: "How can I volunteer or get involved?",
    answer:
      "[PLACEHOLDER: point to a volunteering contact or form, or reference the Contact form on the homepage with subject 'Volunteering'.]",
  },
  {
    question: "I have another question — who do I contact?",
    answer:
      "Reach out via the contact form on our homepage, or email us directly at marhaba@tedxalfalahyouth.com.",
  },
];

export default function FaqPage() {
  return (
    <section className="py-16 md:py-24">
      <SectionContainer>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-center text-tedx-gray max-w-xl mx-auto mb-12">
          Answers to the most common questions from attendees. Looking for
          application-specific questions instead?{" "}
          <a href="/apply#faq" className="underline text-tedx-red">
            See the Apply FAQ
          </a>
          .
        </p>

        <FaqAccordion items={GENERAL_FAQ_ITEMS} />
      </SectionContainer>
    </section>
  );
}
