import { Metadata } from "next";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";
import PartnerInquiryForm from "@/components/sponsors/PartnerInquiryForm";
import { getSponsors } from "@/lib/data";
import { SponsorTier } from "@/lib/types";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "Partner with TEDxAlFalah Youth and invest in young voices.",
};

const TIERS: { name: SponsorTier; benefits: string[] }[] = [
  {
    name: "Platinum",
    benefits: ["Top logo placement", "Stage recognition", "VIP seats"],
  },
  {
    name: "Gold",
    benefits: ["Logo on website", "Social media mentions"],
  },
  {
    name: "Silver",
    benefits: ["Logo on website", "Event day signage"],
  },
  {
    name: "Community",
    benefits: ["Listed as community supporter"],
  },
];

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <>
      <section className="py-16">
        <SectionContainer className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Become a Partner
          </h1>
          <p className="text-tedx-gray leading-relaxed">
            [PLACEHOLDER: opening statement on why partners support
            TEDxAlFalah Youth and the value of investing in young voices —
            to be provided by the client.]
          </p>
        </SectionContainer>
      </section>

      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-10">
            Sponsorship Tiers
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="p-6 bg-tedx-white rounded-lg text-center"
              >
                <h3 className="font-bold text-lg mb-3">{tier.name}</h3>
                <ul className="text-sm text-tedx-gray space-y-1">
                  {tier.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-tedx-gray mt-8">
            Full packages available on request.
          </p>
        </SectionContainer>
      </section>

      {sponsors.length > 0 && (
        <section className="py-16">
          <SectionContainer>
            <h2 className="text-2xl font-bold text-center mb-10">
              Current Partners
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              {sponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.websiteUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-32 h-16"
                >
                  <Image
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    fill
                    className="object-contain"
                  />
                </a>
              ))}
            </div>
          </SectionContainer>
        </section>
      )}

      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <h2 className="text-2xl font-bold text-center mb-2">
            Become a Partner
          </h2>
          <p className="text-center text-sm text-tedx-gray mb-8">
            Interested in partnering? Send us a message.
          </p>
          <PartnerInquiryForm />
          <p className="text-center text-sm mt-8">
            <a
              href="/sponsorship-deck.pdf"
              className="underline text-tedx-red"
            >
              Download Sponsorship Deck (PDF)
            </a>
          </p>
        </SectionContainer>
      </section>
    </>
  );
}
