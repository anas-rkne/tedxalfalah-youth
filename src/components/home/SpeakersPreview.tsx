import Image from "next/image";
import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {speakers.map((speaker) => (
            <div key={speaker.id} className="text-center">
              <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3">
                <Image
                  src={speaker.imageUrl}
                  alt={speaker.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-semibold">{speaker.name}</h3>
              <p className="text-sm text-tedx-gray">
                {speaker.shortDescriptor}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button href="/speakers" variant="outline">
            {t("seeAll")}
          </Button>
        </div>
      </SectionContainer>
    </section>
  );
}
