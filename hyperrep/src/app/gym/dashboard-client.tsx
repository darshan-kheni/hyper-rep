"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WeekTabs } from "@/components/gym/WeekTabs";
import { DayCard } from "@/components/gym/DayCard";

type DayData = {
  dayOfWeek: number;
  dayName: string;
  title: string;
  focus: string;
  isRestDay: boolean;
  exerciseCount: number;
  completedCount: number;
  templateId: string;
  hasNewExercises: boolean;
};

type WeekData = {
  days: DayData[];
  totalExercises: number;
  completedExercises: number;
};

interface DashboardClientProps {
  weeks: Record<number, WeekData>;
  programId: string;
  currentWeight: number | null;
  targetWeight: number;
}

export function DashboardClient({
  weeks,
  programId,
  currentWeight,
  targetWeight,
}: DashboardClientProps) {
  const [activeWeek, setActiveWeek] = useState(1);
  const router = useRouter();

  const weekNums = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);
  const totalWeeks = weekNums.length || 4;

  const completionByWeek: Record<number, number> = {};
  for (const wk of weekNums) {
    const w = weeks[wk];
    completionByWeek[wk] = w.totalExercises
      ? Math.round((w.completedExercises / w.totalExercises) * 100)
      : 0;
  }

  const currentWeekData = weeks[activeWeek];
  const days = currentWeekData?.days || [];

  return (
    <div>
      {/* Goal banner */}
      <div className="mb-4 rounded-2xl border border-border bg-bg-card p-4 text-center">
        <div className="text-sm font-bold text-text-muted">
          {currentWeight ? `${currentWeight} kg` : "??"} →{" "}
          <span className="text-accent">{targetWeight} kg</span>
        </div>
        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Weight Goal
        </div>
      </div>

      {/* Week tabs */}
      <WeekTabs
        totalWeeks={totalWeeks}
        activeWeek={activeWeek}
        onWeekChange={setActiveWeek}
        completionByWeek={completionByWeek}
      />

      {/* Day cards */}
      <div className="flex flex-col gap-2">
        {days
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          .map((day) => {
            const pct = day.exerciseCount
              ? Math.round(
                  (day.completedCount / day.exerciseCount) * 100
                )
              : day.isRestDay
                ? -1
                : 0;

            return (
              <DayCard
                key={day.dayOfWeek}
                day={day.dayName}
                title={day.title}
                focus={day.focus}
                exerciseCount={day.exerciseCount}
                completionPct={pct === -1 ? 0 : pct}
                isRestDay={day.isRestDay}
                hasNewExercises={day.hasNewExercises}
                onClick={() =>
                  router.push(
                    `/gym/workout?week=${activeWeek}&day=${day.dayOfWeek}&templateId=${day.templateId}&programId=${programId}`
                  )
                }
              />
            );
          })}
      </div>
    </div>
  );
}
