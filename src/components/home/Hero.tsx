import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Button from "@/components/ui/Button";
import Countdown from "@/components/shared/Countdown";

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

      <div className="relative z-10 px-4 flex flex-col items-center gap-6 py-24">
        <h1 className="text-5xl md:text-7xl font-bold text-tedx-white">
          {t("title")}
        </h1>
        <p className="text-lg md:text-2xl text-tedx-white/90 max-w-2xl">
          {t("subtitle")}
        </p>

        <Countdown targetDate={EVENT_DATE} />

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button href="/apply" variant="primary" size="lg">
            {t("applyNow")}
          </Button>
          <Button
            href="/tickets"
            variant="outline"
            size="lg"
            className="!text-tedx-white !border-tedx-white hover:!bg-tedx-white hover:!text-tedx-black"
          >
            {t("getTickets")}
          </Button>
        </div>
      </div>
    </section>
  );
}
