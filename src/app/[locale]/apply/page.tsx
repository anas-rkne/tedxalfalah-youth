import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import ApplicationTimeline from "@/components/apply/ApplicationTimeline";
import ApplicationForm from "@/components/apply/ApplicationForm";
import ApplyFAQ from "@/components/apply/ApplyFAQ";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.apply" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

// TODO: replace with the real application deadline once confirmed by client
const APPLICATION_DEADLINE = "2026-09-30T23:59:59+04:00";

export default async function ApplyPage() {
  const t = await getTranslations("page.apply");
  const isClosed = new Date() > new Date(APPLICATION_DEADLINE);

  return (
    <>
      {/* Theme */}
      <section className="section-padding bg-tedx-black text-tedx-white text-center">
        <SectionContainer className="max-w-3xl">
          <FadeInView>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              {t("theme.title")}
            </h1>
            <p className="text-tedx-white/80 leading-relaxed">
              {t("theme.body")}
            </p>
          </FadeInView>
        </SectionContainer>
      </section>

      {/* Who Can Apply */}
      <section className="section-padding">
        <SectionContainer className="max-w-4xl">
          <FadeInView>
            <h2 className="text-3xl font-bold text-center mb-10">
              {t("whoCanApply.title")}
            </h2>
          </FadeInView>
          <div className="grid md:grid-cols-2 gap-8">
            <FadeInView delay={0.1}>
              <div className="p-6 bg-tedx-gray-light rounded-lg">
                <h3 className="font-bold text-lg mb-2">
                  {t("whoCanApply.youngSpeakers.title")}
                </h3>
                <p className="text-sm text-tedx-gray leading-relaxed">
                  {t("whoCanApply.youngSpeakers.body")}
                </p>
              </div>
            </FadeInView>
            <FadeInView delay={0.2}>
              <div className="p-6 bg-tedx-gray-light rounded-lg">
                <h3 className="font-bold text-lg mb-2">
                  {t("whoCanApply.experts.title")}
                </h3>
                <p className="text-sm text-tedx-gray leading-relaxed">
                  {t("whoCanApply.experts.body")}
                </p>
              </div>
            </FadeInView>
          </div>
          <FadeInView delay={0.3}>
            <p className="text-center text-tedx-gray mt-8 leading-relaxed">
              {t("whoCanApply.connector")}
            </p>
            <p className="text-center font-bold text-lg mt-6">
              {t("whoCanApply.everyoneWelcome")}
            </p>
          </FadeInView>
        </SectionContainer>
      </section>

      {/* How Applications Are Reviewed */}
      <section className="py-16 bg-tedx-gray-light">
        <SectionContainer className="max-w-3xl text-center">
          <FadeInView>
            <h2 className="text-2xl font-bold mb-4">
              {t("reviewProcess.title")}
            </h2>
            <p className="text-tedx-gray leading-relaxed">
              {t("reviewProcess.body")}
            </p>
          </FadeInView>
        </SectionContainer>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <SectionContainer>
          <FadeInView>
            <h2 className="text-2xl font-bold text-center mb-12">
              {t("journey.title")}
            </h2>
          </FadeInView>
          <ApplicationTimeline />
        </SectionContainer>
      </section>

      {/* Form or closed message */}
      <section className="section-padding bg-tedx-gray-light">
        <SectionContainer>
          <FadeInView>
            {isClosed ? (
              <div className="max-w-xl mx-auto text-center p-8 bg-tedx-white rounded-lg">
                <h2 className="text-2xl font-bold mb-4">
                  {t("closed.title")}
                </h2>
                <p className="text-tedx-gray">
                  {t("closed.body")}
                </p>
              </div>
            ) : (
              <ApplicationForm />
            )}
          </FadeInView>
        </SectionContainer>
      </section>

      {/* Non-selection message */}
      <section className="section-padding">
        <SectionContainer className="max-w-2xl text-center">
          <FadeInView>
            <h2 className="text-xl font-bold mb-4">{t("nonSelection.title")}</h2>
            <p className="text-tedx-gray leading-relaxed">
              {t("nonSelection.body")}
            </p>
          </FadeInView>
        </SectionContainer>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-tedx-gray-light">
        <SectionContainer>
          <FadeInView>
            <h2 className="text-2xl font-bold text-center mb-10">
              {t("faqTitle")}
            </h2>
          </FadeInView>
          <ApplyFAQ />
        </SectionContainer>
      </section>
    </>
  );
}
