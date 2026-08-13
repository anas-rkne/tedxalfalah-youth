import { getTranslations } from "next-intl/server";
import { getEventInfo, getTeamMembers } from "@/lib/data";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionBadge from "@/components/ui/SectionBadge";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import TeamMemberCard from "@/components/team/TeamMemberCard";

export default async function TeamPreview({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.teamPreview" });
  const [eventInfo, members] = await Promise.all([
    getEventInfo(),
    getTeamMembers(),
  ]);

  if (!eventInfo?.showTeam || members.length === 0) return null;

  const isArabic = locale === "ar";
  const preview = members.slice(0, 8);

  return (
    <section className="section-padding relative flex flex-col items-center justify-center px-4 md:px-8 overflow-hidden bg-background">
      {/* نمط خلفي دقيق */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <SectionBadge>{t("badgeLabel")}</SectionBadge>
            </div>
            <h2 className="heading-h1 tracking-[-0.03em] mb-3 text-center">{t("heading")}</h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto leading-[1.7]">
              {t("subtitle")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {preview.map((member, index) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              index={index}
              isArabic={isArabic}
            />
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 flex justify-center">
            <div className="inline-block">
              <AnimatedSlidingButton
                href="/team"
                variant="primary"
                className="!w-auto min-w-[120px] sm:min-w-[160px]"
              >
                {t("seeAll")}
              </AnimatedSlidingButton>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
