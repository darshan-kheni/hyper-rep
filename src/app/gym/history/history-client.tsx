"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, Clock, Flame, Dumbbell } from "lucide-react";
import { clsx } from "clsx";

type ExerciseLog = {
  session_id: string;
  set_number: number;
  reps_completed: number | null;
  weight_used: number | null;
  weight_unit: string;
  exercises: { name: string; muscle_group: string } | { name: string; muscle_group: string }[];
};

type SessionData = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  mood_rating: number | null;
  notes: string | null;
  template: {
    day_title: string;
    day_focus: string | null;
    week_number: number;
    day_of_week: number;
  } | null;
  logs: ExerciseLog[];
};

interface HistoryClientProps {
  sessions: SessionData[];
}

export function HistoryClient({ sessions }: HistoryClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-elevated">
          <Clock size={28} className="text-text-muted" />
        </div>
        <h2 className="text-lg font-bold">No sessions yet</h2>
        <p className="mt-1 text-sm text-text-muted">
          Complete a workout to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Session History</h2>

      <div className="flex flex-col gap-2.5">
        {sessions.map((s) => {
          const isExpanded = expandedId === s.id;
          const date = format(parseISO(s.started_at), "EEE, MMM d");
          const time = format(parseISO(s.started_at), "h:mm a");

          // Group logs by exercise name
          const exerciseGroups: Record<
            string,
            { sets: number; maxWeight: number | null; totalReps: number; unit: string }
          > = {};
          for (const log of s.logs) {
            const ex = Array.isArray(log.exercises) ? log.exercises[0] : log.exercises;
            const name = ex?.name || "Unknown";
            if (!exerciseGroups[name]) {
              exerciseGroups[name] = { sets: 0, maxWeight: null, totalReps: 0, unit: log.weight_unit };
            }
            exerciseGroups[name].sets++;
            exerciseGroups[name].totalReps += log.reps_completed || 0;
            if (log.weight_used && (!exerciseGroups[name].maxWeight || log.weight_used > exerciseGroups[name].maxWeight)) {
              exerciseGroups[name].maxWeight = log.weight_used;
            }
          }

          return (
            <div
              key={s.id}
              className={clsx(
                "rounded-2xl border bg-bg-card shadow-card transition-all duration-200",
                isExpanded ? "border-accent/20" : "border-border/50"
              )}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                className="w-full text-left cursor-pointer p-4 active:scale-[0.99] transition-transform duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      {date} · {time}
                    </div>
                    <div className="mt-1 text-sm font-bold">
                      {s.template?.day_title || "Workout"}
                    </div>
                    {s.template?.day_focus && (
                      <div className="mt-0.5 text-[11px] text-text-muted">
                        {s.template.day_focus}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                      {s.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-text-muted" />
                          <span className="font-mono text-xs font-bold text-accent tabular-nums">
                            {s.duration_minutes}m
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Dumbbell size={11} className="text-text-muted" />
                        <span className="text-[11px] font-semibold text-text-muted tabular-nums">
                          {s.logs.length}
                        </span>
                      </div>
                      {s.mood_rating && (
                        <div className="flex items-center gap-1">
                          <Flame size={11} className="text-text-muted" />
                          <span className="text-[11px] font-semibold text-text-muted tabular-nums">
                            {s.mood_rating}/5
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-text-muted">
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && Object.keys(exerciseGroups).length > 0 && (
                <div className="mx-4 mb-4 rounded-xl border border-border/30 bg-bg-elevated/50 overflow-hidden">
                  {Object.entries(exerciseGroups).map(([name, data], idx) => (
                    <div
                      key={name}
                      className={clsx(
                        "flex items-center justify-between px-3 py-2.5",
                        idx > 0 && "border-t border-border/30"
                      )}
                    >
                      <span className="text-xs font-semibold">{name}</span>
                      <span className="font-mono text-[11px] text-text-muted tabular-nums">
                        {data.sets}×{Math.round(data.totalReps / data.sets)}
                        {data.maxWeight
                          ? ` @ ${data.maxWeight} ${data.unit}`
                          : " BW"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
