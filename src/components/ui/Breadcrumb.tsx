import Link from "next/link";
import { useRTL } from "@/hooks/useRTL";

type Segment = {
  label: string;
  href?: string;
};

type Props = {
  segments: Segment[];
  ariaLabel?: string;
};

export default function Breadcrumb({ segments, ariaLabel = "Breadcrumb" }: Props) {
  const { isRTL } = useRTL();

  if (!segments || segments.length === 0) return null;

  return (
    <nav aria-label={ariaLabel} dir={isRTL ? "rtl" : "ltr"}>
      <ol className="flex items-center gap-2 text-xs text-zinc-400">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {isLast || !seg.href ? (
                <span className={isLast ? "text-zinc-600" : ""}>
                  {seg.label}
                </span>
              ) : (
                <Link
                  href={seg.href}
                  className="hover:text-tedx-red transition-colors"
                >
                  {seg.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
