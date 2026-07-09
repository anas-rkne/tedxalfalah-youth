import Link from "next/link";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";
import { getSponsors } from "@/lib/data";

export default async function SponsorsStrip() {
  const sponsors = await getSponsors();

  return (
    <Link href="/sponsors" className="block py-16 bg-tedx-gray-light">
      <SectionContainer>
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-tedx-gray mb-8">
          Our Partners
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="relative w-32 h-16 grayscale hover:grayscale-0 transition-all">
              <Image
                src={sponsor.logoUrl}
                alt={sponsor.name}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </SectionContainer>
    </Link>
  );
}
