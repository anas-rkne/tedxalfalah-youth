import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ScheduleItem from "@/components/schedule/ScheduleItem";
import TextReveal from "@/components/ui/TextReveal";
import ScrollReveal from "@/components/ui/ScrollReveal";
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
    <section className="section-padding">
      <SectionContainer className="max-w-3xl">
        <TextReveal
          text={t("title")}
          as="h1"
          className="text-4xl md:text-5xl font-bold text-center mb-4"
          serif
        />
        <ScrollReveal>
          <p className="text-center text-gray-500 mb-2">
            {t("datePlaceholder")}
          </p>
          <p className="text-center text-sm text-gray-500 mb-12">
            {t("timesNote")}
          </p>

          {sessions.length === 0 ? (
            <p className="text-center text-gray-500 py-16">
              {t("empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {sessions.map((session, index) => (
                <ScheduleItem key={session.id} session={session} typeLabels={typeLabels} index={index} />
              ))}
            </div>
          )}
        </ScrollReveal>
      </SectionContainer>
    </section>
  );
}
