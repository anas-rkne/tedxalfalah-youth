export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative pt-24 pb-16 md:pt-36 md:pb-28 bg-[#050505] min-h-[60vh] flex flex-col items-center justify-center">
        <div className="max-w-[1000px] mx-auto px-5 w-full flex flex-col items-center text-center">
          <div className="h-8 w-32 bg-zinc-800 rounded-full animate-pulse mb-8" />
          <div className="h-16 w-72 bg-zinc-800 rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-48 bg-zinc-800/60 rounded animate-pulse mb-8" />
          <div className="h-4 w-96 max-w-full bg-zinc-800/40 rounded animate-pulse" />
        </div>
      </div>

      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-center gap-2 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`bg-gray-200 rounded-2xl animate-pulse ${
                  i === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                }`}
                style={{ aspectRatio: i === 0 ? "16/10" : i % 3 === 0 ? "3/4" : "4/3" }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
