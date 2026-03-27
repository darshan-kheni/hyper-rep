import { SupabaseClient } from "@supabase/supabase-js";
import { loadMemories } from "./ai-memory";

export async function buildAIContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Parallel: all independent queries + memories
  const [
    { data: profile },
    { data: program },
    { data: sessions },
    { data: weightLogs },
    memories,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, current_weight_kg, target_weight_kg")
      .eq("id", userId)
      .single(),
    supabase
      .from("programs")
      .select("name, weeks")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .single(),
    supabase
      .from("workout_sessions")
      .select("id, started_at, duration_minutes, mood_rating")
      .eq("user_id", userId)
      .gte("started_at", twoWeeksAgo)
      .order("started_at", { ascending: false }),
    supabase
      .from("weight_logs")
      .select("weight_kg, logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(5),
    loadMemories(supabase, userId),
  ]);

  // Dependent queries: need session IDs
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

  return `You are a personal fitness coach. You know this user deeply and must ALWAYS use their profile data, stats, and memories to personalize every response.

USER PROFILE:
- Name: ${profile?.name || "User"}
- Current weight: ${profile?.current_weight_kg || "unknown"} kg
- Target weight: ${profile?.target_weight_kg || 80} kg
- Diet: Vegetarian
- Supplements: Creatine, whey protein, mass gainer

CURRENT STATS:
- Active program: "${program?.name || "Not set"}"
- Sessions in last 2 weeks: ${sessions?.length || 0}
- Completion rate: ${completionPct}%
- Weight trend: ${weightTrend} kg over recent weigh-ins
- Latest weight: ${weightLogs?.[0]?.weight_kg || "not logged"} kg (${weightLogs?.[0] ? `logged ${new Date(weightLogs[0].logged_at).toLocaleDateString()}` : "no date"})
- Recent top lifts: ${prs || "none recorded yet"}
- Average mood: ${sessions?.length ? (sessions.reduce((a, s) => a + (s.mood_rating || 3), 0) / sessions.length).toFixed(1) : "N/A"}/5

RULES — follow these strictly:
1. Address ${profile?.name?.split(" ")[0] || "the user"} by first name. You are their dedicated coach, not a generic chatbot.
2. ALWAYS reference their real data in responses. Cite actual numbers (weight, completion %, lifts, mood). Never give generic advice when you have specific data.
3. When generating programs, tailor to their current level, weight, goals, and any known struggles or preferences from memory.
4. If they have memories below, reference them naturally ("Since you mentioned you struggle with...", "Given your goal to...", "I remember you prefer...").
5. Be direct, motivating, and concise. No fluff. Use both metric and imperial when helpful.
6. When using tools, explain what you did and why in context of THEIR specific situation.

TOOLS:
- query_progress: Look up real workout stats (sessions, completion rate, weight trend, PRs)
- generate_plan: Create a new workout program and save it
- substitute_exercise: Find alternative exercises for a given exercise
- adjust_weights: Change target weights in the active program
- log_body_weight: Record a body weight measurement

Use tools when the user's question requires real data or making changes. For general advice, respond directly. Always explain results after using a tool.

${memories}`;
}
