import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ScheduleItem from "@/components/schedule/ScheduleItem";
import { getSessions } from "@/lib/data";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.schedule" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function SchedulePage() {
  const sessions = await getSessions();
  const t = await getTranslations("page.schedule");

  const typeLabels = {
    talk: t("typeLabels.talk"),
    break: t("typeLabels.break"),
    activation: t("typeLabels.activation"),
    registration: t("typeLabels.registration"),
  };

  return (
    <section className="py-16 md:py-24">
      <SectionContainer className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          {t("title")}
        </h1>
        <p className="text-center text-tedx-gray mb-2">
          {t("datePlaceholder")}
        </p>
        <p className="text-center text-sm text-tedx-gray mb-12">
          {t("timesNote")}
        </p>

        {sessions.length === 0 ? (
          <p className="text-center text-tedx-gray py-16">
            {t("empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <ScheduleItem key={session.id} session={session} typeLabels={typeLabels} />
            ))}
          </div>
        )}
      </SectionContainer>
    </section>
  );
}
