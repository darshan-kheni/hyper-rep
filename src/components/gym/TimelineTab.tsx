"use client";

import type { MealSlot } from "@/lib/gym/meal-data";

interface TimelineTabProps {
  meals: MealSlot[];
}

export function TimelineTab({ meals }: TimelineTabProps) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

      {meals.map((m, i) => {
        const isGym = m.key === "gym";
        return (
          <div key={i} className="relative mb-5 pl-5">
            {/* Dot */}
            <div
              className={`absolute -left-5 top-1 h-3 w-3 rounded-full border-2 ${
                isGym
                  ? "border-accent bg-accent"
                  : "border-border bg-bg-card"
              }`}
            />
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {m.time}
            </div>
            <div
              className={`mt-0.5 text-sm font-bold ${
                isGym ? "text-accent" : "text-text-primary"
              }`}
            >
              {m.label}
            </div>
            {m.suppNote && (
              <div className="mt-0.5 text-[11px] text-text-muted">
                {m.suppNote}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
