"use client";

type FieldRegistration = {
  onChange: (...event: any[]) => void;
  onBlur: (...event: any[]) => void;
  ref: React.Ref<any>;
  name: string;
};

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
  registration: FieldRegistration;
}

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";

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
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses}
          {...registration}
        />
      ) : select ? (
        <select id={id} className={inputClasses} {...registration}>
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          min={min}
          max={max}
          className={inputClasses}
          {...registration}
        />
      )}
      {error && (
        <p className="text-red-600 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
