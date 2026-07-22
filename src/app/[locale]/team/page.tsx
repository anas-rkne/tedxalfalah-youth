import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import TeamFunctionGroup from "@/components/team/TeamAccordionSection";
import { getTeamMembers } from "@/lib/data";
import { TeamDepartment } from "@/lib/types";

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
    <div className="min-h-screen bg-background text-foreground selection:bg-[#e62b1e] selection:text-white pb-32 overflow-hidden font-sans relative">
      
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION (خلفية داكنة متجاوبة)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 px-6 md:px-12 lg:px-24 overflow-hidden">
        
        {/* الخلفية السوداء والتوهجات الحمراء */}
        <div className="absolute inset-0 bg-[#050505] pointer-events-none z-0"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#e62b1e]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#e62b1e]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6 md:gap-12 text-white">
          <div className="space-y-6">
            {/* TEDx Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e62b1e]/20 border border-[#e62b1e]/30 rounded-full">
              <div className="w-2 h-2 bg-[#e62b1e] rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e62b1e]">
                TEDxTeam {new Date().getFullYear()}
              </span>
            </div>
            
            {/* العنوان الضخم */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-none text-balance text-white">
              THE ARCHITECTS <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#e62b1e]/50">OF IDEAS.</span>
            </h1>
          </div>
          
          <div className="flex flex-col justify-center md:justify-end md:items-end items-start text-left md:text-right md:pb-4">
             <div className="text-[#e62b1e] font-black text-4xl italic leading-none hidden md:block">TEDx</div>
             <div className="text-[11px] font-medium tracking-[0.3em] opacity-50 mt-1 uppercase hidden md:block">Youth</div>
             <p className="text-gray-400 text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-xs md:max-w-sm mx-auto md:mx-0 mt-6 md:mt-8">
                {t("meta.description") || "A collective of thinkers, builders, and creators dedicated to unearthing ideas worth spreading."}
             </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TITLE SECTION (قسم العنوان الأبيض - مطابق لصفحة المتحدثين)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="heading-h1 font-arabic text-center mb-4">
              {t("title")}
            </h1>
            <div className="flex justify-center heading-margin">
              <div className="h-1 w-20 bg-tedx-red rounded-full" />
            </div>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 text-lg leading-relaxed">
              {t("meta.description")}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          DEPARTMENTS SECTIONS (أقسام الموظفين)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-12 lg:px-24 py-8 relative z-10">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-20">
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
      </section>

      {/* Footer Details (لم يتغير) */}
      <footer className="mt-12 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center border-t border-border pt-8 gap-8">
          <div className="flex gap-12">
            <div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Members</div>
              <div className="text-lg font-bold text-foreground">{members.length} <span className="text-[#e62b1e]">+</span></div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Years</div>
              <div className="text-lg font-bold text-foreground">08 <span className="text-[#e62b1e]">Sessions</span></div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hidden sm:flex">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Follow the Journey</span>
              <div className="w-12 h-[1px] bg-border"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[#e62b1e]/50 cursor-pointer transition-colors">X</div>
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground italic hover:text-foreground hover:border-[#e62b1e]/50 cursor-pointer transition-colors">In</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}