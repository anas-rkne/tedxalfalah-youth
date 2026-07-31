export default function ContactLoading() {
  return (
    <section className="section-padding bg-background min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-7 w-28 bg-gray-200 rounded-full animate-pulse mx-auto mb-4" />
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-3" />
          <div className="h-5 w-72 max-w-full bg-gray-200 rounded animate-pulse mx-auto" />
        </div>

        <div className="flex flex-col gap-5">
          <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-32 w-full bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-12 w-36 bg-gray-200 rounded-xl animate-pulse mt-2" />
        </div>
      </div>
    </section>
  );
}
