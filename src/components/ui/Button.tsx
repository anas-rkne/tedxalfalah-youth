import { Link } from "@/i18n/navigation";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
}

interface ButtonAsButton
  extends ButtonBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: undefined;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-tedx-red text-tedx-white hover:bg-red-700 border border-tedx-red",
  outline:
    "bg-transparent text-tedx-black hover:bg-tedx-black hover:text-tedx-white border border-tedx-black",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...rest
}: ButtonProps) {
  const isDisabled = "disabled" in rest && rest.disabled;
  const classes = `inline-flex items-center justify-center font-semibold uppercase tracking-wide transition-all duration-200 rounded-lg ${sizeClasses[size]} ${variantClasses[variant]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tedx-red focus-visible:ring-offset-2 ${
    isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "active:scale-95"
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
