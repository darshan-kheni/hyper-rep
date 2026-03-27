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
        "rounded-2xl border bg-bg-card p-4 shadow-sm shadow-black/5 dark:shadow-black/20 transition-all duration-200",
        active
          ? "border-border/50 border-l-2 border-l-accent bg-accent-subtle"
          : "border-border/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
