import { Metadata } from "next";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";
import { getActivations } from "@/lib/data";

export const metadata: Metadata = {
  title: "Side Activations",
  description: "The experience beyond the talks at TEDxAlFalah Youth.",
};

export default async function ActivationsPage() {
  const activations = await getActivations();

  return (
    <section className="py-16 md:py-24">
      <SectionContainer>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Side Activations
        </h1>
        <p className="text-center text-tedx-gray max-w-2xl mx-auto mb-16">
          Showcasing the experience beyond the talks.
        </p>

        {activations.length === 0 ? (
          <p className="text-center text-tedx-gray py-16">
            Activations coming soon.
          </p>
        ) : (
          <div className="flex flex-col gap-16">
            {activations.map((activation, index) => (
              <div
                key={activation.id}
                className={`flex flex-col md:flex-row gap-8 items-center ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="relative w-full md:w-1/2 aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={activation.imageUrl}
                    alt={activation.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <h2 className="text-2xl font-bold mb-2">
                    {activation.name}
                  </h2>
                  <p className="text-sm text-tedx-red font-medium mb-3">
                    {activation.locationInVenue}
                  </p>
                  <p className="text-tedx-gray leading-relaxed">
                    {activation.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionContainer>
    </section>
  );
}
