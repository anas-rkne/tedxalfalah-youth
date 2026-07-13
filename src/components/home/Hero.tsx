import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Countdown from "@/components/shared/Countdown";
import ActionButtons from "@/components/home/ActionButtons";
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import HeroDynamicContent from "@/components/home/HeroDynamicContent";

// TODO: replace with real event date once confirmed by client
const EVENT_DATE = "2026-11-15T09:00:00+04:00";

export default async function Hero() {
  const t = await getTranslations("home.hero");

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center text-center overflow-hidden">
      <Image
        src="/mock/hero-placeholder.svg"
        alt="TEDxAlFalah Youth event"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/40" />

      <HeroDynamicContent />

      <div className="relative z-10 px-4 flex flex-col items-center gap-6 py-24">
        <HeroTypewriterTitle title={t("title")} />
        <p className="text-lg md:text-2xl text-tedx-white/90 max-w-2xl">
          {t("subtitle")}
        </p>

        <Countdown targetDate={EVENT_DATE} />

        <ActionButtons applyLabel={t("applyNow")} ticketsLabel={t("getTickets")} />
      </div>
    </section>
  );
}
