"use client";

import { Clock, Pill } from "lucide-react";
import type { MealSlot } from "@/lib/gym/meal-data";

interface MealsTabProps {
  meals: MealSlot[];
}

export function MealsTab({ meals }: MealsTabProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {meals
        .filter((m) => m.key !== "gym")
        .map((m, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-4 ${
              m.suppNote
                ? "border-accent/20 bg-accent-subtle"
                : "border-border bg-bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {m.suppNote ? (
                  <Pill size={14} className="text-accent" />
                ) : (
                  <Clock size={14} className="text-text-muted" />
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {m.label}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-text-muted">
                {m.time}
              </span>
            </div>
            {m.suppNote && (
              <div className="mt-1 text-xs text-text-primary leading-relaxed">
                {m.suppNote}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
