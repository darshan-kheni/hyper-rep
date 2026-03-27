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
    "bg-accent text-white font-bold hover:bg-accent-hover",
  secondary:
    "bg-transparent border border-border text-text-primary font-bold hover:bg-bg-elevated",
  ghost:
    "bg-transparent text-text-muted font-semibold hover:text-accent hover:bg-accent-subtle",
  danger:
    "bg-transparent border border-error text-error font-bold hover:bg-error/10",
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
        "rounded-xl px-5 py-3 text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
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
