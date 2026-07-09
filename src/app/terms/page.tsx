import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and Conditions for TEDxAlFalah Youth.",
};

const SECTIONS = [
  {
    title: "Application Terms",
    content:
      "[PLACEHOLDER: eligibility, use of submitted material, selection decisions being final — final legal copy to be supplied by the client.]",
  },
  {
    title: "Ticketing Terms",
    content:
      "[PLACEHOLDER: refunds, transfers, entry conditions — final legal copy to be supplied by the client.]",
  },
  {
    title: "Photography and Filming Consent",
    content:
      "[PLACEHOLDER: consent for attendees and applicants — final legal copy to be supplied by the client.]",
  },
  {
    title: "Data Privacy Statement",
    content:
      "[PLACEHOLDER: how personal data from forms is stored and used — final legal copy to be supplied by the client.]",
  },
  {
    title: "TEDx Licensing Acknowledgement",
    content:
      "[PLACEHOLDER: TEDx licensing acknowledgement — final legal copy to be supplied by the client.]",
  },
  {
    title: "Liability and General Conditions",
    content:
      "[PLACEHOLDER: liability and general conditions — final legal copy to be supplied by the client.]",
  },
];

export default function TermsPage() {
  return (
    <section className="py-16 md:py-24">
      <SectionContainer className="max-w-3xl">
        <h1 className="text-4xl font-bold mb-10">Terms and Conditions</h1>
        <div className="flex flex-col gap-10">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold mb-3">{section.title}</h2>
              <p className="text-tedx-gray leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
