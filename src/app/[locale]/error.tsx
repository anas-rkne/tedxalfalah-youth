"use client";

import { useEffect } from "react";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="min-h-[60vh] flex items-center justify-center section-padding">
      <SectionContainer className="max-w-lg text-center">
        <p className="text-tedx-red font-bold text-sm uppercase tracking-widest mb-4">
          Error
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Something went wrong
        </h1>
        <p className="text-tedx-gray leading-relaxed mb-10">
          An unexpected error occurred. Please try again or return to the
          homepage.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="md" onClick={reset}>
            Try Again
          </Button>
          <Button variant="outline" size="md" href="/">
            Back to Home
          </Button>
        </div>
      </SectionContainer>
    </section>
  );
}
