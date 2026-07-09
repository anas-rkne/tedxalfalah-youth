import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import TicketRegistrationForm from "@/components/tickets/TicketRegistrationForm";

export const metadata: Metadata = {
  title: "Tickets",
  description: "Get your tickets for TEDxAlFalah Youth.",
};

const TICKET_TYPES = [
  {
    name: "General",
    price: "[Price TBD]",
    includes: ["Full-day access", "All talks", "Access to activations"],
  },
  {
    name: "Student",
    price: "[Price TBD]",
    includes: ["Full-day access", "All talks", "Valid student ID required"],
  },
  {
    name: "Group (5+)",
    price: "[Price TBD]",
    includes: ["Full-day access", "All talks", "Discounted group rate"],
  },
];

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
                key={ticket.name}
                className="p-6 border border-gray-200 rounded-lg text-center flex flex-col"
              >
                <h3 className="font-bold text-lg mb-1">{ticket.name}</h3>
                <p className="text-2xl font-bold text-tedx-red mb-4">
                  {ticket.price}
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
        قرار مطلوب من العميل: تذاكر مدفوعة عبر منصة خارجية (استبدل هذا
        القسم بزر يفتح رابط Platinumlist/Eventbrite) أو حدث مجاني (استخدم
        فورم التسجيل أدناه كما هو). راجع خطوة 13.2 بخطة التنفيذ.
      */}
      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-8">
            Register Now
          </h2>
          <TicketRegistrationForm />
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
