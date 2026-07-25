"use client";
import { memo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";

type MoreDropdownProps = {
  moreLinks: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }>;
  isRTL: boolean;
  isMoreOpen: boolean;
  setIsMoreOpen: (open: boolean) => void;
  shouldReduceMotion?: boolean | null;
  pathname: string;
  tCommon: { more: string };
};

const MoreDropdown = memo(function MoreDropdown({
  moreLinks,
  isRTL,
  isMoreOpen,
  setIsMoreOpen,
  shouldReduceMotion,
  pathname,
  tCommon,
}: MoreDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const internalReduceMotion = useReducedMotion();
  const shouldReduce = shouldReduceMotion ?? internalReduceMotion;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsMoreOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={() => setIsMoreOpen(true)}
      onMouseLeave={() => setIsMoreOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setTimeout(() => setIsMoreOpen(false), 100);
        }
      }}
    >
      <button
        className={`group relative flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
          isMoreOpen
            ? "bg-tedx-red/10 text-tedx-red"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        }`}
        aria-expanded={isMoreOpen}
        aria-haspopup="menu"
        onClick={() => setIsMoreOpen(!isMoreOpen)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsMoreOpen(false);
        }}
      >
        <span>{tCommon.more}</span>
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
            onKeyDown={handleKeyDown}
          >
            <div
              className={`absolute -top-1.5 ${
                isRTL ? "right-4" : "left-4"
              } w-3 h-3 bg-background rotate-45 border-l border-t border-border`}
            />

            {moreLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
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
                  <Icon size={15} className="text-current" />
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId={shouldReduce ? undefined : "more-active-dot"}
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
  );
});

export default MoreDropdown;