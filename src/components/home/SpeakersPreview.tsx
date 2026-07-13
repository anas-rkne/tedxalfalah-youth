import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";
import SpeakersCarousel from "@/components/home/SpeakersCarousel";
import { getSpeakers } from "@/lib/data";

export default async function SpeakersPreview() {
  const t = await getTranslations("home.speakersPreview");
  const speakers = (await getSpeakers()).slice(0, 4);

  return (
    <section className="py-16 md:py-24 bg-tedx-gray-light">
      <SectionContainer>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t("heading")}
        </h2>

        <SpeakersCarousel speakers={speakers} />

        <div className="text-center mt-10">
          <Button href="/speakers" variant="outline">
            {t("seeAll")}
          </Button>
        </div>
      </SectionContainer>
    </section>
  );
}
