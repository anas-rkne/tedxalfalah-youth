export default function FaqLoading() {
  return (
    <section className="section-padding relative bg-background overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-4">
          <div className="h-7 w-32 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
        <div className="h-5 w-96 max-w-full bg-gray-200 rounded animate-pulse mx-auto mb-12" />

        <div className="flex flex-col gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}
