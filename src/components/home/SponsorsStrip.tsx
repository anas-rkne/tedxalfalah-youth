import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import { getSponsors } from "@/lib/data";

export default async function SponsorsStrip() {
  const t = await getTranslations("home.sponsorsStrip");
  const sponsors = await getSponsors();

  return (
    <Link href="/sponsors" className="block py-16 bg-tedx-gray-light">
      <SectionContainer>
        <FadeInView>
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-tedx-gray mb-8">
            {t("heading")}
          </h2>
        </FadeInView>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sponsors.map((sponsor, index) => (
            <FadeInView key={sponsor.id} delay={index * 0.08}>
              <div className="relative w-32 h-16 grayscale hover:grayscale-0 transition-all">
                <Image
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  fill
                  className="object-contain"
                />
              </div>
            </FadeInView>
          ))}
        </div>
      </SectionContainer>
    </Link>
  );
}
