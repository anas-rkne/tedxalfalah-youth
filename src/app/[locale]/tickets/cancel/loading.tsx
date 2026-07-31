export default function TicketCancelLoading() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center section-padding">
      <div className="max-w-lg w-full mx-auto text-center">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
        <div className="h-10 w-80 max-w-full bg-gray-200 rounded-lg animate-pulse mx-auto mb-6" />
        <div className="h-5 w-64 max-w-full bg-gray-200 rounded animate-pulse mx-auto mb-10" />
        <div className="h-12 w-44 bg-gray-200 rounded-xl animate-pulse mx-auto" />
      </div>
    </section>
  );
}
