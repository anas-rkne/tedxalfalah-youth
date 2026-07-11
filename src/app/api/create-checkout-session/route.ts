import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getTicketTypeById, toFils } from "@/lib/tickets";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const checkoutSchema = z.object({
  ticketTypeId: z.string().min(1),
  quantity: z.coerce.number().min(1).max(10),
  email: z.string().email(),
  name: z.string().min(1),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isStripeConfigured || !stripe) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 }
    );
  }

  const { allowed } = await checkRateLimit(request, "checkout");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const isHuman = await verifyTurnstile(parsed.data.turnstileToken);
  if (!isHuman) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 403 }
    );
  }

  // السعر يُقرأ من src/lib/tickets.ts (مصدر موثوق بالخادم) فقط — لا
  // نثق أبداً بأي سعر قد يُرسَل من الواجهة الأمامية، لمنع التلاعب به.
  const ticketType = getTicketTypeById(parsed.data.ticketTypeId);
  if (!ticketType) {
    return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: parsed.data.email,
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `TEDxAlFalah Youth — ${ticketType.name} Ticket`,
              description: ticketType.description,
            },
            unit_amount: toFils(ticketType.priceAED),
          },
          quantity: parsed.data.quantity,
        },
      ],
      metadata: {
        ticketTypeId: ticketType.id,
        buyerName: parsed.data.name,
      },
      success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tickets/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 }
    );
  }
}
