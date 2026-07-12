import SectionContainer from "@/components/ui/SectionContainer";

export default function ScheduleLoading() {
  return (
    <section className="py-16 md:py-24">
      <SectionContainer className="max-w-3xl">
        <div className="h-10 w-48 bg-tedx-gray-light rounded animate-pulse mx-auto mb-4" />
        <div className="h-4 w-40 bg-tedx-gray-light rounded animate-pulse mx-auto mb-12" />

        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-tedx-gray-light rounded-lg animate-pulse"
            />
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
