export default function ApplyLoading() {
  return (
    <div className="bg-background">
      <div className="relative pt-24 pb-16 md:pt-36 md:pb-28 bg-[#050505] min-h-[60vh] flex flex-col items-center justify-center">
        <div className="max-w-[1000px] mx-auto px-5 w-full flex flex-col items-center text-center">
          <div className="h-8 w-32 bg-zinc-800 rounded-full animate-pulse mb-8" />
          <div className="h-16 w-72 bg-zinc-800 rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-48 bg-zinc-800/60 rounded animate-pulse mb-8" />
          <div className="h-4 w-96 max-w-full bg-zinc-800/40 rounded animate-pulse" />
        </div>
      </div>

      <section className="section-padding">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-32 w-full bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse mt-4" />
          </div>
        </div>
      </section>

      <section className="section-padding px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-44 bg-gray-200 rounded animate-pulse mx-auto mb-8" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b border-gray-200 py-5 animate-pulse">
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
