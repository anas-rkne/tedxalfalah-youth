import SectionContainer from "@/components/ui/SectionContainer";

export default function SpeakersLoading() {
  return (
    <section className="section-padding">
      <SectionContainer>
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
        <div className="h-4 w-96 max-w-full bg-gray-200 rounded animate-pulse mx-auto mb-12" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="w-full aspect-square rounded-lg bg-gray-200 mb-3" />
              <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
