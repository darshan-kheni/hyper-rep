"use client";

import { ChevronRight, Check, Moon } from "lucide-react";
import { clsx } from "clsx";

interface DayCardProps {
  day: string;
  title: string;
  focus: string;
  exerciseCount: number;
  completionPct: number;
  isRestDay: boolean;
  hasNewExercises: boolean;
  onClick: () => void;
}

export function DayCard({
  day,
  title,
  focus,
  exerciseCount,
  completionPct,
  isRestDay,
  hasNewExercises,
  onClick,
}: DayCardProps) {
  const isDone = completionPct === 100;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full rounded-2xl border bg-bg-card p-4 text-left transition-all duration-200 cursor-pointer",
        "flex items-center justify-between gap-3",
        "active:scale-[0.98]",
        isRestDay
          ? "opacity-50 border-border/30"
          : isDone
            ? "border-success/30 shadow-sm shadow-success/5"
            : "border-border/50 shadow-card hover:border-accent/30 hover:shadow-elevated"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {day}
          </span>
          {isRestDay && (
            <span className="flex items-center gap-0.5 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[8px] font-bold text-text-muted">
              <Moon size={8} />
              REST
            </span>
          )}
          {hasNewExercises && (
            <span className="rounded-full bg-accent-subtle px-1.5 py-0.5 text-[8px] font-bold text-accent">
              NEW
            </span>
          )}
          {isDone && (
            <span className="flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[8px] font-extrabold text-success">
              <Check size={8} strokeWidth={3} />
              DONE
            </span>
          )}
        </div>
        <div className="mt-1 text-sm font-bold">{title}</div>
        <div className="mt-0.5 text-[11px] text-text-muted">{focus}</div>

        {/* Progress bar */}
        {!isRestDay && completionPct > 0 && completionPct < 100 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/50">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-text-muted tabular-nums">
              {completionPct}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-text-muted">
        {exerciseCount > 0 && !isRestDay && (
          <span className="text-[11px] font-semibold tabular-nums">
            {isDone ? "" : exerciseCount}
          </span>
        )}
        <ChevronRight
          size={16}
          className={clsx(
            "transition-transform duration-200",
            !isRestDay && "group-hover:translate-x-0.5"
          )}
        />
      </div>
    </button>
  );
}
