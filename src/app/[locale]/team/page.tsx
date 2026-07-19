import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import TextReveal from "@/components/ui/TextReveal";
import ScrollReveal from "@/components/ui/ScrollReveal";
import TeamFunctionGroup from "@/components/team/TeamAccordionSection";
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
    <section className="section-padding bg-[#050508]">
      <SectionContainer>
        <TextReveal
          text={t("title")}
          as="h1"
          className="font-arabic text-4xl md:text-5xl font-bold text-center mb-4 text-white"
          serif
        />

        <div className="flex justify-center mb-8">
          <div className="h-1 w-20 bg-red-600 rounded-full" />
        </div>

        <ScrollReveal>
          <div className="flex flex-col">
            {DEPARTMENTS.map((department) => {
              const departmentMembers = members.filter(
                (m) => m.department === department
              );
              if (departmentMembers.length === 0) return null;

              return (
                <TeamFunctionGroup
                  key={department}
                  functionName={t(`departments.${department}`)}
                  members={departmentMembers}
                />
              );
            })}
          </div>
        </ScrollReveal>
      </SectionContainer>
    </section>
  );
}