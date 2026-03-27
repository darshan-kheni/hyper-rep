import { SupabaseClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════
// TOOL DEFINITIONS (Ollama format)
// ══════════════════════════════════════════════

export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "query_progress",
      description:
        "Query the user's workout progress data including session counts, completion rates, weight trends, and personal records. Use this when the user asks about their progress, performance, or stats.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["week", "month", "all"],
            description: "Time period to query",
          },
          metric: {
            type: "string",
            enum: [
              "completion_rate",
              "weight_trend",
              "exercise_prs",
              "session_count",
              "overview",
            ],
            description: "Which metric to retrieve. Use overview for a general summary.",
          },
        },
        required: ["period", "metric"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_plan",
      description:
        "Generate a new workout program and save it to the database. Use when user asks for a new program, plan, or routine. This replaces their current active program.",
      parameters: {
        type: "object",
        properties: {
          weeks: {
            type: "number",
            description: "Number of weeks (1-12)",
          },
          days_per_week: {
            type: "number",
            description: "Training days per week (3-6)",
          },
          focus: {
            type: "string",
            enum: ["strength", "hypertrophy", "endurance"],
            description: "Training focus",
          },
          difficulty: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
            description: "Difficulty level",
          },
        },
        required: ["weeks", "days_per_week", "focus"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "substitute_exercise",
      description:
        "Find alternative exercises that target the same muscle group. Use when user says equipment is unavailable, they have an injury, or want variety.",
      parameters: {
        type: "object",
        properties: {
          exercise_name: {
            type: "string",
            description: "The exercise to find alternatives for",
          },
          reason: {
            type: "string",
            enum: ["equipment_unavailable", "injury", "variety"],
            description: "Why a substitute is needed",
          },
        },
        required: ["exercise_name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "adjust_weights",
      description:
        "Update the target weight and optionally reps for an exercise in the user's active program across all weeks.",
      parameters: {
        type: "object",
        properties: {
          exercise_name: {
            type: "string",
            description: "Name of the exercise to adjust",
          },
          new_weight: {
            type: "string",
            description: "New target weight (e.g. '40 lbs', '20 kg')",
          },
          new_reps: {
            type: "string",
            description: "New rep target (optional)",
          },
        },
        required: ["exercise_name", "new_weight"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "log_body_weight",
      description:
        "Log a body weight measurement. Use when user tells you their weight or says they weighed in.",
      parameters: {
        type: "object",
        properties: {
          weight_kg: {
            type: "number",
            description: "Body weight in kilograms",
          },
          notes: {
            type: "string",
            description: "Optional notes about the weigh-in",
          },
        },
        required: ["weight_kg"],
      },
    },
  },
];

// ══════════════════════════════════════════════
// TOOL STATUS MESSAGES
// ══════════════════════════════════════════════

export const TOOL_STATUS: Record<string, string> = {
  query_progress: "Checking your progress...",
  generate_plan: "Creating your new program...",
  substitute_exercise: "Finding alternatives...",
  adjust_weights: "Updating your weights...",
  log_body_weight: "Logging your weight...",
};

// ══════════════════════════════════════════════
// TOOL DISPATCHER
// ══════════════════════════════════════════════

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  switch (name) {
    case "query_progress":
      return executeQueryProgress(supabase, userId, args as { period: string; metric: string });
    case "generate_plan":
      return executeGeneratePlan(supabase, userId, args as { weeks: number; days_per_week: number; focus: string; difficulty?: string });
    case "substitute_exercise":
      return executeSubstituteExercise(supabase, args as { exercise_name: string; reason?: string });
    case "adjust_weights":
      return executeAdjustWeights(supabase, userId, args as { exercise_name: string; new_weight: string; new_reps?: string });
    case "log_body_weight":
      return executeLogBodyWeight(supabase, userId, args as { weight_kg: number; notes?: string });
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ══════════════════════════════════════════════
// TOOL IMPLEMENTATIONS
// ══════════════════════════════════════════════

async function executeQueryProgress(
  supabase: SupabaseClient,
  userId: string,
  args: { period: string; metric: string }
): Promise<string> {
  const now = new Date();
  const startDate =
    args.period === "week"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : args.period === "month"
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : new Date(0);

  if (args.metric === "session_count" || args.metric === "overview") {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("id, started_at, ended_at, duration_minutes, mood_rating")
      .eq("user_id", userId)
      .gte("started_at", startDate.toISOString())
      .order("started_at", { ascending: false });

    if (args.metric === "session_count") {
      return JSON.stringify({
        period: args.period,
        total_sessions: sessions?.length || 0,
        sessions: (sessions || []).map((s) => ({
          date: s.started_at,
          duration_minutes: s.duration_minutes,
          mood: s.mood_rating,
        })),
      });
    }

    // Overview: get everything
    const sessionIds = (sessions || []).map((s) => s.id);
    let completedSets = 0;
    if (sessionIds.length > 0) {
      const { count } = await supabase
        .from("exercise_logs")
        .select("id", { count: "exact", head: true })
        .in("session_id", sessionIds)
        .eq("is_completed", true);
      completedSets = count || 0;
    }

    const { data: weightLogs } = await supabase
      .from("weight_logs")
      .select("weight_kg, logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(5);

    return JSON.stringify({
      period: args.period,
      total_sessions: sessions?.length || 0,
      total_completed_sets: completedSets,
      avg_duration: sessions?.length
        ? Math.round(sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / sessions.length)
        : 0,
      avg_mood: sessions?.length
        ? (sessions.reduce((a, s) => a + (s.mood_rating || 3), 0) / sessions.length).toFixed(1)
        : "N/A",
      recent_weights: weightLogs || [],
    });
  }

  if (args.metric === "weight_trend") {
    const { data: weightLogs } = await supabase
      .from("weight_logs")
      .select("weight_kg, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", startDate.toISOString().split("T")[0])
      .order("logged_at", { ascending: true });

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_weight_kg, target_weight_kg")
      .eq("id", userId)
      .single();

    return JSON.stringify({
      period: args.period,
      weight_logs: weightLogs || [],
      current_weight: profile?.current_weight_kg,
      target_weight: profile?.target_weight_kg,
      entries: weightLogs?.length || 0,
      change:
        weightLogs && weightLogs.length >= 2
          ? (weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg).toFixed(1)
          : "insufficient data",
    });
  }

  if (args.metric === "exercise_prs") {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("id")
      .eq("user_id", userId)
      .gte("started_at", startDate.toISOString());

    const sessionIds = (sessions || []).map((s) => s.id);
    if (sessionIds.length === 0) {
      return JSON.stringify({ period: args.period, prs: [], message: "No sessions in this period" });
    }

    const { data: logs } = await supabase
      .from("exercise_logs")
      .select("weight_used, weight_unit, reps_completed, exercises(name, muscle_group)")
      .in("session_id", sessionIds)
      .eq("is_completed", true)
      .not("weight_used", "is", null)
      .order("weight_used", { ascending: false })
      .limit(20);

    // Group by exercise, take max weight
    const prMap: Record<string, { weight: number; unit: string; reps: number | null }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const log of (logs || []) as any[]) {
      const name = Array.isArray(log.exercises) ? log.exercises[0]?.name : log.exercises?.name;
      if (!name) continue;
      if (!prMap[name] || log.weight_used > prMap[name].weight) {
        prMap[name] = { weight: log.weight_used, unit: log.weight_unit, reps: log.reps_completed };
      }
    }

    return JSON.stringify({
      period: args.period,
      prs: Object.entries(prMap).map(([name, data]) => ({
        exercise: name,
        max_weight: `${data.weight} ${data.unit}`,
        reps: data.reps,
      })),
    });
  }

  if (args.metric === "completion_rate") {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("id, template_id")
      .eq("user_id", userId)
      .gte("started_at", startDate.toISOString());

    if (!sessions || sessions.length === 0) {
      return JSON.stringify({ period: args.period, completion_rate: 0, message: "No sessions" });
    }

    const sessionIds = sessions.map((s) => s.id);
    const { count: completed } = await supabase
      .from("exercise_logs")
      .select("id", { count: "exact", head: true })
      .in("session_id", sessionIds)
      .eq("is_completed", true);

    return JSON.stringify({
      period: args.period,
      sessions: sessions.length,
      completed_sets: completed || 0,
      avg_sets_per_session: sessions.length ? Math.round((completed || 0) / sessions.length) : 0,
    });
  }

  return JSON.stringify({ error: "Unknown metric" });
}

async function executeGeneratePlan(
  supabase: SupabaseClient,
  userId: string,
  args: { weeks: number; days_per_week: number; focus: string; difficulty?: string }
): Promise<string> {
  const { weeks, days_per_week, focus, difficulty = "beginner" } = args;

  // Deactivate current program
  await supabase
    .from("programs")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  // Get exercises filtered by difficulty
  const diffLevels = difficulty === "advanced" ? ["beginner", "intermediate", "advanced"]
    : difficulty === "intermediate" ? ["beginner", "intermediate"]
    : ["beginner"];

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment, movement_type, push_pull")
    .in("difficulty", diffLevels);

  if (!exercises || exercises.length === 0) {
    return JSON.stringify({ error: "No exercises found in database" });
  }

  // Group by muscle group
  const byGroup: Record<string, typeof exercises> = {};
  for (const ex of exercises) {
    if (!byGroup[ex.muscle_group]) byGroup[ex.muscle_group] = [];
    byGroup[ex.muscle_group].push(ex);
  }

  // Set/rep/rest defaults by focus
  const config = {
    strength: { sets: 4, reps: "6-8", rest: 90 },
    hypertrophy: { sets: 3, reps: "10-12", rest: 60 },
    endurance: { sets: 3, reps: "15-20", rest: 45 },
  }[focus] || { sets: 3, reps: "10-12", rest: 60 };

  // Day splits by days_per_week
  const splits: Record<number, { title: string; focus: string; groups: string[] }[]> = {
    3: [
      { title: "Push Day", focus: "Chest · Shoulders · Triceps", groups: ["chest", "shoulders", "arms"] },
      { title: "Pull Day", focus: "Back · Biceps", groups: ["back", "arms"] },
      { title: "Leg Day", focus: "Legs · Core", groups: ["legs", "core"] },
    ],
    4: [
      { title: "Upper Push", focus: "Chest · Shoulders · Triceps", groups: ["chest", "shoulders", "arms"] },
      { title: "Lower Body", focus: "Legs · Core", groups: ["legs", "core"] },
      { title: "Upper Pull", focus: "Back · Biceps", groups: ["back", "arms"] },
      { title: "Lower + Core", focus: "Legs · Glutes · Core", groups: ["legs", "core"] },
    ],
    5: [
      { title: "Push Day", focus: "Chest · Shoulders · Triceps", groups: ["chest", "shoulders", "arms"] },
      { title: "Pull Day", focus: "Back · Biceps", groups: ["back", "arms"] },
      { title: "Upper Body", focus: "Chest · Back · Shoulders", groups: ["chest", "back", "shoulders"] },
      { title: "Arms & Shoulders", focus: "Delts · Biceps · Triceps", groups: ["shoulders", "arms"] },
      { title: "Leg Day", focus: "Quads · Hamstrings · Core", groups: ["legs", "core"] },
    ],
    6: [
      { title: "Push", focus: "Chest · Shoulders · Triceps", groups: ["chest", "shoulders", "arms"] },
      { title: "Pull", focus: "Back · Biceps", groups: ["back", "arms"] },
      { title: "Legs", focus: "Quads · Hamstrings", groups: ["legs", "core"] },
      { title: "Push B", focus: "Shoulders · Chest · Triceps", groups: ["shoulders", "chest", "arms"] },
      { title: "Pull B", focus: "Back · Rear Delts · Biceps", groups: ["back", "shoulders", "arms"] },
      { title: "Legs B", focus: "Legs · Glutes · Core", groups: ["legs", "core"] },
    ],
  };

  const daySplit = splits[days_per_week] || splits[5];

  // Get user's rest day
  const { data: profile } = await supabase
    .from("profiles")
    .select("rest_day")
    .eq("id", userId)
    .single();
  const restDay = profile?.rest_day || 6;

  // Create program
  const programName = `${focus.charAt(0).toUpperCase() + focus.slice(1)} Program — ${weeks} Weeks`;
  const { data: program, error: progErr } = await supabase
    .from("programs")
    .insert({
      user_id: userId,
      name: programName,
      description: `AI-generated ${focus} program. ${days_per_week} days/week, ${weeks} weeks. Difficulty: ${difficulty}.`,
      weeks,
      days_per_week,
    })
    .select("id")
    .single();

  if (progErr || !program) {
    return JSON.stringify({ error: "Failed to create program" });
  }

  let totalExercises = 0;

  // Create templates for each week
  for (let w = 1; w <= weeks; w++) {
    let dayNum = 0;
    for (let d = 1; d <= 7; d++) {
      const isRest = d === restDay || dayNum >= days_per_week;
      const split = !isRest && dayNum < daySplit.length ? daySplit[dayNum] : null;

      const { data: template } = await supabase
        .from("workout_templates")
        .insert({
          program_id: program.id,
          user_id: userId,
          week_number: w,
          day_of_week: d,
          day_title: split ? split.title : "Rest Day",
          day_focus: split ? split.focus : "Recovery",
          is_rest_day: !split,
          sort_order: d,
        })
        .select("id")
        .single();

      if (template && split) {
        // Pick exercises for this day
        const dayExercises: { id: string; name: string }[] = [];
        for (const group of split.groups) {
          const available = byGroup[group] || [];
          // Pick up to 2 exercises per group, rotating by week
          const offset = (w - 1) * 2;
          for (let i = 0; i < Math.min(2, available.length); i++) {
            const idx = (offset + i) % available.length;
            if (!dayExercises.find((e) => e.id === available[idx].id)) {
              dayExercises.push(available[idx]);
            }
          }
        }

        // Add core exercise (plank) if not already included
        const plank = exercises.find((e) => e.name === "Plank");
        if (plank && !dayExercises.find((e) => e.id === plank.id)) {
          dayExercises.push(plank);
        }

        const templateExercises = dayExercises.map((ex, idx) => ({
          template_id: template.id,
          exercise_id: ex.id,
          user_id: userId,
          sets: config.sets,
          reps: config.reps,
          target_weight: "TBD",
          rest_seconds: config.rest,
          notes: `Week ${w} — adjust weight as needed`,
          sort_order: idx + 1,
        }));

        if (templateExercises.length > 0) {
          await supabase.from("template_exercises").insert(templateExercises);
          totalExercises += templateExercises.length;
        }

        dayNum++;
      }
    }
  }

  return JSON.stringify({
    success: true,
    program_name: programName,
    weeks,
    days_per_week,
    focus,
    difficulty,
    total_exercises: totalExercises,
    message: `Created "${programName}" with ${totalExercises} exercises across ${weeks * days_per_week} workouts. Go to the dashboard to see your new program.`,
  });
}

async function executeSubstituteExercise(
  supabase: SupabaseClient,
  args: { exercise_name: string; reason?: string }
): Promise<string> {
  // Find the original exercise
  const { data: original } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment, movement_type")
    .ilike("name", `%${args.exercise_name}%`)
    .limit(1)
    .single();

  if (!original) {
    return JSON.stringify({
      error: `Exercise "${args.exercise_name}" not found. Check the name and try again.`,
    });
  }

  // Find alternatives: same muscle group, different exercise
  const { data: alternatives } = await supabase
    .from("exercises")
    .select("name, muscle_group, equipment, movement_type, instructions, tips")
    .eq("muscle_group", original.muscle_group)
    .neq("id", original.id)
    .limit(5);

  return JSON.stringify({
    original: {
      name: original.name,
      muscle_group: original.muscle_group,
      equipment: original.equipment,
    },
    reason: args.reason || "variety",
    alternatives: (alternatives || []).map((a) => ({
      name: a.name,
      equipment: a.equipment,
      movement_type: a.movement_type,
      instructions: a.instructions,
      tips: a.tips,
    })),
  });
}

async function executeAdjustWeights(
  supabase: SupabaseClient,
  userId: string,
  args: { exercise_name: string; new_weight: string; new_reps?: string }
): Promise<string> {
  // Find exercise
  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, name")
    .ilike("name", `%${args.exercise_name}%`)
    .limit(1)
    .single();

  if (!exercise) {
    return JSON.stringify({ error: `Exercise "${args.exercise_name}" not found.` });
  }

  // Get active program
  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!program) {
    return JSON.stringify({ error: "No active program found." });
  }

  // Get templates for this program
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("program_id", program.id);

  if (!templates || templates.length === 0) {
    return JSON.stringify({ error: "No workout templates found." });
  }

  const templateIds = templates.map((t) => t.id);

  // Update template exercises
  const updateData: Record<string, string> = { target_weight: args.new_weight };
  if (args.new_reps) {
    updateData.reps = args.new_reps;
  }

  const { data: updated } = await supabase
    .from("template_exercises")
    .update(updateData)
    .eq("exercise_id", exercise.id)
    .in("template_id", templateIds)
    .eq("user_id", userId)
    .select("id");

  const count = updated?.length || 0;

  return JSON.stringify({
    success: true,
    exercise: exercise.name,
    new_weight: args.new_weight,
    new_reps: args.new_reps || "unchanged",
    updated_entries: count,
    message: `Updated ${exercise.name} to ${args.new_weight}${args.new_reps ? `, ${args.new_reps} reps` : ""} across ${count} template entries.`,
  });
}

async function executeLogBodyWeight(
  supabase: SupabaseClient,
  userId: string,
  args: { weight_kg: number; notes?: string }
): Promise<string> {
  const today = new Date().toISOString().split("T")[0];

  // Upsert weight log
  const { error: logErr } = await supabase.from("weight_logs").upsert(
    {
      user_id: userId,
      weight_kg: args.weight_kg,
      logged_at: today,
      notes: args.notes || null,
    },
    { onConflict: "user_id,logged_at" }
  );

  if (logErr) {
    return JSON.stringify({ error: "Failed to log weight." });
  }

  // Update profile
  await supabase
    .from("profiles")
    .update({ current_weight_kg: args.weight_kg })
    .eq("id", userId);

  // Get target for context
  const { data: profile } = await supabase
    .from("profiles")
    .select("target_weight_kg")
    .eq("id", userId)
    .single();

  const target = profile?.target_weight_kg || 80;
  const remaining = (target - args.weight_kg).toFixed(1);

  return JSON.stringify({
    success: true,
    logged_weight: args.weight_kg,
    target_weight: target,
    remaining_kg: remaining,
    message: `Logged ${args.weight_kg} kg. Target: ${target} kg (${remaining} kg to go).`,
  });
}
