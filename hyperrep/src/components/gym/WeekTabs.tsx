"use client";

import { clsx } from "clsx";

interface WeekTabsProps {
  totalWeeks: number;
  activeWeek: number;
  onWeekChange: (week: number) => void;
  completionByWeek?: Record<number, number>;
}

export function WeekTabs({
  totalWeeks,
  activeWeek,
  onWeekChange,
  completionByWeek = {},
}: WeekTabsProps) {
  return (
    <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
        const pct = completionByWeek[week] ?? 0;
        const isActive = week === activeWeek;
        return (
          <button
            key={week}
            onClick={() => onWeekChange(week)}
            className={clsx(
              "relative flex-1 min-w-[60px] rounded-xl py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer",
              isActive
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "bg-bg-card border border-border/50 text-text-muted hover:text-text-primary hover:border-accent/30 active:scale-[0.97]"
            )}
          >
            <span>W{week}</span>
            {pct > 0 && (
              <span
                className={clsx(
                  "ml-1 text-[9px]",
                  isActive ? "text-white/70" : "text-text-muted"
                )}
              >
                {pct}%
              </span>
            )}
            {pct === 100 && (
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success border-2 border-bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
