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
    <div className="flex gap-1.5 mb-4">
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
        const pct = completionByWeek[week] ?? 0;
        const isActive = week === activeWeek;
        return (
          <button
            key={week}
            onClick={() => onWeekChange(week)}
            className={clsx(
              "flex-1 rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer",
              isActive
                ? "bg-accent text-white border-2 border-accent"
                : "bg-transparent border border-border text-text-muted hover:text-text-primary"
            )}
          >
            W{week}
            {pct > 0 && (
              <span className="ml-1 text-[9px] opacity-70">{pct}%</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
