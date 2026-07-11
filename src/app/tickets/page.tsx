import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import TicketRegistrationForm from "@/components/tickets/TicketRegistrationForm";
import TicketPurchaseForm from "@/components/tickets/TicketPurchaseForm";
import { TICKET_TYPES } from "@/lib/tickets";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Tickets",
  description: "Get your tickets for TEDxAlFalah Youth.",
};

export default function TicketsPage() {
  return (
    <>
      <section className="py-16">
        <SectionContainer>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
            Tickets
          </h1>
          <div className="grid sm:grid-cols-3 gap-6">
            {TICKET_TYPES.map((ticket) => (
              <div
                key={ticket.id}
                className="p-6 border border-gray-200 rounded-lg text-center flex flex-col"
              >
                <h3 className="font-bold text-lg mb-1">{ticket.name}</h3>
                <p className="text-2xl font-bold text-tedx-red mb-4">
                  {isStripeConfigured ? `${ticket.priceAED} AED` : "[Price TBD]"}
                </p>
                <ul className="text-sm text-tedx-gray space-y-1 flex-1">
                  {ticket.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/*
        هذا القسم يتحول تلقائياً حسب توفر STRIPE_SECRET_KEY:
        - مفعّل → دفع فعلي عبر Stripe Checkout (تذاكر مدفوعة)
        - غير مفعّل → فورم تسجيل مجاني (يُستخدم إن كان الحدث مجانياً، أو
          مؤقتاً قبل تفعيل الدفع). راجع القسم 7.6 بملف DOCUMENTATION.md.
      */}
      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-8">
            {isStripeConfigured ? "Buy Your Ticket" : "Register Now"}
          </h2>
          {isStripeConfigured ? (
            <TicketPurchaseForm ticketTypes={TICKET_TYPES} />
          ) : (
            <TicketRegistrationForm />
          )}
        </SectionContainer>
      </section>

      <section className="py-16">
        <SectionContainer className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Event Day Information</h2>
          <ul className="text-tedx-gray space-y-2">
            <li>
              <strong>Date:</strong> [PLACEHOLDER]
            </li>
            <li>
              <strong>Timing:</strong> [PLACEHOLDER]
            </li>
            <li>
              <strong>Venue:</strong>{" "}
              <a href="/venue" className="underline text-tedx-red">
                View venue details
              </a>
            </li>
            <li>
              <strong>Age Guidance:</strong> [PLACEHOLDER]
            </li>
            <li>
              <strong>What to Bring:</strong> [PLACEHOLDER]
            </li>
          </ul>
        </SectionContainer>
      </section>

      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer className="max-w-3xl text-center">
          <p className="text-sm text-tedx-gray">
            [PLACEHOLDER: refund and transfer policy summary.] See our{" "}
            <a href="/terms" className="underline text-tedx-red">
              Terms and Conditions
            </a>{" "}
            for details.
          </p>
        </SectionContainer>
      </section>
    </>
  );
}
