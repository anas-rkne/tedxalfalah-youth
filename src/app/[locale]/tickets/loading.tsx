export default function TicketsLoading() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative pt-28 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="h-8 w-40 bg-gray-200 rounded-full animate-pulse mx-auto mb-5" />
          <div className="h-14 w-96 max-w-full bg-gray-200 rounded-lg animate-pulse mx-auto mb-5" />
          <div className="h-5 w-72 max-w-full bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </section>

      <section className="pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="rounded-3xl border border-gray-200 p-8 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4" />
            <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-8" />
            <div className="h-12 w-full bg-gray-200 rounded-xl mb-4" />
            <div className="h-4 w-56 bg-gray-200 rounded mx-auto" />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="h-7 w-32 bg-gray-200 rounded-full animate-pulse mx-auto mb-3" />
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-7 w-40 bg-gray-200 rounded-full animate-pulse mx-auto mb-3" />
          <div className="h-8 w-52 bg-gray-200 rounded animate-pulse mx-auto mb-10" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-3" />
                <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
