"use client";

import type { InputHTMLAttributes } from "react";

type EditableCellInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

export function EditableCellInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  ...rest
}: EditableCellInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`statement-input w-full bg-white text-[12px] text-neutral-900 ${disabled ? "pointer-events-none opacity-90" : "focus:ring-2 focus:ring-indigo-600"} ${className ?? ""}`}
      {...rest}
    />
  );
}
