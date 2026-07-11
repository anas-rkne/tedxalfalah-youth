import SectionContainer from "@/components/ui/SectionContainer";

export default function SponsorsLoading() {
  return (
    <section className="py-16">
      <SectionContainer>
        <div className="h-10 w-64 bg-tedx-gray-light rounded animate-pulse mx-auto mb-6" />
        <div className="h-4 w-full max-w-lg bg-tedx-gray-light rounded animate-pulse mx-auto mb-16" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-lg bg-tedx-gray-light animate-pulse h-32"
            />
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-32 h-16 bg-tedx-gray-light rounded animate-pulse"
            />
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
