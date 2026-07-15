import { Link } from "@/i18n/navigation";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2, Check } from "lucide-react";

type ButtonVariant = "primary" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  loading?: boolean;
  showCheck?: boolean;
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
  loading = false,
  showCheck = false,
  ...rest
}: ButtonProps) {
  const { disabled: _disabled, ...safeRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  const isDisabled = _disabled || loading;
  const classes = `inline-flex items-center justify-center font-semibold uppercase tracking-wide transition-all duration-200 rounded-lg ${sizeClasses[size]} ${variantClasses[variant]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tedx-red focus-visible:ring-offset-2 ${
    isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "active:scale-95"
  } ${className}`;

  const content = loading ? (
    <span className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{children}</span>
    </span>
  ) : showCheck ? (
    <span className="flex items-center gap-2">
      <Check className="h-4 w-4" />
      <span>{children}</span>
    </span>
  ) : (
    children
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={isDisabled} {...safeRest}>
      {content}
    </button>
  );
}
