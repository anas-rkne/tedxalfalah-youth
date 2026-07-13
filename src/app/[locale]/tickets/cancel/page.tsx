import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Payment Cancelled",
};

export default function TicketCancelPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center section-padding">
      <SectionContainer className="max-w-lg text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Checkout Cancelled
        </h1>
        <p className="text-tedx-gray leading-relaxed mb-10">
          No worries — your payment was not processed. You can try again
          whenever you&apos;re ready.
        </p>
        <Button href="/tickets" variant="primary" size="md">
          Back to Tickets
        </Button>
      </SectionContainer>
    </section>
  );
}
