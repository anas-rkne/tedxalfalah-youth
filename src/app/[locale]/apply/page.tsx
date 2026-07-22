import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import ApplicationForm from "@/components/apply/ApplicationForm";
import ApplyFAQ from "@/components/apply/ApplyFAQ";
import ApplyTimeline from "@/components/apply/ApplicationTimeline"; // ✅ تم إصلاح مسار الاستيراد
import ApplyHero from "@/components/apply/ApplyHero";
import SectionBadge from "@/components/ui/SectionBadge";
import { Metadata } from "next";
import { Clock, CheckCircle2, Circle, Users, Mic2, Award, PartyPopper } from "lucide-react";

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

/* ═══════════════════════════════════════════════════════════════
   عنوان قسم فرعي — للأقسام الفاتحة
   ═══════════════════════════════════════════════════════════════ */
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center mb-12">
      <div className="flex justify-center mb-4">
        <SectionBadge>{label}</SectionBadge>
      </div>
      <h2 className="heading-h2 text-center">{title}</h2>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   عنوان قسم فرعي — للأقسام الداكنة
   ═══════════════════════════════════════════════════════════════ */
function SectionHeaderDark({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center mb-12">
      <div className="flex justify-center mb-4">
        <SectionBadge className="bg-white/10 border-white/20 text-white">
          {label}
        </SectionBadge>
      </div>
      <h2 className="heading-h2 text-white text-center">{title}</h2>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   فاصل بين الأقسام — فاتح
   ═══════════════════════════════════════════════════════════════ */
function SectionDivider() {
  return (
    <div className="h-px max-w-[200px] mx-auto bg-gradient-to-r from-transparent via-border to-transparent" />
  );
}

/* ═══════════════════════════════════════════════════════════════
   فاصل بين الأقسام — داكن
   ═══════════════════════════════════════════════════════════════ */
function SectionDividerDark() {
  return (
    <div className="h-px max-w-[200px] mx-auto bg-gradient-to-r from-transparent via-border/30 to-transparent" />
  );
}

export default async function ApplyPage() {
  const t = await getTranslations("page.apply");
  const isClosed = new Date() > new Date(APPLICATION_DEADLINE);

  // ✅ تجميع بيانات الجدول الزمني من الترجمة
  const rawPhases = t.raw("timeline.phases") as Array<{
    title: string;
    date?: string;
    dateRange?: string;
    description: string;
    whatToExpect: string;
  }>;

  // تعيين الأيقونات حسب ترتيب المراحل
  const icons = [
    <Clock size={16} key="icon-1" />,
    <Circle size={16} key="icon-2" />,
    <Users size={16} key="icon-3" />,
    <CheckCircle2 size={16} key="icon-4" />,
    <Mic2 size={16} key="icon-5" />,
    <CheckCircle2 size={16} key="icon-6" />,
    <Mic2 size={16} key="icon-7" />,
    <Award size={16} key="icon-8" />,
    <Users size={16} key="icon-9" />,
    <Mic2 size={16} key="icon-10" />,
    <PartyPopper size={16} key="icon-11" />,
  ];

  const phases = rawPhases.map((phase, index) => ({
    id: index + 1,
    ...phase,
    icon: icons[index],
  }));

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO — الموضوع (بارالكس كامل)
          ═══════════════════════════════════════════════════════════════ */}
      <ApplyHero
        title={t("theme.title")}
        subtitle={t("theme.subtitle")}
        body={t("theme.body")}
        imageUrl="/images/youth-speaker-2.jpg"
        imageAlt="Youth speaker on TEDx stage"
      />

      {/* ═══════════════════════════════════════════════════════════════
          2. من يمكنه التقديم — تم توحيد الألوان والشارات
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <SectionHeader label="Who Can Apply" title={t("whoCanApply.title")} />

          <div className="grid md:grid-cols-2 gap-5">
            {/* المتحدثون الشباب */}
            <FadeInView delay={0.1}>
              <div
                className="group relative p-8 rounded-[28px] bg-card border border-border overflow-hidden
                hover:border-tedx-red/20 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]
                transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div
                  className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.04), transparent 60%)",
                  }}
                />
                <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]" />

                <div className="relative z-10">
                  {/* ✅ أيقونة موحدة بلون TEDx */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-tedx-red/10 border border-border text-tedx-red">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2 tracking-[-0.01em]">
                    {t("whoCanApply.youngSpeakers.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-[1.7]">
                    {t("whoCanApply.youngSpeakers.body")}
                  </p>
                  
                  {/* ✅ الشارة المترجمة الآن */}
                  <div className="mt-4">
                    <SectionBadge className="text-[10px]">
                      {t("whoCanApply.youngSpeakersStats")}
                    </SectionBadge>
                  </div>
                </div>

                <div
                  className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 origin-left transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ background: "linear-gradient(90deg, #e62b1e, #f97316, transparent)" }}
                />
              </div>
            </FadeInView>

            {/* الخبراء */}
            <FadeInView delay={0.2}>
              <div
                className="group relative p-8 rounded-[28px] bg-card border border-border overflow-hidden
                hover:border-tedx-red/20 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]
                transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div
                  className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.04), transparent 60%)",
                  }}
                />
                <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]" />

                <div className="relative z-10">
                  {/* ✅ أيقونة موحدة بلون TEDx */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-tedx-red/10 border border-border text-tedx-red">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2 tracking-[-0.01em]">
                    {t("whoCanApply.experts.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-[1.7]">
                    {t("whoCanApply.experts.body")}
                  </p>
                  
                  {/* ✅ الشارة المترجمة الآن */}
                  <div className="mt-4">
                    <SectionBadge className="text-[10px]">
                      {t("whoCanApply.expertsStats")}
                    </SectionBadge>
                  </div>
                </div>

                <div
                  className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 origin-left transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ background: "linear-gradient(90deg, #e62b1e, #f97316, transparent)" }}
                />
              </div>
            </FadeInView>
          </div>

          <FadeInView delay={0.3}>
            <div className="text-center max-w-lg mx-auto mt-10">
              <p className="text-[15px] text-muted-foreground leading-[1.8] mb-3">
                {t("whoCanApply.connector")}
              </p>
              <p className="font-bold text-xl text-foreground tracking-[-0.01em]">
                {t("whoCanApply.everyoneWelcome")}
              </p>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. كيف تتم المراجعة — تم توحيد الألوان
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInView>
            <SectionHeader label="Review Process" title={t("reviewProcess.title")} />
            <p className="text-[15px] text-muted-foreground leading-[1.8] max-w-xl mx-auto">
              {t("reviewProcess.body")}
            </p>

            <div className="grid grid-cols-3 gap-4 mt-10">
              {t.raw("reviewProcess.items").map((item: { label: string; desc: string }, i: number) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-tedx-red/30 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] transition-all duration-300"
                >
                  <div className="text-lg text-tedx-red mb-3">
                    {/* يمكنك استخدام أيقونات مخصصة هنا حسب الترتيب */}
                    {i === 0 ? "✦" : i === 1 ? "◆" : "✦"}
                  </div>
                  <div className="text-sm font-bold text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. الجدول الزمني (11 مرحلة) — مترجم بالكامل
          ═══════════════════════════════════════════════════════════════ */}
      <ApplyTimeline
        title={t("timeline.title")}
        expectLabel={t("timeline.expectLabel")}
        phases={phases}
        activePhase={1}
      />

      {/* ═══════════════════════════════════════════════════════════════
          5. نموذج التقديم — تم توحيد الألوان
          ═══════════════════════════════════════════════════════════════ */}
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
                <h2 className="font-bold text-xl text-foreground mb-2">
                  {t("closed.title")}
                </h2>
                <p className="text-sm text-muted-foreground leading-[1.7]">
                  {t("closed.body")}
                </p>
              </div>
            ) : (
              <ApplicationForm />
            )}
          </FadeInView>
        </SectionContainer>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          6. رسالة عدم الاختيار — تم توحيد الألوان
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <FadeInView>
            <div className="relative p-10 rounded-[28px] bg-card border border-border shadow-sm overflow-hidden">
              <div
                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-50 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.03), transparent 60%)",
                }}
              />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4 bg-tedx-red/10 border border-border text-tedx-red">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                </div>
                <h2 className="font-bold text-lg text-foreground mb-3">
                  {t("nonSelection.title")}
                </h2>
                <p className="text-sm text-muted-foreground leading-[1.8]">
                  {t("nonSelection.body")}
                </p>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          7. الأسئلة الشائعة — تم توحيد الألوان
          ═══════════════════════════════════════════════════════════════ */}
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