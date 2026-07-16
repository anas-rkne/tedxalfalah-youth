import SectionContainer from "@/components/ui/SectionContainer";

export default function SponsorsLoading() {
  return (
    <section className="section-padding">
      <SectionContainer>
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
        <div className="h-4 w-full max-w-lg bg-gray-200 rounded animate-pulse mx-auto mb-16" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-lg bg-gray-200 animate-pulse h-32"
            />
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-32 h-16 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
