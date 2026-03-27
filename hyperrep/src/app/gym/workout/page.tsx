import { createClient } from "@/lib/supabase/server";
import { WorkoutClient } from "./workout-client";

interface PageProps {
  searchParams: Promise<{
    week?: string;
    day?: string;
    templateId?: string;
    programId?: string;
  }>;
}

export default async function WorkoutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const templateId = params.templateId;
  const programId = params.programId;
  const week = parseInt(params.week || "1");
  const day = parseInt(params.day || "1");

  if (!templateId || !programId) {
    return (
      <div className="py-20 text-center text-text-muted">
        <p>Select a workout from the dashboard.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get template details
  const { data: template } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!template) {
    return (
      <div className="py-20 text-center text-text-muted">
        <p>Workout not found.</p>
      </div>
    );
  }

  // Get template exercises with exercise details
  const { data: rawTemplateExercises } = await supabase
    .from("template_exercises")
    .select(
      `
      id,
      sets,
      reps,
      target_weight,
      rest_seconds,
      notes,
      sort_order,
      exercises (
        id,
        name,
        muscle_group,
        equipment
      )
    `
    )
    .eq("template_id", templateId)
    .order("sort_order");

  // Supabase returns joined table as object (single FK), but TS sees array.
  // Normalize to the shape WorkoutClient expects.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templateExercises = (rawTemplateExercises || []).map((te: any) => ({
    ...te,
    exercises: Array.isArray(te.exercises) ? te.exercises[0] : te.exercises,
  })) as any[];

  // Get existing session for today + this template
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: existingSession } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("template_id", templateId)
    .eq("user_id", user.id)
    .gte("started_at", todayStart.toISOString())
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  // Get completed logs for this session
  let completedLogs: {
    id: string;
    template_exercise_id: string;
    set_number: number;
    reps_completed: number | null;
    weight_used: number | null;
    weight_unit: string;
  }[] = [];

  if (existingSession) {
    const { data: logs } = await supabase
      .from("exercise_logs")
      .select("id, template_exercise_id, set_number, reps_completed, weight_used, weight_unit")
      .eq("session_id", existingSession.id)
      .eq("is_completed", true);
    completedLogs = logs || [];
  }

  // Get profile for preferred weight unit
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_weight_unit, gym_start_time")
    .eq("id", user.id)
    .single();

  // Get adjacent templates for prev/next navigation
  const { data: adjacentTemplates } = await supabase
    .from("workout_templates")
    .select("id, day_of_week, week_number, day_title")
    .eq("program_id", programId)
    .eq("week_number", week)
    .order("day_of_week");

  const currentIndex = (adjacentTemplates || []).findIndex(
    (t) => t.id === templateId
  );
  const prevTemplate =
    currentIndex > 0 ? adjacentTemplates![currentIndex - 1] : null;
  const nextTemplate =
    adjacentTemplates && currentIndex < adjacentTemplates.length - 1
      ? adjacentTemplates[currentIndex + 1]
      : null;

  return (
    <WorkoutClient
      template={template}
      templateExercises={templateExercises || []}
      session={existingSession}
      completedLogs={completedLogs}
      programId={programId}
      week={week}
      day={day}
      preferredUnit={profile?.preferred_weight_unit || "lbs"}
      gymStartTime={profile?.gym_start_time || "17:30"}
      prevTemplate={prevTemplate}
      nextTemplate={nextTemplate}
    />
  );
}
