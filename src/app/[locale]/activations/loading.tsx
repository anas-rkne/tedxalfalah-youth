import SectionContainer from "@/components/ui/SectionContainer";

export default function ActivationsLoading() {
  return (
    <section className="section-padding">
      <SectionContainer>
        <div className="h-10 w-64 bg-tedx-gray-light rounded animate-pulse mx-auto mb-4" />
        <div className="h-4 w-80 max-w-full bg-tedx-gray-light rounded animate-pulse mx-auto mb-16" />

        <div className="flex flex-col gap-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`flex flex-col md:flex-row gap-8 items-center animate-pulse ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="w-full md:w-1/2 aspect-video rounded-lg bg-tedx-gray-light" />
              <div className="w-full md:w-1/2 flex flex-col gap-3">
                <div className="h-6 w-48 bg-tedx-gray-light rounded" />
                <div className="h-4 w-24 bg-tedx-gray-light rounded" />
                <div className="h-4 w-full bg-tedx-gray-light rounded" />
                <div className="h-4 w-5/6 bg-tedx-gray-light rounded" />
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
