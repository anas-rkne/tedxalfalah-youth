import SectionContainer from "@/components/ui/SectionContainer";

export default function About() {
  return (
    <section className="py-16 md:py-24 bg-tedx-white">
      <SectionContainer className="max-w-3xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          About the Event
        </h2>
        <p className="text-tedx-gray text-lg leading-relaxed mb-4">
          [PLACEHOLDER: short paragraph on TEDxAlFalah Youth, its purpose,
          and who it serves — to be provided by the client.]
        </p>
        <p className="text-sm text-tedx-gray italic">
          TEDxAlFalah Youth is organized independently and operated under
          license from TED.
        </p>
      </SectionContainer>
    </section>
  );
}
