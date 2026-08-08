// هذه الصفحة مخفية حالياً بناءً على طلب العميل. يمكن إعادتها لاحقاً.
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { getSessions, getEventInfo } from "@/lib/data";
import ScheduleHeroSection from "@/components/schedule/ScheduleHeroSection";
import SchedulePageClient from "./SchedulePageClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.schedule" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

function formatDate(dateStr: string | undefined, locale: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString(locale === "ar" ? "ar-AE" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function SchedulePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [sessions, eventInfo] = await Promise.all([getSessions(), getEventInfo()]);
  const t = await getTranslations({ locale, namespace: "page.schedule" });
  const isArabic = locale === "ar";
  const eventDate = formatDate(eventInfo?.date, locale);

  const typeLabels = {
    talk: t("typeLabels.talk"),
    break: t("typeLabels.break"),
    activation: t("typeLabels.activation"),
    registration: t("typeLabels.registration"),
  };

  const filterLabels = {
    all: t("filterLabels.all"),
    talk: t("filterLabels.talk"),
    break: t("filterLabels.break"),
    activation: t("filterLabels.activation"),
  };

  const periodLabels = {
    morning: t("periodLabels.morning"),
    afternoon: t("periodLabels.afternoon"),
    evening: t("periodLabels.evening"),
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-tedx-red selection:text-white pb-32 overflow-hidden relative">
      {/* 🔥 تم إزالة font-sans */}
      <ScheduleHeroSection
        badgeLabel={t("hero.badge")}
        title={t("title")}
        eventDate={eventDate ?? ""}
        description={t("timesNote")}
        isArabic={isArabic}
        ticketsLabel={t("ticketsLabel")}
      />

      <section className="section-padding bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isArabic ? "font-arabic" : ""}`}>
              {t("sectionTitle")}
            </h2>
            <div className="flex justify-center mb-8">
              <div className="h-1.5 w-24 bg-tedx-red rounded-full" />
            </div>
          </div>

          <SchedulePageClient
            sessions={sessions}
            typeLabels={typeLabels}
            filterLabels={filterLabels}
            periodLabels={periodLabels}
            emptyLabel={t("empty")}
          />
        </div>
      </section>

      <style>{`
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-up {
          opacity: 0;
          animation: hero-fade-up 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-fade-up {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}