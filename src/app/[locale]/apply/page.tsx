import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import ApplicationForm from "@/components/apply/ApplicationForm";
import ApplyFAQ from "@/components/apply/ApplyFAQ";
import ApplyHero from "@/components/apply/ApplyHero";
import ApplyTimeline from "@/components/apply/ApplyTimeline";
import SectionBadge from "@/components/ui/SectionBadge";
import SectionHeader from "@/components/shared/SectionHeader";
import { APPLICATION_DEADLINE, SITE_URL } from "@/lib/constants";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.apply" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `${SITE_URL}/${locale}/apply` },
  };
}

export default async function ApplyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page.apply" });
  const isClosed = new Date() > new Date(APPLICATION_DEADLINE);

  return (
    <div>
      {/* 1. HERO */}
      <ApplyHero
        title={t("theme.title")}
        subtitle={t("theme.subtitle")}
        body={t("theme.body")}
        imageUrl="/images/youth-speaker-2.jpg"
        imageAlt="Youth speaker on TEDx stage"
      />

      {/* 2. Who Can Apply */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <SectionHeader label="Who Can Apply" title={t("whoCanApply.title")} />

          <div className="grid md:grid-cols-2 gap-5">
            {/* المتحدثون الشباب */}
            <FadeInView delay={0.1}>
              <div className="group relative p-8 rounded-[28px] bg-card border border-border overflow-hidden hover:border-tedx-red/20 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.04), transparent 60%)" }} />
                <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-tedx-red/10 border border-border text-tedx-red">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2 tracking-[-0.01em]">{t("whoCanApply.youngSpeakers.title")}</h3>
                  <p className="text-sm text-muted-foreground leading-[1.7]">{t("whoCanApply.youngSpeakers.body")}</p>
                  <div className="mt-4">
                    <SectionBadge className="text-[10px]">{t("whoCanApply.youngSpeakersStats")}</SectionBadge>
                  </div>
                </div>
                <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 origin-left transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ background: "linear-gradient(90deg, #e62b1e, #f97316, transparent)" }} />
              </div>
            </FadeInView>

            {/* الخبراء */}
            <FadeInView delay={0.2}>
              <div className="group relative p-8 rounded-[28px] bg-card border border-border overflow-hidden hover:border-tedx-red/20 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.04), transparent 60%)" }} />
                <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-tedx-red/10 border border-border text-tedx-red">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2 tracking-[-0.01em]">{t("whoCanApply.experts.title")}</h3>
                  <p className="text-sm text-muted-foreground leading-[1.7]">{t("whoCanApply.experts.body")}</p>
                  <div className="mt-4">
                    <SectionBadge className="text-[10px]">{t("whoCanApply.expertsStats")}</SectionBadge>
                  </div>
                </div>
                <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 origin-left transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ background: "linear-gradient(90deg, #e62b1e, #f97316, transparent)" }} />
              </div>
            </FadeInView>
          </div>
        </div>
      </section>



      {/* 4. Application Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <SectionContainer>
          <FadeInView>
            {isClosed ? (
              <div className="max-w-md mx-auto text-center p-10 rounded-[28px] bg-card border border-border shadow-sm">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-tedx-red/10 border border-border text-tedx-red">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 className="font-bold text-xl text-foreground mb-2">{t("closed.title")}</h2>
                <p className="text-sm text-muted-foreground leading-[1.7]">{t("closed.body")}</p>
              </div>
            ) : (
              <ApplicationForm />
            )}
          </FadeInView>
        </SectionContainer>
      </section>

      {/* 5. Non‑selection Message */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <FadeInView>
            <div className="relative p-10 rounded-[28px] bg-card border border-border shadow-sm overflow-hidden">
              <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-50 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.03), transparent 60%)" }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4 bg-tedx-red/10 border border-border text-tedx-red">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                </div>
                <h2 className="font-bold text-lg text-foreground mb-3">{t("nonSelection.title")}</h2>
                <p className="text-sm text-muted-foreground leading-[1.8]">{t("nonSelection.body")}</p>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

 
      {/* 7. FAQ */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <FadeInView>
            <SectionHeader label="FAQ" title={t("faqTitle")} />
          </FadeInView>
          <div className="mt-8">
            <ApplyFAQ />
          </div>
        </div>
      </section>
    </div>
  );
}
