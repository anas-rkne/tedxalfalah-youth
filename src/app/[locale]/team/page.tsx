import { getTranslations } from "next-intl/server";
import Image from "next/image";
import SectionContainer from "@/components/ui/SectionContainer";
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
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16">
          {t("title")}
        </h1>

        <div className="flex flex-col gap-16">
          {DEPARTMENTS.map((department) => {
            const departmentMembers = members.filter(
              (m) => m.department === department
            );
            if (departmentMembers.length === 0) return null;

            return (
              <div key={department}>
                <h2 className="text-2xl font-bold mb-6 border-b border-gray-200 pb-2">
                  {t(`departments.${department}`)}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                  {departmentMembers.map((member) => (
                    <div key={member.id} className="text-center">
                      <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden mb-3">
                        <Image
                          src={member.imageUrl}
                          alt={member.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-tedx-gray">{member.role}</p>
                      {member.quote && (
                        <p className="text-xs text-tedx-gray italic mt-1">
                          &ldquo;{member.quote}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
