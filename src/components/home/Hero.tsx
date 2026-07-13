import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Countdown from "@/components/shared/Countdown";
import HeroParticlesBackground from "@/components/home/HeroParticlesBackground";
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import ActionButtons from "@/components/home/ActionButtons";
import WelcomeConfetti from "@/components/ui/WelcomeConfetti";

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
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* خلفية جسيمات تفاعلية (فوق الصورة، تحت النص) */}
      <HeroParticlesBackground />

      {/* قصاصات ورقية ترحيبية عند أول زيارة فقط */}
      <WelcomeConfetti />

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
