import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import TextReveal from "@/components/ui/TextReveal";
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
      <section className="section-padding text-center">
        <SectionContainer className="max-w-3xl">
          <TextReveal
            text={t("theme.title")}
            as="h1"
            className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-black"
            serif
          />
          <p className="text-gray-700 leading-relaxed">
            {t("theme.body")}
          </p>
        </SectionContainer>
      </section>

      {/* Who Can Apply */}
      <section className="section-padding">
        <SectionContainer className="max-w-4xl">
          <FadeInView>
            <h2 className="text-3xl font-bold text-center mb-10 text-black">
              {t("whoCanApply.title")}
            </h2>
          </FadeInView>
          <div className="grid md:grid-cols-2 gap-8">
            <FadeInView delay={0.1}>
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-lg mb-2">
                  {t("whoCanApply.youngSpeakers.title")}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t("whoCanApply.youngSpeakers.body")}
                </p>
              </div>
            </FadeInView>
            <FadeInView delay={0.2}>
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-lg mb-2">
                  {t("whoCanApply.experts.title")}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t("whoCanApply.experts.body")}
                </p>
              </div>
            </FadeInView>
          </div>
          <FadeInView delay={0.3}>
            <p className="text-center text-gray-600 mt-8 leading-relaxed">
              {t("whoCanApply.connector")}
            </p>
            <p className="text-center font-bold text-lg mt-6 text-black">
              {t("whoCanApply.everyoneWelcome")}
            </p>
          </FadeInView>
        </SectionContainer>
      </section>

      {/* How Applications Are Reviewed */}
      <section className="section-padding">
        <SectionContainer className="max-w-3xl text-center">
          <FadeInView>
            <h2 className="text-2xl font-bold mb-4 text-black">
              {t("reviewProcess.title")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("reviewProcess.body")}
            </p>
          </FadeInView>
        </SectionContainer>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <SectionContainer>
          <FadeInView>
            <h2 className="text-2xl font-bold text-center mb-12 text-black">
              {t("journey.title")}
            </h2>
          </FadeInView>
          <ApplicationTimeline />
        </SectionContainer>
      </section>

      {/* Form or closed message */}
      <section className="section-padding">
        <SectionContainer>
          <FadeInView>
            {isClosed ? (
              <div className="max-w-xl mx-auto text-center p-8 bg-gray-50 rounded-xl">
                <h2 className="text-2xl font-bold mb-4 text-black">
                  {t("closed.title")}
                </h2>
                <p className="text-gray-600">
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
            <h2 className="text-xl font-bold mb-4 text-black">{t("nonSelection.title")}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t("nonSelection.body")}
            </p>
          </FadeInView>
        </SectionContainer>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-padding">
        <SectionContainer>
          <FadeInView>
            <h2 className="text-2xl font-bold text-center mb-10 text-black">
              {t("faqTitle")}
            </h2>
          </FadeInView>
          <ApplyFAQ />
        </SectionContainer>
      </section>
    </>
  );
}
