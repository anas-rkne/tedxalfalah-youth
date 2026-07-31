export default function TermsLoading() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative pt-28 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="relative max-w-3xl mx-auto">
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-7 w-36 bg-gray-200 rounded-full animate-pulse mb-5" />
          <div className="h-12 w-80 max-w-full bg-gray-200 rounded-lg animate-pulse mb-4" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </section>

      <section className="pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse mb-8" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-10 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="h-7 w-56 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-full bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 rounded mb-2" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
            </div>
          ))}

          <div className="mt-12 p-8 rounded-2xl bg-gray-100 animate-pulse text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl mx-auto mb-4" />
            <div className="h-6 w-40 bg-gray-200 rounded mx-auto mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto mb-5" />
            <div className="h-12 w-36 bg-gray-200 rounded-xl mx-auto" />
          </div>
        </div>
      </section>
    </div>
  );
}
