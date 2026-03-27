import { SupabaseClient } from "@supabase/supabase-js";

export async function buildAIContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, current_weight_kg, target_weight_kg")
    .eq("id", userId)
    .single();

  // Active program
  const { data: program } = await supabase
    .from("programs")
    .select("name, weeks")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .single();

  // Recent sessions (last 2 weeks)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at, duration_minutes, mood_rating")
    .eq("user_id", userId)
    .gte("started_at", twoWeeksAgo)
    .order("started_at", { ascending: false });

  // Completion rate
  const sessionIds = (sessions || []).map((s) => s.id);
  let totalLogs = 0;
  if (sessionIds.length > 0) {
    const { count } = await supabase
      .from("exercise_logs")
      .select("id", { count: "exact", head: true })
      .in("session_id", sessionIds)
      .eq("is_completed", true);
    totalLogs = count || 0;
  }

  // Weight trend
  const { data: weightLogs } = await supabase
    .from("weight_logs")
    .select("weight_kg, logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(5);

  const weightTrend =
    weightLogs && weightLogs.length >= 2
      ? (weightLogs[0].weight_kg - weightLogs[weightLogs.length - 1].weight_kg).toFixed(1)
      : "unknown";

  // Recent PRs (max weight per exercise)
  let prs = "";
  if (sessionIds.length > 0) {
    const { data: prData } = await supabase
      .from("exercise_logs")
      .select("weight_used, weight_unit, exercises(name)")
      .in("session_id", sessionIds)
      .eq("is_completed", true)
      .not("weight_used", "is", null)
      .order("weight_used", { ascending: false })
      .limit(5);

    if (prData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prs = prData.map((p: any) => {
        const name = Array.isArray(p.exercises) ? p.exercises[0]?.name : p.exercises?.name;
        return `${name}: ${p.weight_used} ${p.weight_unit}`;
      }).join(", ");
    }
  }

  const completionPct = sessions?.length
    ? Math.round(totalLogs / (sessions.length * 5) * 100)
    : 0;

  return `You are a fitness coach for a vegetarian male named ${profile?.name || "User"}, currently ${profile?.current_weight_kg || "unknown"} kg, targeting ${profile?.target_weight_kg || 80} kg. Their supplement stack: creatine, whey, mass gainer.

Current program: "${program?.name || "Not set"}".
Sessions in last 2 weeks: ${sessions?.length || 0}.
Approximate completion rate: ${completionPct}%.
Weight trend: ${weightTrend} kg over recent weigh-ins.
Latest weight: ${weightLogs?.[0]?.weight_kg || "not logged"} kg.
Recent top lifts: ${prs || "none recorded yet"}.
Average mood: ${sessions?.length ? (sessions.reduce((a, s) => a + (s.mood_rating || 3), 0) / sessions.length).toFixed(1) : "N/A"}/5.

Respond as a knowledgeable but direct coach. Give actionable advice. Keep responses concise. Use metric and imperial units as appropriate.`;
}
