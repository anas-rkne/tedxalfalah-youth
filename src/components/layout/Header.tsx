"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useRTL } from "@/hooks/useRTL";
import {
  Menu,
  X,
  Home,
  Users,
  Users2,
  MapPin,
  Mic,
  CalendarDays,
  Ticket,
  Handshake,
  Award,
  Mail,
  FileText,
  Image,
  ClipboardList,
} from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";
import Logo from "@/components/header/Logo";
import NavLink from "@/components/header/NavLink";
import MoreDropdown from "@/components/header/MoreDropdown";
import MobileMenu from "@/components/header/MobileMenu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();
  const t = useTranslations("common.nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isMenuOpenRef = useRef(isMenuOpen);
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);


const ALL_LINKS = useMemo(() => [
  { label: t("home"), href: "/", icon: Home },
  { label: t("speakers"), href: "/speakers", icon: Users },
  { label: t("team"), href: "/team", icon: Users2 },
  { label: t("venue"), href: "/venue", icon: MapPin },
  { label: t("activations"), href: "/activations", icon: Mic },
  { label: t("schedule"), href: "/schedule", icon: CalendarDays },
  { label: t("apply"), href: "/apply", icon: Handshake },
  { label: t("sponsors"), href: "/sponsors", icon: Award },
  { label: t("tickets"), href: "/tickets", icon: Ticket },
  { label: t("contact"), href: "/contact", icon: Mail },
  { label: t("gallery"), href: "/gallery", icon: Image },
  { label: t("prepare"), href: "/prepare", icon: ClipboardList },
  { label: t("terms"), href: "/terms", icon: FileText },
], [t]);
  const isArabic = isRTL; // isRTL يكون true عندما تكون اللغة عربية

const mainLinksCount = isArabic ? 5 : 6; 
const mainLinks = ALL_LINKS.slice(0, mainLinksCount);
const moreLinks = ALL_LINKS.slice(mainLinksCount);
  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(255,255,255,0)", "rgba(255,255,255,1)"]
  );
  const headerBlur = useTransform(scrollY, [0, 80], [0, 20]);
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 1]);
  const shadowOpacity = useTransform(scrollY, [0, 80], [0, 0.1]);
  const boxShadowVal = useTransform(
    shadowOpacity,
    (v) => `0 1px 4px rgba(0,0,0,${v})`
  );
  const borderColorVal = useTransform(
    borderOpacity,
    (v) => `rgba(228,228,231,${v})`
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isMenuOpenRef.current) setIsMenuOpen(false);
  }, []);

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (!isMenuOpenRef.current) return;
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      toggleRef.current &&
      !toggleRef.current.contains(e.target as Node)
    ) {
      setIsMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleOutsideClick);
      setTimeout(() => menuRef.current?.querySelector("a")?.focus(), 100);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen, handleKeyDown, handleOutsideClick]);

  if (pathname.startsWith("/thank-you")) return null;

  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-20">
      <motion.div
        className="absolute inset-0 pointer-events-none border-b border-border/0"
        style={{
          backgroundColor: headerBg,
          backdropFilter: shouldReduceMotion
            ? "none"
            : `blur(${headerBlur}px)`,
          WebkitBackdropFilter: shouldReduceMotion
            ? "none"
            : `blur(${headerBlur}px)`,
          boxShadow: boxShadowVal,
          borderColor: borderColorVal,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between relative z-10">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1" role="menubar">
          {mainLinks.map((link, i) => (
            <NavLink
              key={link.href}
              link={link}
              index={i}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}

          <MoreDropdown
            moreLinks={moreLinks}
            isRTL={isRTL}
            isMoreOpen={isMoreOpen}
            setIsMoreOpen={setIsMoreOpen}
            shouldReduceMotion={shouldReduceMotion}
            pathname={pathname}
            tCommon={{ more: tCommon("more") }}
          />
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher />
          <AnimatedSlidingButton href="/apply" variant="primary">
            <span className="flex items-center gap-1.5">
              {tCommon("applyNow")}
            </span>
          </AnimatedSlidingButton>
        </div>

        <div className="lg:hidden flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />
          <button
            ref={toggleRef}
            className="relative z-10 p-2 rounded-xl hover:bg-muted/80 transition-colors"
            aria-label={isMenuOpen ? tCommon("ui.closeMenu") : tCommon("ui.openMenu")}
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <motion.div
              animate={
                shouldReduceMotion ? {} : { rotate: isMenuOpen ? 90 : 0 }
              }
              transition={{ duration: 0.2 }}
            >
              {isMenuOpen ? (
                <X size={24} className="text-foreground" />
              ) : (
                <Menu size={24} className="text-foreground" />
              )}
            </motion.div>
          </button>
        </div>
      </div>

      <MobileMenu
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        allLinks={ALL_LINKS}
        isRTL={isRTL}
        shouldReduceMotion={shouldReduceMotion}
        pathname={pathname}
        applyNowText={tCommon("applyNow")}
      />
    </header>
  );
}
