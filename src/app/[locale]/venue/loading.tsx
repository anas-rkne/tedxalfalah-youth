export default function VenueLoading() {
  return (
    <div className="bg-background">
      <div className="relative pt-24 pb-16 md:pt-36 md:pb-28 bg-[#050505] min-h-[60vh] flex flex-col items-center justify-center">
        <div className="max-w-[1000px] mx-auto px-5 w-full flex flex-col items-center text-center">
          <div className="h-8 w-32 bg-zinc-800 rounded-full animate-pulse mb-8" />
          <div className="h-16 w-72 bg-zinc-800 rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-48 bg-zinc-800/60 rounded animate-pulse mb-8" />
          <div className="h-4 w-96 max-w-full bg-zinc-800/40 rounded animate-pulse mb-12" />
          <div className="h-3 w-24 bg-zinc-800/30 rounded animate-pulse" />
        </div>
      </div>

      <section className="section-padding">
        <div className="container-padding max-w-5xl mx-auto text-center">
          <div className="h-7 w-36 bg-gray-200 rounded-full animate-pulse mx-auto mb-4" />
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-1 w-20 bg-gray-200 rounded-full mx-auto mb-6" />
          <div className="h-4 w-full max-w-3xl bg-gray-200 rounded animate-pulse mx-auto mb-2" />
          <div className="h-4 w-5/6 max-w-3xl bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </section>

      <section className="section-padding px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-44 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-80 w-full bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </section>

      <section className="section-padding px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center gap-4 mb-6 justify-center">
            <div className="h-0.5 w-16 bg-gray-200" />
            <div className="h-7 w-36 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-0.5 w-16 bg-gray-200" />
          </div>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </section>

      <section className="section-padding px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mx-auto mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
