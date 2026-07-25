// src/components/shared/SectionHeader.tsx
import SectionBadge from "@/components/ui/SectionBadge";

interface SectionHeaderProps {
  label: string;
  title: string;
  dark?: boolean;
}

export default function SectionHeader({ label, title, dark = false }: SectionHeaderProps) {
  return (
    <div className="text-center mb-12">
      <div className="flex justify-center mb-4">
        <SectionBadge className={dark ? "bg-white/10 border-white/20 text-white" : ""}>
          {label}
        </SectionBadge>
      </div>
      <h2 className={`heading-h2 text-center ${dark ? "text-white" : ""}`}>{title}</h2>
    </div>
  );
}