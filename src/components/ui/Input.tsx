"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

interface InputProps {
  label: string;
  id: string;
  error?: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  select?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  children?: React.ReactNode;
  registration: UseFormRegisterReturn;
}

const inputClasses =
  "w-full border border-gray-300 rounded-full px-6 py-3 text-base focus:outline-none focus:ring-2 focus:ring-red-500";
const textareaClasses =
  "w-full border border-gray-300 rounded-3xl px-6 py-4 text-base min-h-32 resize-y focus:outline-none focus:ring-2 focus:ring-red-500";

export default function Input({
  label,
  id,
  error,
  placeholder,
  type = "text",
  textarea = false,
  select = false,
  rows,
  min,
  max,
  children,
  registration,
}: InputProps) {
  const { ref, ...rest } = registration;

  if (textarea) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1">
          {label}
        </label>
        <textarea
          id={id}
          placeholder={placeholder}
          rows={rows}
          className={textareaClasses}
          ref={ref}
          {...rest}
        />
        {error && (
          <p className="text-red-600 text-sm mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (select) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1">
          {label}
        </label>
        <select
          id={id}
          className={inputClasses}
          ref={ref}
          {...rest}
        >
          {children}
        </select>
        {error && (
          <p className="text-red-600 text-sm mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        min={min}
        max={max}
        className={inputClasses}
        ref={ref}
        {...rest}
      />
      {error && (
        <p className="text-red-600 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
