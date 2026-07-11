import Link from "next/link";
import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-16">
      <SectionContainer className="max-w-xl text-center">
        <p className="text-tedx-red font-bold text-sm uppercase tracking-widest mb-4">
          404
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          This idea hasn&apos;t found its stage yet.
        </h1>
        <p className="text-tedx-gray leading-relaxed mb-10">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved. Let&apos;s get you back to something worth exploring.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/" variant="primary" size="md">
            Back to Home
          </Button>
          <Button href="/speakers" variant="outline" size="md">
            Meet the Speakers
          </Button>
        </div>

        <p className="text-sm text-tedx-gray mt-10">
          Or explore:{" "}
          <Link href="/apply" className="underline hover:text-tedx-red">
            Apply
          </Link>{" "}
          ·{" "}
          <Link href="/tickets" className="underline hover:text-tedx-red">
            Tickets
          </Link>{" "}
          ·{" "}
          <Link href="/venue" className="underline hover:text-tedx-red">
            Venue
          </Link>
        </p>
      </SectionContainer>
    </section>
  );
}
