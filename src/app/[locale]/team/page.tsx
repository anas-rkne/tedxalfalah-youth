// src/app/[locale]/team/page.tsx
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { getTeamMembers } from "@/lib/data";
import DarkHeroSection from "@/components/shared/DarkHeroSection";
import TeamMemberCard from "@/components/team/TeamMemberCard";
import JsonLd from "@/components/JsonLd";
import { personSchema } from "@/lib/json-ld";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.team" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const members = await getTeamMembers();
  const t = await getTranslations({ locale, namespace: "page.team" });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#e62b1e] selection:text-white pb-32 overflow-hidden relative">
      {members.map((m) => (
        <JsonLd
          key={m.id}
          data={personSchema({
            name: m.name,
            description: m.role,
            image: m.imageUrl,
          })}
        />
      ))}
      {/* ═══════════ HERO ═══════════ */}
      <DarkHeroSection
        badgeLabel={t("hero.badge")}
        mainTitle={t("hero.mainTitle")}
        highlightTitle={t("hero.highlightTitle")}
        description={t("meta.description")}
        discoverLabel={t("hero.discoverLabel")}
        isArabic={isArabic}
      />

      {/* ═══════════ TITLE ═══════════ */}
      <section className="section-padding bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="heading-h1 font-arabic text-center mb-4">
              {t("title")}
            </h1>
            <div className="flex justify-center heading-margin">
              <div className="h-1 w-20 bg-tedx-red rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TEAM GRID ═══════════ */}
      <section className="px-6 md:px-12 lg:px-24 pb-20 relative z-10 bg-background">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {members.map((member: any, index: number) => (
              <TeamMemberCard
                key={member.id || index}
                member={member}
                index={index}
                isArabic={isArabic}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="mt-12 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center border-t border-border pt-8 gap-8">
          <div className="flex gap-12">
            <div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                {t("footer.totalMembers")}
              </div>
              <div className="text-lg font-bold text-foreground">
                {members.length} <span className="text-tedx-red">+</span>
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                {t("footer.activeYears")}
              </div>
              <div className="text-lg font-bold text-foreground">
                08 <span className="text-tedx-red">{t("footer.sessions")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="items-center gap-2 hidden sm:flex">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                {t("footer.followJourney")}
              </span>
              <div className="w-12 h-[1px] bg-border" />
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-tedx-red/50 cursor-pointer transition-colors">
                X
              </div>
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground italic hover:text-foreground hover:border-tedx-red/50 cursor-pointer transition-colors">
                In
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-scale-x {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .hero-fade-up {
          opacity: 0;
          animation: hero-fade-up 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .hero-scale-x {
          transform: scaleX(0);
          animation: hero-scale-x 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-fade-up,
          .hero-scale-x {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}