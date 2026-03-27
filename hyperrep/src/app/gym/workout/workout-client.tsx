"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { startSession, endSession, toggleSetCompletion } from "@/lib/gym/actions";
import { ExerciseCard } from "@/components/gym/ExerciseCard";
import { SessionTimer } from "@/components/gym/SessionTimer";
import { MealsTab } from "@/components/gym/MealsTab";
import { TimelineTab } from "@/components/gym/TimelineTab";
import { MEALS_WORKOUT_DAY, MEALS_REST_DAY } from "@/lib/gym/meal-data";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

type TemplateExercise = {
  id: string;
  sets: number;
  reps: string;
  target_weight: string | null;
  rest_seconds: number;
  notes: string | null;
  sort_order: number;
  exercises: {
    id: string;
    name: string;
    muscle_group: string;
    equipment: string;
  };
};

type CompletedLog = {
  id: string;
  template_exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  weight_used: number | null;
  weight_unit: string;
  locked_at: string | null;
};

type Template = {
  id: string;
  day_title: string;
  day_focus: string | null;
  is_rest_day: boolean;
  week_number: number;
  day_of_week: number;
};

type Session = {
  id: string;
  started_at: string;
  ended_at: string | null;
} | null;

interface WorkoutClientProps {
  template: Template;
  templateExercises: TemplateExercise[];
  session: Session;
  completedLogs: CompletedLog[];
  programId: string;
  week: number;
  day: number;
  preferredUnit: string;
  gymStartTime: string;
  prevTemplate: { id: string; day_of_week: number; week_number: number; day_title: string } | null;
  nextTemplate: { id: string; day_of_week: number; week_number: number; day_title: string } | null;
}

export function WorkoutClient({
  template,
  templateExercises,
  session: initialSession,
  completedLogs: initialLogs,
  programId,
  week,
  day,
  preferredUnit,
  gymStartTime,
  prevTemplate,
  nextTemplate,
}: WorkoutClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [session, setSession] = useState(initialSession);
  const [showMoodRating, setShowMoodRating] = useState(false);
  const [activeTab, setActiveTab] = useState<"workout" | "meals" | "timeline">("workout");

  // Determine if this is a workout day (has exercises, not rest, not active recovery)
  const isWorkoutDay = templateExercises.length > 0 && !template.is_rest_day && !template.day_title.includes("Active Recovery");
  const mealTimeline = isWorkoutDay ? MEALS_WORKOUT_DAY : MEALS_REST_DAY;

  // Optimistic completion tracking
  const [optimisticLogs, addOptimisticLog] = useOptimistic(
    initialLogs,
    (
      state: CompletedLog[],
      action: { type: "toggle"; templateExerciseId: string; setNumber: number }
    ) => {
      const exists = state.find(
        (l) =>
          l.template_exercise_id === action.templateExerciseId &&
          l.set_number === action.setNumber
      );
      if (exists) {
        return state.filter(
          (l) =>
            !(
              l.template_exercise_id === action.templateExerciseId &&
              l.set_number === action.setNumber
            )
        );
      }
      return [
        ...state,
        {
          id: `optimistic-${Date.now()}`,
          template_exercise_id: action.templateExerciseId,
          set_number: action.setNumber,
          reps_completed: null,
          weight_used: null,
          weight_unit: preferredUnit,
          locked_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        },
      ];
    }
  );

  const completedCount = optimisticLogs.length;
  const totalSets = templateExercises.reduce((acc, te) => acc + te.sets, 0);
  const progressPct = totalSets ? Math.round((completedCount / totalSets) * 100) : 0;

  async function handleStartSession() {
    const now = new Date().toISOString();
    startTransition(async () => {
      const sessionId = await startSession(template.id, programId, now);
      setSession({ id: sessionId, started_at: now, ended_at: null });
    });
  }

  async function handleEndSession(mood?: number) {
    if (!session) return;
    startTransition(async () => {
      await endSession(session.id, mood);
      setSession({ ...session, ended_at: new Date().toISOString() });
      setShowMoodRating(false);
    });
  }

  async function handleToggleSet(
    templateExerciseId: string,
    exerciseId: string,
    setNumber: number,
    isCompleted: boolean,
    weight: number | null,
    reps: number | null
  ) {
    if (!session) return;

    startTransition(async () => {
      addOptimisticLog({
        type: "toggle",
        templateExerciseId,
        setNumber,
      });
      await toggleSetCompletion(
        session.id,
        exerciseId,
        templateExerciseId,
        setNumber,
        isCompleted,
        weight,
        reps,
        preferredUnit
      );
    });
  }

  if (template.is_rest_day) {
    return (
      <div className="py-20 text-center">
        <div className="text-4xl mb-4">😴</div>
        <h2 className="text-xl font-bold">{template.day_title}</h2>
        <p className="mt-2 text-sm text-text-muted">{template.day_focus}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Day title */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-text-muted">{template.day_focus}</div>
      </div>

      {/* Tabs: Workout / Meals & Supps / Timeline */}
      <div className="mb-4 flex gap-1 rounded-xl bg-accent-subtle p-1">
        {templateExercises.length > 0 && (
          <button
            onClick={() => setActiveTab("workout")}
            className={clsx(
              "flex-1 rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
              activeTab === "workout"
                ? "bg-accent text-white"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Workout ({templateExercises.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab("meals")}
          className={clsx(
            "flex-1 rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
            activeTab === "meals"
              ? "bg-accent text-white"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          Meals & Supps
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={clsx(
            "flex-1 rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
            activeTab === "timeline"
              ? "bg-accent text-white"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          Timeline
        </button>
      </div>

      {/* ── MEALS & SUPPS TAB ── */}
      {activeTab === "meals" && <MealsTab meals={mealTimeline} />}

      {/* ── TIMELINE TAB ── */}
      {activeTab === "timeline" && <TimelineTab meals={mealTimeline} />}

      {/* ── WORKOUT TAB ── */}
      {activeTab === "workout" && <>

      {/* Session controls */}
      {!session && (
        <Button
          onClick={handleStartSession}
          fullWidth
          disabled={isPending}
          className="mb-4 flex items-center justify-center gap-2"
        >
          <Play size={16} />
          Start Gym Session
        </Button>
      )}

      {session && !session.ended_at && (
        <div className="mb-4 flex items-center gap-2">
          <SessionTimer startedAt={session.started_at} />
          {!showMoodRating ? (
            <Button
              variant="danger"
              onClick={() => setShowMoodRating(true)}
              className="flex-shrink-0 text-xs"
            >
              End Session
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleEndSession(mood)}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-sm font-bold hover:bg-accent hover:text-white transition-colors cursor-pointer"
                >
                  {mood}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {session?.ended_at && (
        <div className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm font-bold text-success">
          Session Complete
        </div>
      )}

      {/* Progress */}
      {totalSets > 0 && (
        <div className="mb-4">
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] text-text-muted">
              {completedCount}/{totalSets} sets
            </span>
            {progressPct === 100 && (
              <span className="text-[11px] font-bold text-accent">Complete</span>
            )}
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Exercise list */}
      {templateExercises
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((te) => (
          <ExerciseCard
            key={te.id}
            templateExercise={te}
            completedSets={optimisticLogs.filter(
              (l) => l.template_exercise_id === te.id
            )}
            allLogs={optimisticLogs}
            templateExerciseSortOrders={Object.fromEntries(
              templateExercises.map((t) => [t.id, t.sort_order])
            )}
            session={session}
            onToggleSet={handleToggleSet}
            hasSession={!!session && !session.ended_at}
            preferredUnit={preferredUnit}
          />
        ))}

      </>}

      {/* Navigation */}
      <div className="mt-6 flex gap-2">
        {prevTemplate && (
          <Button
            variant="secondary"
            onClick={() =>
              router.push(
                `/gym/workout?week=${week}&day=${prevTemplate.day_of_week}&templateId=${prevTemplate.id}&programId=${programId}`
              )
            }
            className="flex-1 flex items-center justify-center gap-1 text-xs"
          >
            <ChevronLeft size={14} />
            Previous
          </Button>
        )}
        {nextTemplate && (
          <Button
            onClick={() =>
              router.push(
                `/gym/workout?week=${week}&day=${nextTemplate.day_of_week}&templateId=${nextTemplate.id}&programId=${programId}`
              )
            }
            className="flex-1 flex items-center justify-center gap-1 text-xs"
          >
            Next Day
            <ChevronRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
