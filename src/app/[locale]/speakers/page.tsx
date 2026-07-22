import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import SpeakersGrid from "@/components/speakers/SpeakersGrid";
import { getSpeakers } from "@/lib/data";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.speakers" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function SpeakersPage() {
  const speakers = await getSpeakers();
  const t = await getTranslations("page.speakers");

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#e62b1e] selection:text-white pb-32 overflow-hidden font-sans relative">
      
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION - (خلفية داكنة وتوهجات حمراء مثل صفحة الفريق)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 px-6 md:px-12 lg:px-24 overflow-hidden">
        
        {/* الخلفية السوداء والتوهجات الحمراء */}
        <div className="absolute inset-0 bg-[#050505] pointer-events-none z-0"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#e62b1e]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#e62b1e]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* ✅ حاوية مرنة مع مسافات متغيرة حسب الشاشة */}
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6 md:gap-12 text-white">
          
          <div className="space-y-6">
            {/* TEDx Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e62b1e]/20 border border-[#e62b1e]/30 rounded-full">
              <div className="w-2 h-2 bg-[#e62b1e] rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e62b1e]">
                TEDxSpeakers {new Date().getFullYear()}
              </span>
            </div>
            
            {/* ✅ العنوان الرئيسي - أحجام متدرجة ومتوازنة مع الحفاظ على الخط الكبير في الشاشات العريضة */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-none text-white text-balance">
              THE VOICES <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#e62b1e]/50">OF TOMORROW.</span>
            </h1>
          </div>
          
          {/* ✅ النص الجانبي - أصبح متجاوباً ومتمركزاً عند التكديس في الجوال */}
          <div className="flex flex-col justify-center md:justify-end md:items-end items-start text-left md:text-right md:pb-4">
             <div className="text-[#e62b1e] font-black text-4xl italic leading-none hidden md:block">TEDx</div>
             <div className="text-[11px] font-medium tracking-[0.3em] opacity-50 mt-1 uppercase hidden md:block">Speakers</div>
             
             {/* ✅ النص الفرعي - يتكيف حجمه مع الشاشات المتوسطة والصغيرة */}
             <p className="text-gray-400 text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-xs md:max-w-sm mx-auto md:mx-0 mt-6 md:mt-8">
                {t("meta.description") || "The voices that are shaping the world through bold ideas and real stories."}
             </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SPEAKERS GRID - (باقي الصفحة كما هي بخلفية بيضاء وترجمة)
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
              {t("subtitle")}
            </p>
          </div>

          {speakers.length > 0 ? (
            <SpeakersGrid speakers={speakers} />
          ) : (
            <p className="text-center text-muted-foreground py-16">
              {t("empty")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}