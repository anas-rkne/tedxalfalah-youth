"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">
            Something went wrong
          </h1>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
