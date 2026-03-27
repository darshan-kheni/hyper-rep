"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { clsx } from "clsx";
import { RestTimer } from "./RestTimer";
import { LockCountdown } from "./LockCountdown";
import { isSetLocked } from "@/lib/gym/lock-utils";

type CompletedLog = {
  id: string;
  template_exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  weight_used: number | null;
  weight_unit: string;
  locked_at: string | null;
};

type TemplateExercise = {
  id: string;
  sets: number;
  reps: string;
  target_weight: string | null;
  rest_seconds: number;
  notes: string | null;
  exercises: {
    id: string;
    name: string;
    muscle_group: string;
    equipment: string;
  };
};

interface ExerciseCardProps {
  templateExercise: TemplateExercise;
  completedSets: CompletedLog[];
  allLogs: CompletedLog[];
  templateExerciseSortOrders: Record<string, number>;
  session: { id: string; started_at: string; ended_at: string | null } | null;
  onToggleSet: (
    templateExerciseId: string,
    exerciseId: string,
    setNumber: number,
    isCompleted: boolean,
    weight: number | null,
    reps: number | null
  ) => void;
  hasSession: boolean;
  preferredUnit: string;
}

export function ExerciseCard({
  templateExercise: te,
  completedSets,
  allLogs,
  templateExerciseSortOrders,
  session,
  onToggleSet,
  hasSession,
  preferredUnit,
}: ExerciseCardProps) {
  const exercise = te.exercises;
  const allDone = completedSets.length >= te.sets;
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Parse target weight number (strip "lbs", "BW", "ea" etc.)
  const parseWeight = (w: string | null): number | null => {
    if (!w || w === "BW") return null;
    const num = parseFloat(w.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? null : num;
  };

  const parseReps = (r: string): number | null => {
    const num = parseInt(r);
    return isNaN(num) ? null : num;
  };

  const targetWeightNum = parseWeight(te.target_weight);
  const targetRepsNum = parseReps(te.reps);

  return (
    <div
      className={clsx(
        "mb-3 rounded-2xl border p-4 transition-all",
        allDone
          ? "border-accent bg-accent-subtle opacity-60"
          : "border-border bg-bg-card"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "text-[15px] font-bold",
                allDone && "line-through"
              )}
            >
              {exercise.name}
            </span>
            <span className="rounded-full bg-accent-subtle px-1.5 py-0.5 text-[8px] font-bold text-accent">
              {exercise.equipment}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-2 flex gap-4 flex-wrap">
        {[
          { label: "Sets", value: te.sets },
          { label: "Reps", value: te.reps },
          { label: "Weight", value: te.target_weight || "BW" },
          { label: "Rest", value: `${te.rest_seconds}s` },
        ].map((item) => (
          <div key={item.label}>
            <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
              {item.label}
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {te.notes && (
        <div className="mt-3 rounded-lg bg-accent-subtle/50 px-3 py-2 text-[11px] italic text-text-muted leading-relaxed">
          {te.notes}
        </div>
      )}

      {/* Set rows */}
      {hasSession && (
        <div className="mt-3 flex flex-col gap-1.5">
          {Array.from({ length: te.sets }, (_, i) => i + 1).map((setNum) => {
            const completedLog = completedSets.find(
              (l) => l.set_number === setNum
            );
            const isCompleted = !!completedLog;

            // Check lock status
            const locked = isCompleted && completedLog
              ? isSetLocked(
                  completedLog,
                  allLogs,
                  templateExerciseSortOrders,
                  session ? { ended_at: session.ended_at, locked_at: null } : null
                )
              : false;

            return (
              <SetRow
                key={setNum}
                setNumber={setNum}
                isCompleted={isCompleted}
                isLocked={locked}
                lockedAt={completedLog?.locked_at || null}
                targetWeight={targetWeightNum}
                targetReps={targetRepsNum}
                targetWeightLabel={te.target_weight}
                preferredUnit={preferredUnit}
                onToggle={(weight, reps) => {
                  if (locked) return;
                  onToggleSet(
                    te.id,
                    exercise.id,
                    setNum,
                    !isCompleted,
                    weight,
                    reps
                  );
                  if (!isCompleted && te.rest_seconds > 0) {
                    setShowRestTimer(true);
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* Rest timer */}
      {showRestTimer && (
        <RestTimer
          seconds={te.rest_seconds}
          onDismiss={() => setShowRestTimer(false)}
        />
      )}
    </div>
  );
}

// ── SetRow (inline, same file) ──
function SetRow({
  setNumber,
  isCompleted,
  isLocked,
  lockedAt,
  targetWeight,
  targetReps,
  targetWeightLabel,
  preferredUnit,
  onToggle,
}: {
  setNumber: number;
  isCompleted: boolean;
  isLocked: boolean;
  lockedAt: string | null;
  targetWeight: number | null;
  targetReps: number | null;
  targetWeightLabel: string | null;
  preferredUnit: string;
  onToggle: (weight: number | null, reps: number | null) => void;
}) {
  const [weight, setWeight] = useState<string>(
    targetWeight?.toString() || ""
  );
  const [reps, setReps] = useState<string>(
    targetReps?.toString() || ""
  );

  const isBW = targetWeightLabel === "BW" || targetWeightLabel?.includes("BW");
  const inputDisabled = isCompleted || isLocked;

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-xl px-3 py-2 transition-all",
        isLocked
          ? "bg-bg-elevated/50 opacity-50"
          : isCompleted
            ? "bg-accent-subtle/50"
            : "bg-bg-elevated"
      )}
    >
      <span className="w-6 text-center text-[10px] font-bold text-text-muted">
        {setNumber}
      </span>

      {!isBW && (
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="lbs"
          className="w-16 rounded-lg border border-border bg-bg-card px-2 py-1 text-center font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-accent"
          disabled={inputDisabled}
        />
      )}

      {isBW && (
        <span className="w-16 text-center font-mono text-xs font-bold text-text-muted">
          BW
        </span>
      )}

      <span className="text-[10px] text-text-muted">{preferredUnit}</span>

      <span className="text-[10px] text-text-muted">×</span>

      <input
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="reps"
        className="w-14 rounded-lg border border-border bg-bg-card px-2 py-1 text-center font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-accent"
        disabled={inputDisabled}
      />

      {/* Lock countdown for editable-but-ticking sets */}
      {isCompleted && !isLocked && lockedAt && (
        <LockCountdown lockAt={lockedAt} />
      )}

      {/* Lock icon or check button */}
      {isLocked ? (
        <div className="ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-elevated text-text-muted">
          <Lock size={12} />
        </div>
      ) : (
        <button
          onClick={() =>
            onToggle(
              parseFloat(weight) || null,
              parseInt(reps) || null
            )
          }
          className={clsx(
            "ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors cursor-pointer",
            isCompleted
              ? "bg-accent text-white"
              : "border-2 border-border text-text-muted hover:border-accent"
          )}
        >
          {isCompleted && <Check size={14} />}
        </button>
      )}
    </div>
  );
}
