import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import ScheduleItem from "@/components/schedule/ScheduleItem";
import { getSessions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "The full event-day timeline for TEDxAlFalah Youth — talks, breaks, and activations.",
};

export default async function SchedulePage() {
  const sessions = await getSessions();

  return (
    <section className="py-16 md:py-24">
      <SectionContainer className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Schedule
        </h1>
        <p className="text-center text-tedx-gray mb-2">
          [PLACEHOLDER: event date to be confirmed by client]
        </p>
        <p className="text-center text-sm text-tedx-gray mb-12">
          Times are approximate and may shift slightly on event day.
        </p>

        {sessions.length === 0 ? (
          <p className="text-center text-tedx-gray py-16">
            Full schedule coming soon.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <ScheduleItem key={session.id} session={session} />
            ))}
          </div>
        )}
      </SectionContainer>
    </section>
  );
}
