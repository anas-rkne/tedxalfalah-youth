import SectionContainer from "@/components/ui/SectionContainer";

export default function Theme() {
  return (
    <section className="py-16 md:py-24 bg-tedx-black text-tedx-white">
      <SectionContainer className="max-w-3xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
          Tomorrow, Now: <br className="hidden md:block" />
          Young voices. Real ideas. <br className="hidden md:block" />
          The future starts earlier than we think.
        </h2>
        <p className="text-tedx-white/80 text-lg leading-relaxed">
          In the UAE, youth are inventing, creating, performing, competing,
          and asking bold questions. TEDxYouth is a stage for their ideas
          and stories. Real experiences that inspire young people and remind
          adults how powerful youth voices can be.
        </p>
      </SectionContainer>
    </section>
  );
}
