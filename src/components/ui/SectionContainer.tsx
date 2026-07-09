import { ReactNode } from "react";

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}

export default function SectionContainer({
  children,
  className = "",
  as = "div",
}: SectionContainerProps) {
  const Tag = as;
  return (
    <Tag className={`max-w-7xl mx-auto px-4 md:px-8 ${className}`}>
      {children}
    </Tag>
  );
}
