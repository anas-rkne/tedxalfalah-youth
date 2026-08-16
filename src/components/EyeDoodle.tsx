import React from 'react';

export default function EyeDoodle({ className = "w-24 h-24 text-red-600" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor" // ملاحظة: لاستخدام لون المكون (text-red-600) ضع stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 12 42 Q 45 12 88 42" />
      <path d="M 42 44 A 13 13 0 1 1 58 44" />
      <path d="M 58 48 Q 70 55 85 60" />
      <path d="M 85 60 Q 90 67 88 75" />
      <path d="M 35 20 L 35 6" />
      <path d="M 50 14 L 50 4" />
      <path d="M 65 22 L 65 12" />
      <path d="M 92 40 Q 95 44 92 48" />
    </svg>
  );
}