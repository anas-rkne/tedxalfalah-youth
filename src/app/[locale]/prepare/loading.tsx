export default function PrepareLoading() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <div className="h-screen bg-zinc-900 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <section key={i} className="section-padding px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="w-28 h-6 rounded-full bg-zinc-800 animate-pulse mx-auto mb-4" />
            <div className="w-48 h-8 bg-zinc-800 animate-pulse mx-auto mb-10 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-24 bg-zinc-800 animate-pulse rounded-2xl" />
              <div className="h-24 bg-zinc-800 animate-pulse rounded-2xl" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
