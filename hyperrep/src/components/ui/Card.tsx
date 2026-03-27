import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export function Card({
  active = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border bg-bg-card p-4 transition-colors",
        active ? "border-accent bg-accent-subtle" : "border-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
