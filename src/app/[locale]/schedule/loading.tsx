import SectionContainer from "@/components/ui/SectionContainer";

export default function ScheduleLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="relative pt-24 pb-16 md:pt-36 md:pb-28 bg-[#050505] min-h-[60vh] flex flex-col items-center justify-center">
        <div className="max-w-[1000px] mx-auto px-5 w-full flex flex-col items-center text-center">
          <div className="h-8 w-32 bg-zinc-800 rounded-full animate-pulse mb-8" />
          <div className="h-16 w-64 bg-zinc-800 rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-48 bg-zinc-800/60 rounded animate-pulse mb-8" />
          <div className="h-4 w-96 bg-zinc-800/40 rounded animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse mx-auto mb-12" />

          <div className="flex justify-center gap-2 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
