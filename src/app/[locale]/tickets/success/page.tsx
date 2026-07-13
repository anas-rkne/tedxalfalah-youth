import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Payment Successful",
};

export default function TicketSuccessPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center section-padding">
      <SectionContainer className="max-w-lg text-center">
        <p className="text-tedx-red font-bold text-sm uppercase tracking-widest mb-4">
          Payment Successful
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          You&apos;re going to TEDxAlFalah Youth! 🎉
        </h1>
        <p className="text-tedx-gray leading-relaxed mb-10">
          A confirmation email with your ticket details is on its way to
          your inbox. See you on event day!
        </p>
        <Button href="/venue" variant="primary" size="md">
          View Venue Details
        </Button>
      </SectionContainer>
    </section>
  );
}
