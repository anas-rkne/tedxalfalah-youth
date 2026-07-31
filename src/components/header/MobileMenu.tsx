"use client";
import { memo, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import AnimatedSlidingButton from "@/components/ui/AnimatedSlidingButton";

type MobileMenuProps = {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  allLinks: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }>;
  isRTL: boolean;
  shouldReduceMotion?: boolean | null;
  pathname: string;
  applyNowText: string;
};

const MobileMenu = memo(function MobileMenu({
  isMenuOpen,
  setIsMenuOpen,
  allLinks,
  isRTL,
  shouldReduceMotion,
  pathname,
  applyNowText,
}: MobileMenuProps) {
  const internalReduceMotion = useReducedMotion();
  const shouldReduce = shouldReduceMotion ?? internalReduceMotion;

  // 🔥 تعطيل التمرير في الخلفية عند فتح القائمة
  const lockScroll = useCallback(() => {
    document.body.style.overflow = "hidden";
  }, []);

  const unlockScroll = useCallback(() => {
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      lockScroll();
      // (اختياري) حفظ موضع التمرير الحالي إذا كنت تريد إعادته بعد الإغلاق
    } else {
      unlockScroll();
    }
    return () => {
      unlockScroll(); // ضمان إعادة التمرير عند إلغاء تثبيت المكون
    };
  }, [isMenuOpen, lockScroll, unlockScroll]);

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          id="mobile-menu"
          className="lg:hidden fixed inset-0 top-20 bg-background/98 backdrop-blur-2xl z-40 flex flex-col"
          initial={shouldReduce ? {} : { opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduce ? {} : { opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={isRTL ? "قائمة التنقل" : "Navigation Menu"}
        >
          <div
            className={`h-1 bg-gradient-to-${
              isRTL ? "l" : "r"
            } from-transparent via-tedx-red to-transparent`}
          />

          {/* 🔥 جعل القائمة قابلة للتمرير إذا كان المحتوى طويلاً */}
          <nav
            className="flex flex-col gap-1 p-4 sm:p-6 overflow-y-auto" 
            role="menu"
          >
            {allLinks.map((link, i) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <motion.div
                  key={link.href}
                  initial={
                    shouldReduce ? {} : { opacity: 0, x: isRTL ? 20 : -20 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.04,
                    ease: [0.23, 1, 0.32, 1],
                  }}
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
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-tedx-red/10" : "bg-muted"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={
                          isActive ? "text-tedx-red" : "text-muted-foreground"
                        }
                      />
                    </div>
                    <span>{link.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-tedx-red" />
                    )}
                  </Link>
                </motion.div>
              );
            })}

            <div className="mt-4 pt-4 border-t border-border">
              <div onClick={() => setIsMenuOpen(false)}>
                <AnimatedSlidingButton
                  href="/apply"
                  variant="primary"
                  className="w-full justify-center py-3.5 text-base font-semibold rounded-xl shadow-sm"
                >
                  <span className="flex items-center gap-2">{applyNowText}</span>
                </AnimatedSlidingButton>
              </div>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default MobileMenu;