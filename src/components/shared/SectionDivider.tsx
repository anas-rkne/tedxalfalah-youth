// src/components/shared/SectionDivider.tsx
interface SectionDividerProps {
  dark?: boolean;
}

export default function SectionDivider({ dark = false }: SectionDividerProps) {
  return (
    <div
      className={`h-px max-w-[200px] mx-auto bg-gradient-to-r from-transparent ${
        dark ? "via-border/30" : "via-border"
      } to-transparent`}
    />
  );
}