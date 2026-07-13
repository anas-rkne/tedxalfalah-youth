"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsMenuOpen(false);
      toggleRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      requestAnimationFrame(() => menuRef.current?.querySelector("a")?.focus());
    } else {
      document.removeEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen, handleEscape]);

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
    <header className="sticky top-0 z-50 bg-tedx-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
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
          <Button href="/apply" variant="primary" size="sm">
            {tCommon("applyNow")}
          </Button>
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
