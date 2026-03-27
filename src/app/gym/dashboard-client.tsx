"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Target } from "lucide-react";
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

  // Weight progress calculation
  const progressPct = currentWeight && targetWeight
    ? Math.min(Math.round((currentWeight / targetWeight) * 100), 100)
    : 0;
  const remaining = currentWeight && targetWeight
    ? Math.max(targetWeight - currentWeight, 0).toFixed(1)
    : null;

  return (
    <div>
      {/* Weight goal card */}
      <div className="mb-5 rounded-2xl border border-border/50 bg-bg-card p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle">
              <Target size={16} className="text-accent" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Weight Goal
              </div>
            </div>
          </div>
          {remaining && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-accent">
              <TrendingUp size={12} />
              <span>{remaining} kg to go</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-black tabular-nums">
            {currentWeight ? `${currentWeight}` : "??"}
            <span className="text-sm font-semibold text-text-muted ml-0.5">kg</span>
          </span>
          <span className="text-sm font-bold text-text-muted">
            <span className="text-accent">{targetWeight}</span> kg
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
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
      <div className="flex flex-col gap-2.5">
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
