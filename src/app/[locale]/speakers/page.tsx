import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import SpeakersGrid from "@/components/speakers/SpeakersGrid";
import { getSpeakers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Speakers",
  description:
    "Meet the young speakers and adult experts taking the stage at TEDxAlFalah Youth.",
};

export default async function SpeakersPage() {
  const speakers = await getSpeakers();

  return (
    <section className="py-16 md:py-24">
      <SectionContainer>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Meet the Speakers
        </h1>
        <p className="text-center text-tedx-gray max-w-2xl mx-auto mb-12">
          Speakers are announced in waves as our lineup is confirmed. Check
          back for updates.
        </p>

        {speakers.length > 0 ? (
          <SpeakersGrid speakers={speakers} />
        ) : (
          <p className="text-center text-tedx-gray py-16">
            Speakers coming soon.
          </p>
        )}
      </SectionContainer>
    </section>
  );
}
