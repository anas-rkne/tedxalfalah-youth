"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

interface Section {
  id: string;
  label: string;
  labelAr: string;
}

const sections: Section[] = [
  { id: "hero", label: "Home", labelAr: "الرئيسية" },
  { id: "about", label: "About", labelAr: "عنّا" },
  { id: "theme", label: "Theme", labelAr: "الموضوع" },
  { id: "speakers", label: "Speakers", labelAr: "المتحدثون" },
  { id: "highlights", label: "Highlights", labelAr: "الأبرز" },
  { id: "apply", label: "Apply", labelAr: "تقديم" },
  { id: "sponsors", label: "Sponsors", labelAr: "الشركاء" },
  { id: "contact", label: "Contact", labelAr: "تواصل" },
];

export default function ScrollIndicator() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isRTL, setIsRTL] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Only show on HOME page ───
  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";
  const isHomePage = pathWithoutLocale === "/";

  // Detect RTL
  useEffect(() => {
    const html = document.documentElement;
    setIsRTL(html.dir === "rtl");
  }, []);

  // ─── Setup IntersectionObserver ───
  // Re-runs when pathname changes (page navigation)
  const setupObserver = useCallback(() => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Small delay to ensure DOM is ready after navigation
    const timer = setTimeout(() => {
      const options = {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      };

      observerRef.current = new IntersectionObserver((entries) => {
        // Sort by index to prefer the LAST intersecting section (bottom-most)
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            entry: e,
            index: sections.findIndex((s) => s.id === e.target.id),
          }))
          .filter((item) => item.index !== -1)
          .sort((a, b) => b.index - a.index);

        if (intersecting.length > 0) {
          const topSection = intersecting[0];
          setActiveIndex(topSection.index);

          // Hide when on hero (index 0), show otherwise
          const shouldShow = topSection.index > 0;
          if (shouldShow) {
            // Clear any pending hide
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
            setIsVisible(true);
          } else {
            // Small delay before hiding to prevent flicker
            hideTimeoutRef.current = setTimeout(() => {
              setIsVisible(false);
            }, 80);
          }
        }
      }, options);

      sections.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el) observerRef.current?.observe(el);
      });
    }, 150); // 150ms delay after navigation

    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(false);
      return;
    }
    const cleanup = setupObserver();
    return cleanup;
  }, [isHomePage, setupObserver]);

  // ─── Scroll handler for visibility toggle (backup) ───
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    // Hide when near top (hero section)
    if (scrollY < vh * 0.35) {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setActiveIndex(0);
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (!isHomePage) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage, handleScroll]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isHomePage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] as const }}
          className="fixed hidden lg:flex flex-col items-center"
          style={{
            zIndex: 40,
            [isRTL ? "right" : "left"]: "28px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
          aria-label="Section navigation"
        >
          {/* Vertical line */}
          <div className="absolute w-px h-full bg-zinc-200/60" />

          {sections.map((section, index) => {
            const isActive = index === activeIndex;
            if (index === 0) return null;

            return (
              <div
                key={section.id}
                className="relative flex items-center my-2"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Label tooltip */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.span
                      initial={{ opacity: 0, x: isRTL ? 8 : -8, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: isRTL ? 8 : -8, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute whitespace-nowrap text-xs font-medium text-zinc-500 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm border border-zinc-100"
                      style={{
                        [isRTL ? "left" : "right"]: "20px",
                      }}
                    >
                      {isRTL ? section.labelAr : section.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Dot button */}
                <button
                  onClick={() => scrollToSection(section.id)}
                  className="relative z-10 group"
                  aria-label={`Go to ${isRTL ? section.labelAr : section.label}`}
                  aria-current={isActive ? "true" : undefined}
                  title={isRTL ? section.labelAr : section.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow: "0 0 12px 2px rgba(230, 43, 30, 0.4)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <motion.div
                    className={`rounded-full transition-colors duration-300 ${
                      isActive
                        ? "bg-[#E62B1E]"
                        : "bg-zinc-300 group-hover:bg-zinc-400"
                    }`}
                    animate={{
                      width: isActive ? 10 : 6,
                      height: isActive ? 10 : 6,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                </button>
              </div>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}