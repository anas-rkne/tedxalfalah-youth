"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations("common.nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

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
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-tedx-red ${
                pathname === link.href ? "text-tedx-red" : "text-tedx-black"
              }`}
            >
              {link.label}
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
          className="lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile fullscreen menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-20 bg-tedx-white z-40 flex flex-col">
          <nav className="flex flex-col gap-2 p-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="py-3 text-lg font-medium border-b border-gray-100"
              >
                {link.label}
              </Link>
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
        </div>
      )}
    </header>
  );
}
