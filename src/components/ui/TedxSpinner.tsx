export default function TedxSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-tedx-gray-light" />
        <div className="absolute inset-0 rounded-full border-4 border-tedx-red border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-tedx-gray uppercase tracking-widest">
        Loading
      </p>
    </div>
  );
}
