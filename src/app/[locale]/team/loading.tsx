import SectionContainer from "@/components/ui/SectionContainer";

export default function TeamLoading() {
  return (
    <section className="section-padding">
      <SectionContainer>
        <div className="h-10 w-56 bg-gray-200 rounded animate-pulse mx-auto mb-16" />

        <div className="flex flex-col gap-16">
          {Array.from({ length: 2 }).map((_, sectionIdx) => (
            <div key={sectionIdx}>
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center animate-pulse">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 mb-3" />
                    <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-2" />
                    <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
