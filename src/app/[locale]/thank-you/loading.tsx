export default function ThankYouLoading() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-6" />
          <div className="h-10 w-72 max-w-full bg-gray-200 rounded-lg animate-pulse mx-auto mb-4" />
          <div className="h-5 w-56 max-w-full bg-gray-200 rounded animate-pulse mx-auto mb-8" />
          <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse mx-auto" />
        </div>
      </section>
    </div>
  );
}
