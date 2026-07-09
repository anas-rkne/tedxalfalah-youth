import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg shadow-sm bg-tedx-white overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}
