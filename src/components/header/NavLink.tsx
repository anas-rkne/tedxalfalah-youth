"use client";
import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";

type NavLinkProps = {
  link: {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  };
  index: number;
  shouldReduceMotion?: boolean | null;
};

const NavLink = memo(function NavLink({
  link,
  index,
  shouldReduceMotion,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === link.href;
  const Icon = link.icon;
  const internalReduceMotion = useReducedMotion();
  const shouldReduce = shouldReduceMotion ?? internalReduceMotion;

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
          isActive
            ? "text-tedx-red"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      />
      <span
        className={`relative z-10 text-sm font-medium transition-colors duration-300 ${
          isActive
            ? "text-tedx-red font-semibold"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {link.label}
      </span>
      {isActive && (
        <motion.div
          layoutId={shouldReduce ? undefined : "active-nav"}
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-tedx-red"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
});

export default NavLink;