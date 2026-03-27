import { createClient } from "@/lib/supabase/server";
import { HistoryClient } from "./history-client";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get all sessions with template info
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(
      `
      id,
      started_at,
      ended_at,
      duration_minutes,
      mood_rating,
      notes,
      workout_templates (
        day_title,
        day_focus,
        week_number,
        day_of_week
      )
    `
    )
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(50);

  // Get exercise logs for these sessions
  const sessionIds = (sessions || []).map((s) => s.id);
  let exerciseLogs: {
    session_id: string;
    set_number: number;
    reps_completed: number | null;
    weight_used: number | null;
    weight_unit: string;
    exercises: { name: string; muscle_group: string } | { name: string; muscle_group: string }[];
  }[] = [];

  if (sessionIds.length > 0) {
    const { data: logs } = await supabase
      .from("exercise_logs")
      .select(
        `
        session_id,
        set_number,
        reps_completed,
        weight_used,
        weight_unit,
        exercises (name, muscle_group)
      `
      )
      .in("session_id", sessionIds)
      .eq("is_completed", true)
      .order("set_number");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exerciseLogs = (logs || []) as any[];
  }

  // Group logs by session
  const logsBySession: Record<
    string,
    typeof exerciseLogs
  > = {};
  for (const log of exerciseLogs) {
    if (!logsBySession[log.session_id]) logsBySession[log.session_id] = [];
    logsBySession[log.session_id].push(log);
  }

  return (
    <HistoryClient
      sessions={(sessions || []).map((s) => ({
        ...s,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        template: Array.isArray(s.workout_templates) ? s.workout_templates[0] : s.workout_templates as any,
        logs: logsBySession[s.id] || [],
      }))}
    />
  );
}
