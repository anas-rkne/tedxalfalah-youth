"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRTL } from "@/hooks/useRTL";
import { Menu, X } from "lucide-react";
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

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const blurValue = useTransform(scrollY, [0, 80], [0, 12]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      // Focus trap within mobile menu
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

  const NAV_LINKS = [
    { label: t("home"), href: "/" },
    { label: t("speakers"), href: "/speakers" },
    { label: t("team"), href: "/team" },
    { label: t("venue"), href: "/venue" },
    { label: t("activations"), href: "/activations" },
    { label: t("schedule"), href: "/schedule" },
    { label: t("apply"), href: "/apply" },
    { label: t("sponsors"), href: "/sponsors" },
    { label: t("tickets"), href: "/tickets" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-center">
      <motion.div
        className="absolute inset-0 pointer-events-none bg-white/80 dark:bg-black/50"
        style={{
          opacity: headerOpacity,
          backdropFilter: shouldReduceMotion ? "none" : "blur(12px)",
          WebkitBackdropFilter: shouldReduceMotion ? "none" : "blur(12px)",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-black/10 dark:bg-white/10"
        style={{ opacity: borderOpacity }}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex w-full items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-tedx-red">TEDx</span>
          <span>AlFalah Youth</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative font-medium transition-colors hover:text-tedx-red text-xs xl:text-sm ${
                pathname === link.href ? "text-tedx-red" : "text-tedx-black"
              }`}
            >
              {link.label}
              <motion.span
                className="absolute -bottom-0.5 start-0 h-0.5 bg-tedx-red rounded-full"
                layoutId="nav-underline"
                initial={false}
                style={{ width: pathname === link.href ? "100%" : 0 }}
                animate={{ width: pathname === link.href ? "100%" : 0 }}
              />
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/apply"
            className="group relative overflow-hidden rounded-full border border-tedx-red bg-tedx-red px-6 py-2 text-center font-semibold text-tedx-white"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white transition-all duration-300 group-hover:scale-[100.8]" />
              <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
                {tCommon("applyNow")}
              </span>
            </div>
            <div className="absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
              <span>{tCommon("applyNow")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Mobile toggle */}
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

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            className="lg:hidden fixed inset-0 top-20 bg-tedx-white z-40 flex flex-col"
            initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <nav className="flex flex-col gap-2 p-6">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={shouldReduceMotion ? {} : { opacity: 0, x: isRTL ? 15 : -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={shouldReduceMotion ? {} : { duration: 0.2, delay: i * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="py-3 text-lg font-medium border-b border-gray-100 block"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-4 flex items-center justify-between gap-4">
                <LanguageSwitcher />
              </div>
              <div className="pt-4">
                <Button
                  href="/apply"
                  variant="primary"
                  size="md"
                  className="w-full"
                >
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
