"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRTL } from "@/hooks/useRTL";

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
  { id: "schedule", label: "Schedule", labelAr: "الجدول" },
  { id: "apply", label: "Apply", labelAr: "تقديم" },
  { id: "sponsors", label: "Sponsors", labelAr: "الشركاء" },
  { id: "contact", label: "Contact", labelAr: "تواصل" },
];

export default function ScrollIndicator() {
  const pathname = usePathname();
  const { isRTL } = useRTL();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // الصفحة الرئيسية فقط
  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";
  const isHomePage = pathWithoutLocale === "/";

  // إعداد المراقب مرة واحدة عند الدخول للصفحة الرئيسية
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            index: sections.findIndex((s) => s.id === e.target.id),
          }))
          .filter((item) => item.index !== -1)
          .sort((a, b) => b.index - a.index);

        if (intersecting.length > 0) {
          const topIndex = intersecting[0].index;
          setActiveIndex(topIndex);

          if (topIndex > 0) {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            setIsVisible(true);
          } else {
            hideTimeoutRef.current = setTimeout(() => {
              setIsVisible(false);
            }, 80);
          }
        }
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    observerRef.current = observer;
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(false);
      return;
    }
    // انتظر قليلاً حتى يكتمل الرندر ثم أعد المراقب
    const timer = setTimeout(setupObserver, 150);
    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [isHomePage, setupObserver]);

  // مؤشر التمرير الاحتياطي
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
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
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="fixed hidden lg:flex flex-col items-center"
          style={{
            zIndex: 40,
            [isRTL ? "right" : "left"]: "28px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
          aria-label="Section navigation"
        >
          <div className="absolute w-px h-full bg-zinc-200/60" />

          {sections.map((section, index) => {
            const isActive = index === activeIndex;
            if (index === 0) return null; // إخفاء "hero"

            return (
              <div
                key={section.id}
                className="relative flex items-center my-2"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
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