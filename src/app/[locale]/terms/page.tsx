import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { 
  Shield, 
  FileText, 
  Camera, 
  Lock, 
  Award, 
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Mail
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.terms" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/* ═══════════════════════════════════════════════════════════════
   أيقونات الأقسام
   ═══════════════════════════════════════════════════════════════ */
const SECTION_ICONS: Record<string, React.ReactNode> = {
  section1: <FileText className="w-5 h-5" />,
  section2: <Shield className="w-5 h-5" />,
  section3: <Camera className="w-5 h-5" />,
  section4: <Lock className="w-5 h-5" />,
  section5: <Award className="w-5 h-5" />,
  section6: <AlertCircle className="w-5 h-5" />,
};

/* ═══════════════════════════════════════════════════════════════
   مكون رقم القسم
   ═══════════════════════════════════════════════════════════════ */
function SectionNumber({ number }: { number: number }) {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 border border-red-100 flex items-center justify-center">
      <span className="text-sm font-bold text-[#e62b1e]">{number}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون بطاقة قسم
   ═══════════════════════════════════════════════════════════════ */
function TermsSection({
  sectionKey,
  index,
  t,
}: {
  sectionKey: string;
  index: number;
  t: any;
}) {
  const paragraphs = t.raw(`sections.${sectionKey}.content`) as string[];
  const icon = SECTION_ICONS[sectionKey] || <FileText className="w-5 h-5" />;

  return (
    <div className="group">
      {/* Section Header */}
      <div className="flex items-start gap-4 mb-5">
        <SectionNumber number={index + 1} />
        <div className="flex-1 min-w-0 pt-1.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#e62b1e] group-hover:bg-[#e62b1e] group-hover:text-white transition-colors duration-300">
              {icon}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-[-0.01em]">
              {t(`sections.${sectionKey}.title`)}
            </h2>
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="ml-14 flex flex-col gap-4">
        {paragraphs.map((paragraph: string, i: number) => {
          const isBoldHeading = paragraph.startsWith("**") && paragraph.endsWith("**");
          const isBullet = paragraph.startsWith("•") || paragraph.startsWith("-");

          if (isBoldHeading) {
            const cleanText = paragraph.replace(/\*\*/g, "");
            return (
              <h3 key={i} className="text-sm font-bold text-zinc-800 mt-2">
                {cleanText}
              </h3>
            );
          }

          if (isBullet) {
            return (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#e62b1e] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-zinc-500 leading-[1.8]">
                  {paragraph.replace(/^[•\-]\s*/, "")}
                </p>
              </div>
            );
          }

          return (
            <p 
              key={i} 
              className="text-sm text-zinc-500 leading-[1.8]"
              dangerouslySetInnerHTML={{
                __html: paragraph
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-700">$1</strong>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          );
        })}
      </div>

      {/* Divider */}
      <div className="mt-8 pt-8 border-t border-zinc-100">
        <div className="h-px max-w-[80px] mx-auto bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون جدول المحتويات
   ═══════════════════════════════════════════════════════════════ */
function TableOfContents({ 
  sections, 
  t 
}: { 
  sections: readonly string[]; 
  t: any;
}) {
  return (
    <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] mb-12">
      <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#e62b1e]" />
        محتويات الصفحة
      </h3>
      <nav className="flex flex-col gap-2">
        {sections.map((sectionKey, index) => (
          <a
            key={sectionKey}
            href={`#${sectionKey}`}
            className="group flex items-center gap-3 text-sm text-zinc-500 hover:text-[#e62b1e] transition-colors py-1.5 px-3 rounded-lg hover:bg-red-50/50"
          >
            <span className="w-6 h-6 rounded-md bg-white border border-black/[0.06] flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:text-[#e62b1e] group-hover:border-[#e62b1e]/20 transition-colors">
              {index + 1}
            </span>
            <span className="flex-1 truncate">{t(`sections.${sectionKey}.title`)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   الصفحة الرئيسية
   ═══════════════════════════════════════════════════════════════ */
export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.terms" });

  const SECTION_NAMES = [
    "section1",
    "section2",
    "section3",
    "section4",
    "section5",
    "section6",
  ] as const;

  return (
    <div className="min-h-screen bg-white">
      {/* ═══════════════════════════════════════════════════════════════
          HERO HEADER
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-500/[0.03] blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
            <Link href="/" className="hover:text-[#e62b1e] transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-zinc-600">{t("meta.title")}</span>
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-[#e62b1e] mb-5 px-4 py-2 bg-red-50 border border-red-100 rounded-full">
            <Shield className="w-3.5 h-3.5" />
            {t("meta.title")}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 tracking-[-0.03em] mb-4">
            {t("title")}
          </h1>

          {/* Last updated */}
          <p className="text-sm text-zinc-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            {t("lastUpdated")}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CONTENT
          ═══════════════════════════════════════════════════════════════ */}
      <section className="pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Table of Contents */}
          <TableOfContents sections={SECTION_NAMES} t={t} />

          {/* Sections */}
          <div className="flex flex-col">
            {SECTION_NAMES.map((sectionKey, index) => (
              <div key={sectionKey} id={sectionKey}>
                <TermsSection
                  sectionKey={sectionKey}
                  index={index}
                  t={t}
                />
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-[#fafafa] to-white border border-black/[0.06] text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#e62b1e] mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">لديك سؤال؟</h3>
            <p className="text-sm text-zinc-500 mb-5">
              إذا كانت لديك أي استفسارات حول الشروط والأحكام، فريقنا جاهز للمساعدة.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e62b1e] to-red-600 text-white text-sm font-bold rounded-xl
                hover:from-red-700 hover:to-red-800 transition-all duration-300
                shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)] hover:shadow-[0_12px_40px_-12px_rgba(230,43,30,0.5)]
                hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>تواصل معنا</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}