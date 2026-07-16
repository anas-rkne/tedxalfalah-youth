"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRTL } from "@/hooks/useRTL";
import { Menu, X, Home, Users, Users2, Calendar, MapPin, Mic, Ticket, Handshake, Award, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

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

  const { scrollY } = useScroll();
const headerOpacity = useTransform(scrollY, [0, 300], [0, 1]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const blurValue = useTransform(scrollY, [0, 80], [0, 12]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && isMenuOpen && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isMenuOpen]
  );

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      requestAnimationFrame(() => menuRef.current?.querySelector("a")?.focus());
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, handleKeyDown]);

  // تعريف جميع الروابط
  const ALL_LINKS = [
    { label: t("home"), href: "/", icon: Home },
    { label: t("speakers"), href: "/speakers", icon: Users },
    { label: t("team"), href: "/team", icon: Users2 },
    { label: t("venue"), href: "/venue", icon: MapPin },
    { label: t("activations"), href: "/activations", icon: Mic },
    { label: t("schedule"), href: "/schedule", icon: Calendar },
    { label: t("apply"), href: "/apply", icon: Handshake }, // Apply كرابط إضافي في القائمة المتنقلة
    { label: t("sponsors"), href: "/sponsors", icon: Award },
    { label: t("tickets"), href: "/tickets", icon: Ticket },
  ];

  // تقسيم الروابط: الرئيسية (أول 6) والإضافية (الباقي)
  const mainLinks = ALL_LINKS.slice(0, 6);
  const moreLinks = ALL_LINKS.slice(6);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-center">
      {/* خلفية متحركة */}
      <motion.div
        className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/80 to-red-50/80 dark:from-black/50 dark:to-red-900/10"
        style={{
          opacity: headerOpacity,
          backdropFilter: shouldReduceMotion ? "none" : `blur(${blurValue}px)`,
          WebkitBackdropFilter: shouldReduceMotion ? "none" : `blur(${blurValue}px)`,
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-black/10 dark:bg-white/10"
        style={{ opacity: borderOpacity }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex w-full items-center justify-between relative z-10">
        {/* الشعار */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
          <span className="text-red-600">TEDx</span>
          <span>AlFalah Youth</span>
        </Link>

        {/* قائمة سطح المكتب - مع "More" منسدلة */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 flex-1 justify-center">
          {mainLinks.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`relative flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all duration-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 ${
                pathname === link.href
                  ? "text-red-600 font-semibold"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <link.icon size={14} className="text-current" />
              <span className="text-sm whitespace-nowrap">{link.label}</span>
              <motion.span
                className="absolute -bottom-1 start-0 h-0.5 bg-red-600 rounded-full transition-all duration-300"
                layoutId="nav-underline"
                initial={false}
                style={{ width: pathname === link.href ? "100%" : 0 }}
                animate={{ width: pathname === link.href ? "100%" : 0 }}
                whileHover={{ width: "100%", boxShadow: "0 0 8px rgba(230,43,30,0.4)" }}
              />
            </motion.a>
          ))}

          {/* زر "More" مع القائمة المنسدلة */}
          <div
            ref={moreDropdownRef}
            className="relative"
            onMouseEnter={() => setIsMoreOpen(true)}
            onMouseLeave={() => setIsMoreOpen(false)}
          >
            <motion.button
              className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isMoreOpen ? "text-red-600 bg-gray-100/70 dark:bg-gray-800/70" : "text-gray-700 dark:text-gray-300"
              }`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span>{tCommon("more")}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`}
              />
            </motion.button>

            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[160px] z-20"
                >
                  {moreLinks.map((link) => (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        pathname === link.href
                          ? "text-red-600 bg-red-50/50 dark:bg-red-900/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                      }`}
                      onClick={() => setIsMoreOpen(false)}
                    >
                      <link.icon size={14} className="text-current" />
                      <span>{link.label}</span>
                    </motion.a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* الأزرار (LanguageSwitcher + Apply) */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <LanguageSwitcher />
          <Link
            href="/apply"
            className="group relative inline-block overflow-hidden rounded-full border border-red-600 bg-red-600 px-5 py-2 text-center font-semibold text-white transition-colors hover:bg-red-700 shrink-0"
          >
            <div className="flex items-center justify-center gap-2 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-0">
              <div className="h-2 w-2 rounded-full bg-white transition-all duration-300 group-hover:scale-[100.8]" />
              <span className="text-sm">{tCommon("applyNow")}</span>
            </div>
            <div className="absolute inset-0 flex -translate-x-full items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <span className="text-sm">{tCommon("applyNow")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* زر الجوال */}
        <button
          ref={toggleRef}
          className="lg:hidden"
          aria-label="Toggle menu"
          aria-controls="mobile-menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <motion.div
            animate={shouldReduceMotion ? {} : { rotate: isMenuOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </motion.div>
        </button>
      </div>

      {/* القائمة المتنقلة */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            className="lg:hidden fixed inset-0 top-20 bg-white z-40 flex flex-col"
            initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <nav className="flex flex-col gap-2 p-6">
              {ALL_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={shouldReduceMotion ? {} : { opacity: 0, x: isRTL ? 15 : -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={shouldReduceMotion ? {} : { duration: 0.2, delay: i * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="py-3 text-lg font-medium border-b border-gray-100 block flex items-center gap-3"
                  >
                    <link.icon size={20} className="text-red-600" />
                    <span>{link.label}</span>
                  </Link>
                </motion.div>
              ))}
              <div className="pt-4 flex items-center justify-between gap-4">
                <LanguageSwitcher />
              </div>
              <div className="pt-4">
                <Button href="/apply" variant="primary" size="md" className="w-full">
                  {tCommon("applyNow")}
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}