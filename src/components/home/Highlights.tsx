import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SectionContainer from "@/components/ui/SectionContainer";
import StaggerGrid from "@/components/ui/StaggerGrid";
import AnimatedStats from "@/components/home/AnimatedStats";

export default async function Highlights() {
  const t = await getTranslations("home.highlights");

  const STATS = [
    { label: t("statsSpeakers"), targetValue: 12, suffix: "+" },
    { label: t("statsAttendees"), targetValue: 400, suffix: "+" },
    { label: t("statsActivations"), targetValue: 5, suffix: "+" },
  ];

  return (
    <section className="section-padding bg-tedx-white">
      <SectionContainer>
        <StaggerGrid className="grid md:grid-cols-3 gap-8" staggerDelay={0.1}>
          <Link
            href="/venue"
            className="group block p-8 bg-tedx-gray-light rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-tedx-red">
              {t("venueTitle")}
            </h3>
            <p className="text-sm text-tedx-gray">{t("venueTeaser")}</p>
          </Link>

          <Link
            href="/activations"
            className="group block p-8 bg-tedx-gray-light rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-tedx-red">
              {t("activationsTitle")}
            </h3>
            <p className="text-sm text-tedx-gray">{t("activationsTeaser")}</p>
          </Link>

          <AnimatedStats stats={STATS} />
        </StaggerGrid>
      </SectionContainer>
    </section>
  );
}
