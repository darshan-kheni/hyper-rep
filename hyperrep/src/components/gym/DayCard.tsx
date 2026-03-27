"use client";

import { ChevronRight } from "lucide-react";
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
        "w-full rounded-2xl border bg-bg-card p-4 text-left transition-all cursor-pointer",
        "flex items-center justify-between",
        isRestDay ? "opacity-40 border-border" : "border-border hover:border-accent/30"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {day}
          </span>
          {hasNewExercises && (
            <span className="rounded-full bg-accent-subtle px-1.5 py-0.5 text-[8px] font-bold text-accent">
              NEW EXERCISES
            </span>
          )}
          {isDone && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[8px] font-extrabold text-white">
              DONE
            </span>
          )}
        </div>
        <div className="mt-0.5 text-sm font-bold">{title}</div>
        <div className="mt-0.5 text-[11px] text-text-muted">{focus}</div>
        {!isRestDay && completionPct > 0 && completionPct < 100 && (
          <div className="mt-2 h-[3px] w-20 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-400"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-text-muted">
        {exerciseCount > 0 && (
          <span className="text-[11px]">{exerciseCount}</span>
        )}
        <ChevronRight size={16} />
      </div>
    </button>
  );
}
