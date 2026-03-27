"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
        <Clock size={32} className="mx-auto mb-3 text-text-muted" />
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

      <div className="flex flex-col gap-2">
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
            <Card key={s.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                className="w-full text-left cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      {date} · {time}
                    </div>
                    <div className="mt-0.5 text-sm font-bold">
                      {s.template?.day_title || "Workout"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-text-muted">
                      {s.template?.day_focus || ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {s.duration_minutes && (
                        <div className="font-mono text-xs font-bold text-accent">
                          {s.duration_minutes} min
                        </div>
                      )}
                      <div className="text-[10px] text-text-muted">
                        {s.logs.length} sets
                      </div>
                      {s.mood_rating && (
                        <div className="text-[10px] text-text-muted">
                          Mood: {s.mood_rating}/5
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-text-muted" />
                    ) : (
                      <ChevronDown size={16} className="text-text-muted" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && Object.keys(exerciseGroups).length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  {Object.entries(exerciseGroups).map(([name, data]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-xs font-semibold">{name}</span>
                      <span className="font-mono text-[11px] text-text-muted">
                        {data.sets}×{Math.round(data.totalReps / data.sets)}
                        {data.maxWeight
                          ? ` @ ${data.maxWeight} ${data.unit}`
                          : " BW"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
