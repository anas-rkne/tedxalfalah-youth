import { getTranslations } from "next-intl/server";
import SectionContainer from "@/components/ui/SectionContainer";
import ActivationCard from "@/components/activations/ActivationCard";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getActivations } from "@/lib/data";
import { Metadata } from "next";
import SectionBadge from "@/components/ui/SectionBadge"; // ✅ الشارة الموحدة

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.activations" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ActivationsPage() {
  const activations = await getActivations();
  const t = await getTranslations("page.activations");

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#e62b1e] selection:text-white pb-32 overflow-hidden font-sans relative">
      
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION - (خلفية داكنة سوداء مع توهجات حمراء)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 px-6 md:px-12 lg:px-24 overflow-hidden">
        
        {/* الخلفية السوداء والتوهجات الحمراء */}
        <div className="absolute inset-0 bg-[#050505] pointer-events-none z-0"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#e62b1e]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#e62b1e]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* المحتوى - هيكلية متطابقة مع الفريق والمتحدثين والمكان */}
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6 md:gap-12 text-white">
          <div className="space-y-6">
            
            {/* TEDx Badge - مطابق لنفس النمط المستخدم في الصفحات السابقة */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e62b1e]/20 border border-[#e62b1e]/30 rounded-full">
              <div className="w-2 h-2 bg-[#e62b1e] rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e62b1e]">
                TEDxActivations {new Date().getFullYear()}
              </span>
            </div>
            
            {/* العنوان الضخم المتدرج */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-none text-balance text-white">
              THE ACTIVATIONS <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#e62b1e]/50">THAT INSPIRE.</span>
            </h1>
          </div>
          
          {/* الجهة اليمنى: شعار TEDx والوصف */}
          <div className="flex flex-col justify-center md:justify-end md:items-end items-start text-left md:text-right md:pb-4">
             <div className="text-[#e62b1e] font-black text-4xl italic leading-none hidden md:block">TEDx</div>
             <div className="text-[11px] font-medium tracking-[0.3em] opacity-50 mt-1 uppercase hidden md:block">Activations</div>
             <p className="text-gray-400 text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-xs md:max-w-sm mx-auto md:mx-0 mt-6 md:mt-8">
                {t("meta.description") || "Experience beyond the talks."}
             </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TITLE SECTION - (قسم أبيض متطابق مع "Meet the Activations")
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-background">
        <div className="container-padding max-w-5xl mx-auto text-center">
          
          {/* الشارة الموحدة */}
          <div className="flex justify-center mb-4">
            <SectionBadge>
              {t("meta.title")}
            </SectionBadge>
          </div>

          {/* العنوان المتجاوب */}
          <h1 className="heading-h1 tracking-[-0.03em] heading-margin">
            {t("title")}
          </h1>

          {/* الخط الزخرفي الأحمر */}
          <div className="flex justify-center">
            <div className="h-1 w-20 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
          </div>

          {/* النص الفرعي المترجم */}
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ACTIVATIONS GRID
          ═══════════════════════════════════════════════════════════════ */}
      <section className="container-padding pb-20 sm:pb-28">
        <ScrollReveal>
          {activations.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              {t("empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-20 max-w-5xl mx-auto">
              {activations.map((activation, index) => (
                <ActivationCard
                  key={activation.id}
                  activation={activation}
                  index={index}
                />
              ))}
            </div>
          )}
        </ScrollReveal>
      </section>
    </div>
  );
}