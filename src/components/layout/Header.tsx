"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRTL } from "@/hooks/useRTL";
import {
  Menu,
  X,
  Home,
  Users,
  Users2,
  MapPin,
  Mic,
  Ticket,
  Handshake,
  Award,
  ChevronDown,
} from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { isRTL } = useRTL();
  const t = useTranslations("common.nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // استخدام useMemo للروابط الثابتة
  const ALL_LINKS = useMemo(
    () => [
      { label: t("home"), href: "/", icon: Home },
      { label: t("speakers"), href: "/speakers", icon: Users },
      { label: t("team"), href: "/team", icon: Users2 },
      { label: t("venue"), href: "/venue", icon: MapPin },
      { label: t("activations"), href: "/activations", icon: Mic },
      { label: t("apply"), href: "/apply", icon: Handshake },
      { label: t("sponsors"), href: "/sponsors", icon: Award },
      { label: t("tickets"), href: "/tickets", icon: Ticket },
    ],
    [t]
  );

  const mainLinks = ALL_LINKS.slice(0, 6);
  const moreLinks = ALL_LINKS.slice(6);

  // تأثيرات التمرير
  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.88)"]
  );
  const headerBlur = useTransform(scrollY, [0, 80], [0, 20]);
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 1]);
  const shadowOpacity = useTransform(scrollY, [0, 80], [0, 0.1]);

  // ... (إدارة التركيز و فحص النقر خارج القائمة كما هي) ...
  const handleKeyDown = useCallback((e: KeyboardEvent) => { /* ... */ }, [isMenuOpen]);
  const handleOutsideClick = useCallback((e: MouseEvent) => { /* ... */ }, [isMenuOpen]);

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

  // مكون الشعار (Logo) - تم تحديث الألوان
  function Logo() {
    return (
      <Link href="/" className="flex items-center gap-2 group">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-tedx-red/10 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative px-2.5 py-1.5 bg-tedx-red rounded-lg">
            <span className="text-white font-black text-sm tracking-tight leading-none">
              TEDx
            </span>
          </div>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-bold text-foreground text-sm tracking-tight">
            AlFalah
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
            Youth
          </span>
        </div>
      </Link>
    );
  }

  // مكون رابط التنقل (NavLink) - تم تحديث الألوان
  function NavLink({ link, index }: { link: (typeof ALL_LINKS)[number]; index: number }) {
    const isActive = pathname === link.href;
    const Icon = link.icon;

    return (
      <Link
        href={link.href}
        aria-current={isActive ? "page" : undefined}
        className="group relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors duration-300"
      >
        <div
          className={`absolute inset-0 rounded-xl transition-all duration-300 ${
            isActive ? "bg-tedx-red/10" : "bg-transparent group-hover:bg-muted/80"
          }`}
        />
        <Icon
          size={15}
          className={`relative z-10 transition-colors duration-300 ${
            isActive ? "text-tedx-red" : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        <span
          className={`relative z-10 text-sm font-medium transition-colors duration-300 ${
            isActive ? "text-tedx-red font-semibold" : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          {link.label}
        </span>
        {isActive && (
          <motion.div
            layoutId="active-nav"
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-tedx-red"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-20">
      {/* خلفية Glassmorphism */}
      <motion.div
        className="absolute inset-0 pointer-events-none border-b border-border/0"
        style={{
          backgroundColor: headerBg,
          backdropFilter: shouldReduceMotion ? "none" : `blur(${headerBlur}px) saturate(1.5)`,
          WebkitBackdropFilter: shouldReduceMotion ? "none" : `blur(${headerBlur}px) saturate(1.5)`,
          boxShadow: useTransform(shadowOpacity, (v) => `0 1px 4px rgba(0,0,0,${v})`),
          borderColor: useTransform(borderOpacity, (v) => `rgba(228,228,231,${v})`),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between relative z-10">
        {/* الشعار */}
        <Logo />

        {/* قائمة سطح المكتب */}
        <nav className="hidden lg:flex items-center gap-1" role="menubar">
          {mainLinks.map((link, i) => (
            <NavLink key={link.href} link={link} index={i} />
          ))}

          {/* زر "More" */}
          <div
            ref={moreDropdownRef}
            className="relative"
            onMouseEnter={() => setIsMoreOpen(true)}
            onMouseLeave={() => setIsMoreOpen(false)}
          >
            <button
              className={`group relative flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isMoreOpen
                  ? "bg-tedx-red/10 text-tedx-red"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              aria-expanded={isMoreOpen}
              aria-haspopup="true"
            >
              <span>{tCommon("more")}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  isMoreOpen ? "rotate-180 text-tedx-red" : "text-muted-foreground"
                }`}
              />
            </button>

            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className={`absolute top-full ${
                    isRTL ? "right-0" : "left-0"
                  } mt-2 bg-background/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_48px_-12px_rgba(0,0,0,0.2)] border border-border p-2 min-w-[200px] z-20`}
                  role="menu"
                >
                  {/* سهم القائمة */}
                  <div
                    className={`absolute -top-1.5 ${
                      isRTL ? "right-4" : "left-4"
                    } w-3 h-3 bg-background rotate-45 border-l border-t border-border`}
                  />

                  {moreLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          isActive
                            ? "text-tedx-red bg-tedx-red/10 font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <link.icon size={15} className="text-current" />
                        <span>{link.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="more-active-dot"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-tedx-red"
                          />
                        )}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* الأزرار الجانبية (سطح المكتب) */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher />
          <AnimatedSlidingButton href="/apply" variant="primary">
            <span className="flex items-center gap-1.5">{tCommon("applyNow")}</span>
          </AnimatedSlidingButton>
        </div>

        {/* القائمة الجانبية (الجوال) */}
        <div className="lg:hidden flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />
          <button
            ref={toggleRef}
            className="relative z-10 p-2 rounded-xl hover:bg-muted/80 transition-colors"
            aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <motion.div animate={shouldReduceMotion ? {} : { rotate: isMenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              {isMenuOpen ? (
                <X size={24} className="text-foreground" />
              ) : (
                <Menu size={24} className="text-foreground" />
              )}
            </motion.div>
          </button>
        </div>
      </div>

      {/* القائمة المتنقلة */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            className="lg:hidden fixed inset-0 top-20 bg-background/98 backdrop-blur-2xl z-40 flex flex-col"
            initial={shouldReduceMotion ? {} : { opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
          >
            {/* شريط TEDx */}
            <div className="h-1 bg-gradient-to-r from-transparent via-tedx-red to-transparent" />

            <nav className="flex flex-col gap-1 p-6" role="menu">
              {ALL_LINKS.map((link, i) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <motion.div
                    key={link.href}
                    initial={shouldReduceMotion ? {} : { opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Link
                      href={link.href}
                      role="menuitem"
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-tedx-red/10 text-tedx-red"
                          : "text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-tedx-red/10" : "bg-muted"
                      }`}>
                        <Icon size={18} className={isActive ? "text-tedx-red" : "text-muted-foreground"} />
                      </div>
                      <span>{link.label}</span>
                      {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-tedx-red" />}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="mt-4 pt-4 border-t border-border">
                <AnimatedSlidingButton
                  href="/apply"
                  variant="primary"
                  className="w-full justify-center py-3.5 text-base font-semibold rounded-xl shadow-sm"
                >
                  <span className="flex items-center gap-2">{tCommon("applyNow")}</span>
                </AnimatedSlidingButton>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}