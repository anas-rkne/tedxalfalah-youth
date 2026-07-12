import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import ApplicationTimeline from "@/components/apply/ApplicationTimeline";
import ApplicationForm from "@/components/apply/ApplicationForm";
import ApplyFAQ from "@/components/apply/ApplyFAQ";

export const metadata: Metadata = {
  title: "Apply",
  description:
    "Apply to speak at TEDxAlFalah Youth as a Young Speaker (10-14) or an Expert in the field of children and youth.",
};

// TODO: replace with the real application deadline once confirmed by client
const APPLICATION_DEADLINE = "2026-09-30T23:59:59+04:00";

export default function ApplyPage() {
  const isClosed = new Date() > new Date(APPLICATION_DEADLINE);

  return (
    <>
      {/* Theme */}
      <section className="py-16 bg-tedx-black text-tedx-white text-center">
        <SectionContainer className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Tomorrow, Now: Young voices. Real ideas. The future starts
            earlier than we think.
          </h1>
          <p className="text-tedx-white/80 leading-relaxed">
            In the UAE, youth are inventing, creating, performing, competing,
            and asking bold questions. TEDxYouth is a stage for their ideas
            and stories. Real experiences that inspire young people and
            remind adults how powerful youth voices can be.
          </p>
        </SectionContainer>
      </section>

      {/* Who Can Apply */}
      <section className="py-16">
        <SectionContainer className="max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Who Can Apply
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-tedx-gray-light rounded-lg">
              <h3 className="font-bold text-lg mb-2">
                Young Speakers, Ages 10 to 14
              </h3>
              <p className="text-sm text-tedx-gray leading-relaxed">
                The heart of the event. 80% of speaking slots are dedicated
                to youth voices.
              </p>
            </div>
            <div className="p-6 bg-tedx-gray-light rounded-lg">
              <h3 className="font-bold text-lg mb-2">
                Adult Experts in the Field of Children and Youth
              </h3>
              <p className="text-sm text-tedx-gray leading-relaxed">
                The remaining slots are open to adults with strong and
                inspiring stories to share.
              </p>
            </div>
          </div>
          <p className="text-center text-tedx-gray mt-8 leading-relaxed">
            Two worlds that need each other: young people bring the
            questions, the energy, and the ideas; those who work alongside
            them bring the experience, perspective, and proof of what is
            possible when youth voices are taken seriously.
          </p>
          <p className="text-center font-bold text-lg mt-6">
            Everyone is welcome to apply.
          </p>
        </SectionContainer>
      </section>

      {/* How Applications Are Reviewed */}
      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer className="max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">
            How Applications Are Reviewed
          </h2>
          <p className="text-tedx-gray leading-relaxed">
            A dedicated review community will assess every application to
            ensure each story aligns with the event theme, alongside
            originality, clarity of idea, and readiness to develop the talk.
          </p>
        </SectionContainer>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-12">
            Your Application Journey
          </h2>
          <ApplicationTimeline />
        </SectionContainer>
      </section>

      {/* Form or closed message */}
      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          {isClosed ? (
            <div className="max-w-xl mx-auto text-center p-8 bg-tedx-white rounded-lg">
              <h2 className="text-2xl font-bold mb-4">
                Applications Are Now Closed
              </h2>
              <p className="text-tedx-gray">
                Thank you to everyone who applied — stay tuned for
                announcements.
              </p>
            </div>
          ) : (
            <ApplicationForm />
          )}
        </SectionContainer>
      </section>

      {/* Non-selection message */}
      <section className="py-16">
        <SectionContainer className="max-w-2xl text-center">
          <h2 className="text-xl font-bold mb-4">A Note on Selection</h2>
          <p className="text-tedx-gray leading-relaxed">
            If you are not selected, it means nothing more than that we were
            limited in spots. We are confident your story is worth sharing.
            We warmly encourage you to attend the event and to explore other
            platforms to share your story.
          </p>
        </SectionContainer>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <ApplyFAQ />
        </SectionContainer>
      </section>
    </>
  );
}
