import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Check, ArrowUpRight, Home, Calendar, Mail, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Thank You",
};

const VALID_TYPES = ["contact", "apply", "partner"] as const;
type ThankYouType = (typeof VALID_TYPES)[number];

function isValidType(value: string | undefined): value is ThankYouType {
  return Boolean(value && (VALID_TYPES as readonly string[]).includes(value));
}

interface ThankYouPageProps {
  searchParams: Promise<{ type?: string }>;
}

/* ═══════════════════════════════════════════════════════════════
   مكون أيقونة متحركة — دائرة توهج + علامة صح
   ═══════════════════════════════════════════════════════════════ */
function AnimatedCheckIcon() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-8">
      {/* Outer glow rings */}
      <div className="absolute inset-0 rounded-full bg-[#e62b1e]/[0.08] animate-ping" style={{ animationDuration: "2s" }} />
      <div className="absolute inset-2 rounded-full bg-[#e62b1e]/[0.12]" />

      {/* Main circle */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-50 to-rose-100 border border-red-100 flex items-center justify-center">
        <Check className="w-9 h-9 text-[#e62b1e] stroke-[2.5]" />
      </div>

      {/* Decorative dots */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#e62b1e]/20" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-orange-400/30" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون بطاقة إحصائية صغيرة
   ═══════════════════════════════════════════════════════════════ */
function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/[0.06] text-xs text-zinc-500">
      {icon}
      <span>{label}</span>
    </div>
  );
}

export default async function ThankYouPage({
  searchParams,
}: ThankYouPageProps) {
  const { type } = await searchParams;
  const key = isValidType(type) ? type : "default";

  const t = await getTranslations(`thankYou.${key}`);

  const ctaConfig: Record<ThankYouType | "default", { href: string; icon: React.ReactNode }> = {
    contact: { href: "/", icon: <Home className="w-4 h-4" /> },
    apply: { href: "/schedule", icon: <Calendar className="w-4 h-4" /> },
    partner: { href: "/", icon: <Home className="w-4 h-4" /> },
    default: { href: "/", icon: <Home className="w-4 h-4" /> },
  };

  const { href, icon } = ctaConfig[key] || ctaConfig.default;

  // Context-aware subtitle
  const subtitles: Record<string, string> = {
    contact: "سنعاود التواصل معك قريباً",
    apply: "إيميل تأكيد في طريقه إليك",
    partner: "سيراجع فريق الشراكات رسالتك",
    default: "تم استلام طلبك بنجاح",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Soft gradient background
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-4 sm:px-6 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-500/[0.03] blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/[0.02] blur-3xl" />
        </div>

        <div className="relative max-w-lg mx-auto text-center">
          {/* Animated Check */}
          <AnimatedCheckIcon />

          {/* Eyebrow */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#e62b1e] mb-4 px-4 py-2 bg-red-50 border border-red-100 rounded-full">
            <Check className="w-3 h-3" />
            تم بنجاح
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 tracking-[-0.03em] mb-4">
            {t("title")}
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-zinc-400 font-medium mb-3">
            {subtitles[key] || subtitles.default}
          </p>

          {/* Body */}
          <p className="text-base text-zinc-500 leading-relaxed mb-10 max-w-md mx-auto">
            {t("body")}
          </p>

          {/* Stats pills */}
          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            <StatPill icon={<Mail className="w-3.5 h-3.5 text-zinc-400" />} label="تأكيد بالبريد" />
            <StatPill icon={<Users className="w-3.5 h-3.5 text-zinc-400" />} label="فريقنا يعمل" />
            <StatPill icon={<Calendar className="w-3.5 h-3.5 text-zinc-400" />} label="رد خلال 48 ساعة" />
          </div>

          {/* CTA Button */}
          <Link
            href={href}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#e62b1e] to-red-600 text-white font-bold rounded-xl
              hover:from-red-700 hover:to-red-800 transition-all duration-300
              shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)] hover:shadow-[0_12px_40px_-12px_rgba(230,43,30,0.5)]
              hover:scale-[1.02] active:scale-[0.98]"
          >
            {icon}
            <span>{t("cta")}</span>
            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Secondary link */}
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>العودة للرئيسية</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM DECORATION — Subtle pattern
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative h-16 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #e62b1e 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>
    </div>
  );
}