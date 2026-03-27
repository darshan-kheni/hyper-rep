import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-medium uppercase tracking-wide text-text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          "rounded-xl border border-border bg-bg-elevated px-4 py-3 min-h-[44px] text-sm text-text-primary",
          "placeholder:text-text-muted",
          "focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-transparent",
          "transition-all duration-150",
          error && "border-error focus:ring-error",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
