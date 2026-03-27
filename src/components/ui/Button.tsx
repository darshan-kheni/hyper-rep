"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white font-bold shadow-md shadow-accent/20 hover:brightness-110",
  secondary:
    "bg-transparent border border-border text-text-primary font-semibold hover:bg-bg-elevated",
  ghost:
    "bg-transparent text-text-muted font-semibold hover:text-accent hover:bg-accent-subtle",
  danger:
    "bg-transparent border border-error text-error font-semibold hover:bg-error/10",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-xl px-5 py-3 min-h-[44px] text-sm transition-all duration-150 cursor-pointer",
        "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
