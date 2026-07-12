import { Metadata } from "next";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";

export const metadata: Metadata = {
  title: "The Venue",
  description: "Where TEDxAlFalah Youth comes to life.",
};

export default function VenuePage() {
  return (
    <>
      <section className="relative h-[50vh] min-h-[350px]">
        <Image
          src="/mock/hero-placeholder.svg"
          alt="Venue hero"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-tedx-white text-center px-4">
            [PLACEHOLDER: Venue Name]
          </h1>
        </div>
      </section>

      <section className="py-16">
        <SectionContainer className="max-w-3xl">
          <p className="text-tedx-gray leading-relaxed">
            [PLACEHOLDER: short narrative on why this venue was chosen and
            its connection to the community — to be provided by the client.]
          </p>
        </SectionContainer>
      </section>

      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold mb-6">Getting There</h2>
          <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
            <iframe
              title="Venue map"
              src="https://www.google.com/maps?q=Dubai&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
          <p className="text-sm text-tedx-gray">
            [PLACEHOLDER: parking guidance and directions to be provided by
            the client.]
          </p>
        </SectionContainer>
      </section>

      <section className="py-16">
        <SectionContainer className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Accessibility</h2>
          <p className="text-tedx-gray leading-relaxed">
            [PLACEHOLDER: accessibility information to be provided by the
            client.]
          </p>
        </SectionContainer>
      </section>

      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold mb-6">Photo Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-video rounded-lg overflow-hidden"
              >
                <Image
                  src="/mock/activation-placeholder.svg"
                  alt={`Venue photo ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>
    </>
  );
}
