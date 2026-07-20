import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import ApplicationForm from "@/components/apply/ApplicationForm";
import ApplyFAQ from "@/components/apply/ApplyFAQ";
import ApplyTimeline from "@/components/apply/ApplicationTimeline";
import ApplyHero from "@/components/apply/ApplyHero";
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

/* ═══════════════════════════════════════════════════════════════
   عنوان قسم فرعي — للأقسام الفاتحة
   ═══════════════════════════════════════════════════════════════ */
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center mb-12">
      <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase text-zinc-400 mb-4 px-4 py-1.5 bg-black/[0.03] border border-black/[0.05] rounded-full">
        {label}
      </span>
      <h2
        className="font-bold text-zinc-900 text-center leading-[1.2] tracking-[-0.02em]"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        {title}
      </h2>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   عنوان قسم فرعي — للأقسام الداكنة
   ═══════════════════════════════════════════════════════════════ */
function SectionHeaderDark({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
          }}
        />
        <span className="text-[13px] font-semibold text-slate-400/60 uppercase tracking-[0.08em] whitespace-nowrap px-5 py-2 bg-slate-400/[0.06] border border-slate-400/[0.08] rounded-full">
          {label}
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent)",
          }}
        />
      </div>
      <h2
        className="font-bold text-white text-center leading-[1.2] tracking-[-0.02em]"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        {title}
      </h2>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   فاصل بين الأقسام — فاتح
   ═══════════════════════════════════════════════════════════════ */
function SectionDivider() {
  return (
    <div
      className="h-px max-w-[200px] mx-auto"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   فاصل بين الأقسام — داكن
   ═══════════════════════════════════════════════════════════════ */
function SectionDividerDark() {
  return (
    <div
      className="h-px max-w-[200px] mx-auto"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
      }}
    />
  );
}

export default async function ApplyPage() {
  const t = await getTranslations("page.apply");
  const isClosed = new Date() > new Date(APPLICATION_DEADLINE);

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
          2. من يمكنه التقديم — نسخة داكنة
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0e]">
        <div className="max-w-5xl mx-auto">
          <SectionHeaderDark label="Who Can Apply" title={t("whoCanApply.title")} />

          <div className="grid md:grid-cols-2 gap-5">
            {/* المتحدثون الشباب */}
            <FadeInView delay={0.1}>
              <div
                className="group relative p-8 rounded-[28px] bg-white/[0.03] border border-white/[0.06] overflow-hidden
                hover:border-white/[0.12] hover:bg-white/[0.05]
                hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]
                transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div
                  className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.06), transparent 60%)",
                  }}
                />
                <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-white/[0.06] text-[#e62b1e]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2 tracking-[-0.01em]">
                    {t("whoCanApply.youngSpeakers.title")}
                  </h3>
                  <p className="text-sm text-slate-400/70 leading-[1.7]">
                    {t("whoCanApply.youngSpeakers.body")}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#e62b1e] px-3 py-1.5 bg-[#e62b1e]/[0.08] border border-[#e62b1e]/[0.12] rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e62b1e] opacity-50" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#e62b1e]" />
                    </span>
                    80% من فترات التحدث
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
                className="group relative p-8 rounded-[28px] bg-white/[0.03] border border-white/[0.06] overflow-hidden
                hover:border-white/[0.12] hover:bg-white/[0.05]
                hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]
                transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div
                  className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.06), transparent 60%)",
                  }}
                />
                <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-white/[0.06] text-violet-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2 tracking-[-0.01em]">
                    {t("whoCanApply.experts.title")}
                  </h3>
                  <p className="text-sm text-slate-400/70 leading-[1.7]">
                    {t("whoCanApply.experts.body")}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 px-3 py-1.5 bg-violet-500/[0.08] border border-violet-500/[0.12] rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    20% من فترات التحدث
                  </div>
                </div>

                <div
                  className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 origin-left transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, transparent)" }}
                />
              </div>
            </FadeInView>
          </div>

          <FadeInView delay={0.3}>
            <div className="text-center max-w-lg mx-auto mt-10">
              <p className="text-[15px] text-slate-400/60 leading-[1.8] mb-3">
                {t("whoCanApply.connector")}
              </p>
              <p className="font-bold text-xl text-white tracking-[-0.01em]">
                {t("whoCanApply.everyoneWelcome")}
              </p>
            </div>
          </FadeInView>
        </div>
      </section>

            {/* ═══════════════════════════════════════════════════════════════
          3. كيف تتم المراجعة — نسخة داكنة
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0e]">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInView>
            <SectionHeaderDark label="Review Process" title={t("reviewProcess.title")} />
            <p className="text-[15px] text-slate-400/70 leading-[1.8] max-w-xl mx-auto">
              {t("reviewProcess.body")}
            </p>

            <div className="grid grid-cols-3 gap-4 mt-10">
              {[
                { icon: "✦", label: "الأصالة", desc: "قصة فريدة من نوعها" },
                { icon: "◆", label: "وضوح الفكرة", desc: "رسالة واضحة ومحددة" },
                { icon: "✦", label: "الاستعداد", desc: "الرغبة في التطوير" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] hover:bg-white/[0.05] transition-all duration-300"
                >
                  <div className="text-lg text-[#e62b1e] mb-3">{item.icon}</div>
                  <div className="text-sm font-bold text-white">{item.label}</div>
                  <div className="text-xs text-slate-400/60 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

            {/* ═══════════════════════════════════════════════════════════════
          4. الجدول الزمني (11 مرحلة) — داكن
          ═══════════════════════════════════════════════════════════════ */}
      <ApplyTimeline />

            {/* ═══════════════════════════════════════════════════════════════
          5. نموذج التقديم — نسخة داكنة
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0e]">
        <SectionContainer>
          <FadeInView>
            {isClosed ? (
              <div className="max-w-md mx-auto text-center p-10 rounded-[28px] bg-white/[0.03] border border-white/[0.06]">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-white/[0.06] text-[#e62b1e]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 className="font-bold text-xl text-white mb-2">
                  {t("closed.title")}
                </h2>
                <p className="text-sm text-slate-400/70 leading-[1.7]">
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
          6. رسالة عدم الاختيار — نسخة داكنة
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0e]">
        <div className="max-w-2xl mx-auto text-center">
          <FadeInView>
            <div className="relative p-10 rounded-[28px] bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              <div
                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-50 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.04), transparent 60%)",
                }}
              />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-white/[0.06] text-amber-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                </div>
                <h2 className="font-bold text-lg text-white mb-3">
                  {t("nonSelection.title")}
                </h2>
                <p className="text-sm text-slate-400/70 leading-[1.8]">
                  {t("nonSelection.body")}
                </p>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

            {/* ═══════════════════════════════════════════════════════════════
          7. الأسئلة الشائعة — نسخة داكنة
          ═══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0e]">
        <div className="max-w-3xl mx-auto">
          <FadeInView>
            <SectionHeaderDark label="FAQ" title={t("faqTitle")} />
          </FadeInView>
          <div className="mt-8">
            <ApplyFAQ />
          </div>
        </div>
      </section>
    </div>
  );
}