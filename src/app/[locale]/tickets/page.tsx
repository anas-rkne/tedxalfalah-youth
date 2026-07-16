import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ScrollReveal from "@/components/ui/ScrollReveal";
import TicketRegistrationForm from "@/components/tickets/TicketRegistrationForm";
import TicketPurchaseForm from "@/components/tickets/TicketPurchaseForm";
import TextReveal from "@/components/ui/TextReveal";
import { TICKET_TYPES } from "@/lib/tickets";
import { isStripeConfigured } from "@/lib/stripe";
import { Link } from "@/i18n/navigation";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.tickets" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function TicketsPage() {
  const t = await getTranslations("page.tickets");

  return (
    <>
      <section className="section-padding">
        <SectionContainer>
          <TextReveal
            text={t("title")}
            as="h1"
            className="heading-h1 text-center mb-12 text-black"
            serif
          />
          <ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {TICKET_TYPES.map((ticket) => (
              <div
                key={ticket.id}
                className="p-6 border border-gray-200 rounded-xl text-center flex flex-col"
              >
                <h3 className="font-bold text-lg mb-1">{t(`ticketNames.${ticket.id}`)}</h3>
                <p className="text-2xl font-bold text-red-600 mb-4">
                  {isStripeConfigured ? `${ticket.priceAED} AED` : t("priceTbd")}
                </p>
                <p className="text-sm text-gray-600 mb-3">{t(`ticketDescriptions.${ticket.id}`)}</p>
                <ul className="text-sm text-gray-500 space-y-1 flex-1">
                  {(t.raw(`ticketIncludes.${ticket.id}`) as string[]).map((item: string) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          </ScrollReveal>
        </SectionContainer>
      </section>

      <ScrollReveal>
      <section className="section-padding">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-8 text-black">
            {isStripeConfigured ? t("buyTitle") : t("registerTitle")}
          </h2>
          {isStripeConfigured ? (
            <TicketPurchaseForm ticketTypes={TICKET_TYPES} />
          ) : (
            <TicketRegistrationForm />
          )}
        </SectionContainer>
      </section>
      </ScrollReveal>

      <ScrollReveal>
      <section className="section-padding">
        <SectionContainer className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-4 text-black">{t("eventDayInfo.title")}</h2>
          <ul className="text-gray-700 space-y-2">
            <li>
              <strong>{t("eventDayInfo.date")}</strong> {t("eventDayInfo.dateValue")}
            </li>
            <li>
              <strong>{t("eventDayInfo.timing")}</strong> {t("eventDayInfo.timingValue")}
            </li>
            <li>
              <strong>{t("eventDayInfo.venue")}</strong>{" "}
              <Link href="/venue" className="underline text-red-600">
                {t("eventDayInfo.venueLink")}
              </Link>
            </li>
            <li>
              <strong>{t("eventDayInfo.ageGuidance")}</strong> {t("eventDayInfo.ageGuidanceValue")}
            </li>
            <li>
              <strong>{t("eventDayInfo.whatToBring")}</strong> {t("eventDayInfo.whatToBringValue")}
            </li>
          </ul>
        </SectionContainer>
      </section>
      </ScrollReveal>

      <ScrollReveal>
      <section className="section-padding">
        <SectionContainer className="max-w-3xl text-center">
          <p className="text-sm text-gray-600">
            {t("refundPolicy.body")}{" "}
            <Link href="/terms" className="underline text-red-600">
              {t("refundPolicy.termsLink")}
            </Link>{" "}
            {t("refundPolicy.forDetails")}
          </p>
        </SectionContainer>
      </section>
      </ScrollReveal>
    </>
  );
}
