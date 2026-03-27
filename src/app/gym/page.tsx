import { createClient } from "@/lib/supabase/server";
import { seedDefaultProgram } from "@/lib/gym/actions";
import { DashboardClient } from "./dashboard-client";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default async function GymDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Parallel: profile + program + latest weight
  const [{ data: profile }, { data: programData }, { data: latestWeight }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("programs")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single(),
      supabase
        .from("weight_logs")
        .select("weight_kg")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

  let program = programData;
  if (!program) {
    const programId = await seedDefaultProgram();
    const { data: seeded } = await supabase
      .from("programs")
      .select("*")
      .eq("id", programId)
      .single();
    program = seeded;
  }

  if (!program) {
    return (
      <div className="text-center text-text-muted py-20">
        <p>Failed to load program. Please check your database setup.</p>
      </div>
    );
  }

  // Parallel: templates + sessions
  const [{ data: templates }, { data: sessions }] = await Promise.all([
    supabase
      .from("workout_templates")
      .select(
        `
      id,
      week_number,
      day_of_week,
      day_title,
      day_focus,
      is_rest_day,
      template_exercises (id)
    `
      )
      .eq("program_id", program.id)
      .order("week_number")
      .order("day_of_week"),
    supabase
      .from("workout_sessions")
      .select("id, template_id")
      .eq("program_id", program.id)
      .eq("user_id", user.id),
  ]);

  const sessionIds = (sessions || []).map((s) => s.id);
  let completedLogs: { template_exercise_id: string }[] = [];

  if (sessionIds.length > 0) {
    const { data: logs } = await supabase
      .from("exercise_logs")
      .select("template_exercise_id")
      .in("session_id", sessionIds)
      .eq("is_completed", true);
    completedLogs = logs || [];
  }

  // Build week data
  const completedSet = new Set(
    completedLogs.map((l) => l.template_exercise_id)
  );

  const weeks: Record<
    number,
    {
      days: {
        dayOfWeek: number;
        dayName: string;
        title: string;
        focus: string;
        isRestDay: boolean;
        exerciseCount: number;
        completedCount: number;
        templateId: string;
        hasNewExercises: boolean;
      }[];
      totalExercises: number;
      completedExercises: number;
    }
  > = {};

  for (const tmpl of templates || []) {
    const wk = tmpl.week_number;
    if (!weeks[wk]) {
      weeks[wk] = { days: [], totalExercises: 0, completedExercises: 0 };
    }

    const exerciseIds = (
      tmpl.template_exercises as { id: string }[]
    ).map((te) => te.id);
    const completed = exerciseIds.filter((id) => completedSet.has(id)).length;

    // Detect new exercises: W3+ has cables/dumbbells
    const hasNew = wk >= 3 && !tmpl.is_rest_day && exerciseIds.length > 0;

    weeks[wk].days.push({
      dayOfWeek: tmpl.day_of_week,
      dayName: DAY_NAMES[tmpl.day_of_week - 1] || `Day ${tmpl.day_of_week}`,
      title: tmpl.day_title,
      focus: tmpl.day_focus || "",
      isRestDay: tmpl.is_rest_day,
      exerciseCount: exerciseIds.length,
      completedCount: completed,
      templateId: tmpl.id,
      hasNewExercises: hasNew,
    });

    weeks[wk].totalExercises += exerciseIds.length;
    weeks[wk].completedExercises += completed;
  }

  return (
    <DashboardClient
      weeks={weeks}
      programId={program.id}
      currentWeight={
        latestWeight?.weight_kg || profile?.current_weight_kg || null
      }
      targetWeight={profile?.target_weight_kg || 80}
    />
  );
}
