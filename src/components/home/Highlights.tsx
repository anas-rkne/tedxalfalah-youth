import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SectionContainer from "@/components/ui/SectionContainer";

export default async function Highlights() {
  const t = await getTranslations("home.highlights");

  // TODO: replace with real figures once confirmed by client
  const STATS = [
    { label: t("statsSpeakers"), value: "12+" },
    { label: t("statsAttendees"), value: "400+" },
    { label: t("statsActivations"), value: "5+" },
  ];

  return (
    <section className="py-16 md:py-24 bg-tedx-white">
      <SectionContainer>
        <div className="grid md:grid-cols-3 gap-8">
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

          <div className="p-8 bg-tedx-black text-tedx-white rounded-lg flex flex-col justify-center gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-sm text-tedx-white/70">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
