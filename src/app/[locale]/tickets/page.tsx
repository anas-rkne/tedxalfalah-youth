import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Metadata } from "next";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  ArrowUpRight,
  Check,
  Shield,
  Smartphone,
  Shirt,
  BatteryCharging,
  CreditCard,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.tickets" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/* ═══════════════════════════════════════════════════════════════
   مكون بطاقة معلومة — تفاصيل الحدث
   ═══════════════════════════════════════════════════════════════ */
function InfoCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-black/[0.06] hover:border-[#e62b1e]/20 hover:shadow-[0_8px_30px_-12px_rgba(230,43,30,0.1)] transition-all duration-300 group">
      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#e62b1e] flex-shrink-0 group-hover:bg-[#e62b1e] group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
          {label}
        </div>
        <div className="text-sm font-semibold text-zinc-900 truncate">{value}</div>
      </div>
      {href && (
        <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-[#e62b1e] transition-colors ml-auto flex-shrink-0" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

/* ═══════════════════════════════════════════════════════════════
   مكون عنصر "ما يجب إحضاره"
   ═══════════════════════════════════════════════════════════════ */
function BringItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-black/[0.06] hover:border-[#e62b1e]/20 hover:shadow-[0_8px_30px_-12px_rgba(230,43,30,0.1)] transition-all duration-300 group">
      <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-[#e62b1e] mb-3 group-hover:bg-[#e62b1e] group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <span className="text-sm font-medium text-zinc-700 leading-snug">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون باركود زخرفي
   ═══════════════════════════════════════════════════════════════ */
function TicketBarcode() {
  const bars = [2, 3, 1, 4, 2, 3, 1, 4, 2, 3, 1, 4, 2, 3, 1, 4, 2, 3, 1, 4];
  return (
    <div className="flex items-center justify-between pt-5 mt-5 border-t border-dashed border-zinc-200">
      <div className="flex gap-[2px] items-end h-8">
        {bars.map((w, i) => (
          <div
            key={i}
            className="bg-zinc-300 rounded-sm"
            style={{ width: `${w}px`, height: i % 3 === 0 ? "28px" : i % 3 === 1 ? "24px" : "20px" }}
          />
        ))}
      </div>
      <span className="text-[10px] text-zinc-300 font-mono tracking-[0.2em]">TEDX-2026</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون بطاقة التذكرة الرئيسية
   ═══════════════════════════════════════════════════════════════ */
function TicketCard({ t }: { t: any }) {
  return (
    <div className="relative group/card max-w-md mx-auto">
      {/* Glow Effect Behind */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#e62b1e] via-orange-500 to-[#e62b1e] rounded-[32px] blur opacity-15 group-hover/card:opacity-30 transition duration-700" />

      {/* Main Card */}
      <div className="relative bg-white rounded-[28px] overflow-hidden shadow-[0_25px_80px_-20px_rgba(0,0,0,0.12)] border border-black/[0.04]">
        {/* ═══════ Top Section: Red Header ═══════ */}
        <div className="relative bg-gradient-to-br from-[#e62b1e] to-red-700 px-7 sm:px-8 pt-7 pb-10 overflow-hidden">
          {/* Dot Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* TEDx Logo + Availability Badge */}
          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">TEDx</div>
                <div className="text-white/60 text-[10px] font-medium leading-tight">AlFalah Youth</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-white text-[10px] font-semibold">{t("ticket.available")}</span>
            </div>
          </div>

          {/* Ticket Type + Description */}
          <h2 className="relative text-white text-xl sm:text-2xl font-bold mb-1">
            {t("ticket.type")}
          </h2>
          <p className="relative text-white/70 text-xs sm:text-sm">{t("ticket.description")}</p>

          {/* Decorative Circles */}
          <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-white/[0.04]" />
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/[0.04]" />
        </div>

        {/* ═══════ Perforation Line ═══════ */}
        <div className="relative h-5 bg-white">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-zinc-200" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#fafafa]" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-[#fafafa]" />
        </div>

        {/* ═══════ Bottom Section: Details ═══════ */}
        <div className="px-7 sm:px-8 pb-7 pt-1">
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-5xl sm:text-6xl font-bold text-zinc-900 tracking-[-0.03em]">
              {t("ticket.price")}
            </span>
            <span className="text-lg font-semibold text-zinc-400">{t("ticket.currency")}</span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-black/[0.04]">
              <Calendar className="w-4 h-4 text-[#e62b1e] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-400 font-medium">{t("info.dateLabel")}</div>
                <div className="text-xs text-zinc-700 font-semibold truncate">{t("info.dateValue")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-black/[0.04]">
              <Clock className="w-4 h-4 text-[#e62b1e] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-400 font-medium">{t("info.timeLabel")}</div>
                <div className="text-xs text-zinc-700 font-semibold truncate">{t("info.timeValue")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-black/[0.04]">
              <MapPin className="w-4 h-4 text-[#e62b1e] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-400 font-medium">{t("info.venueLabel")}</div>
                <div className="text-xs text-zinc-700 font-semibold truncate">{t("info.venueValue")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-black/[0.04]">
              <Users className="w-4 h-4 text-[#e62b1e] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-400 font-medium">{t("info.venueLabel") /* reusing for seats */}</div>
                <div className="text-xs text-zinc-700 font-semibold truncate">{t("ticket.seats")}</div>
              </div>
            </div>
          </div>

          {/* CTA Button — Platinumlist Link */}
          <a
            href="https://platinumlist.net/event/tedx-youth-alfalah"
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-[#e62b1e] to-red-600 text-white font-bold rounded-xl
              hover:from-red-700 hover:to-red-800 transition-all duration-300
              shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)] hover:shadow-[0_12px_40px_-12px_rgba(230,43,30,0.6)]
              hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{t("ticket.cta")}</span>
            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </a>

          {/* Note */}
          <p className="mt-3.5 text-[11px] text-zinc-400 text-center leading-relaxed">
            {t("ticket.note")}
          </p>

          {/* Barcode */}
          <TicketBarcode />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   الصفحة الرئيسية
   ═══════════════════════════════════════════════════════════════ */
export default async function TicketsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page.tickets" });

  const bringItems = t.raw("bring.items") as string[];

  // Map icons to bring items by index
  const bringIcons = [
    <Shield className="w-5 h-5" key="id" />,
    <Smartphone className="w-5 h-5" key="phone" />,
    <Shirt className="w-5 h-5" key="clothes" />,
    <BatteryCharging className="w-5 h-5" key="charger" />,
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Soft Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-500/[0.03] blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/[0.02] blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-[#e62b1e] mb-5 px-4 py-2 bg-red-50 border border-red-100 rounded-full">
            <Ticket className="w-3.5 h-3.5" />
            {t("hero.badge")}
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 tracking-[-0.03em] mb-5">
            {t("hero.title")}
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 max-w-lg mx-auto leading-relaxed">
            {t("hero.description")}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. TICKET CARD
          ═══════════════════════════════════════════════════════════════ */}
      <section className="pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <TicketCard t={t} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. EVENT INFO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-3 px-4 py-2 bg-white border border-black/[0.06] rounded-full">
              {t("info.badge")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-[-0.02em]">
              {t("info.title")}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard
              icon={<Calendar className="w-5 h-5" />}
              label={t("info.dateLabel")}
              value={t("info.dateValue")}
            />
            <InfoCard
              icon={<Clock className="w-5 h-5" />}
              label={t("info.timeLabel")}
              value={t("info.timeValue")}
            />
            <InfoCard
              icon={<MapPin className="w-5 h-5" />}
              label={t("info.venueLabel")}
              value={t("info.venueValue")}
              href="/venue"
            />
            <InfoCard
              icon={<Users className="w-5 h-5" />}
              label={t("info.ageLabel")}
              value={t("info.ageValue")}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. WHAT TO BRING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 text-center mb-8 tracking-[-0.02em]">
            {t("bring.title")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bringItems.map((item, index) => (
              <BringItem
                key={index}
                icon={bringIcons[index] || <Check className="w-5 h-5" />}
                label={item}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. REFUND POLICY
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)]">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#e62b1e] mx-auto mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              {t("refund.title")}
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed mb-5">
              {t("refund.body")}
            </p>
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e62b1e] hover:text-red-700 transition-colors"
            >
              {t("refund.termsLink")}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}