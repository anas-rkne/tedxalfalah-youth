import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import TeamAccordionSection from "@/components/team/TeamAccordionSection";
import { getTeamMembers } from "@/lib/data";
import { TeamDepartment } from "@/lib/types";
import { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.team" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

const DEPARTMENTS: TeamDepartment[] = [
  "Curation",
  "Production",
  "Speaker Coaching",
  "Marketing",
  "Partnerships",
  "Volunteers",
];

export default async function TeamPage() {
  const members = await getTeamMembers();
  const t = await getTranslations("page.team");

  return (
    <section className="py-16 md:py-24">
      <SectionContainer>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
          {t("title")}
        </h1>

        <div className="flex flex-col gap-6">
          {DEPARTMENTS.map((department, index) => {
            const departmentMembers = members.filter(
              (m) => m.department === department
            );
            if (departmentMembers.length === 0) return null;

            return (
              <TeamAccordionSection
                key={department}
                departmentName={t(`departments.${department}`)}
                members={departmentMembers}
                defaultOpen={index === 0}
              />
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
