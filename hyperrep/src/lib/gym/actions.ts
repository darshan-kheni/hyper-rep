"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PROGRAM, shiftRestDay } from "./program-data";

// ── Auth helper ──
async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ── Seed default program for new users ──
export async function seedDefaultProgram() {
  const { supabase, user } = await getUser();

  // Check if user already has an active program
  const { data: existing } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (existing) return existing.id;

  // Get user's preferred rest day
  const { data: profile } = await supabase
    .from("profiles")
    .select("rest_day")
    .eq("id", user.id)
    .single();

  const restDay = profile?.rest_day || 6;
  const programData = shiftRestDay(DEFAULT_PROGRAM, restDay);

  // Create program
  const { data: program, error: progErr } = await supabase
    .from("programs")
    .insert({
      user_id: user.id,
      name: DEFAULT_PROGRAM.name,
      description: DEFAULT_PROGRAM.description,
      weeks: DEFAULT_PROGRAM.weeks,
      days_per_week: DEFAULT_PROGRAM.daysPerWeek,
    })
    .select("id")
    .single();

  if (progErr || !program) throw new Error("Failed to create program");

  // Get exercise name→id map
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name");

  const exerciseMap = new Map(
    (exercises || []).map((ex) => [ex.name, ex.id])
  );

  // Create templates and template_exercises for each week/day
  for (const week of programData.schedule) {
    for (const day of week.days) {
      const { data: template, error: tmplErr } = await supabase
        .from("workout_templates")
        .insert({
          program_id: program.id,
          user_id: user.id,
          week_number: week.week,
          day_of_week: day.dayOfWeek,
          day_title: day.title,
          day_focus: day.focus,
          is_rest_day: day.isRestDay,
          sort_order: day.dayOfWeek,
        })
        .select("id")
        .single();

      if (tmplErr || !template) continue;

      if (day.exercises.length > 0) {
        const templateExercises = day.exercises
          .map((ex) => {
            const exerciseId = exerciseMap.get(ex.exerciseName);
            if (!exerciseId) return null;
            return {
              template_id: template.id,
              exercise_id: exerciseId,
              user_id: user.id,
              sets: ex.sets,
              reps: ex.reps,
              target_weight: ex.targetWeight,
              rest_seconds: ex.restSeconds,
              notes: ex.notes,
              sort_order: ex.sortOrder,
            };
          })
          .filter(Boolean);

        if (templateExercises.length > 0) {
          await supabase.from("template_exercises").insert(templateExercises);
        }
      }
    }
  }

  revalidatePath("/gym");
  return program.id;
}

// ── Start a workout session ──
export async function startSession(
  templateId: string,
  programId: string,
  startedAt: string
) {
  const { supabase, user } = await getUser();

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      template_id: templateId,
      program_id: programId,
      started_at: startedAt,
    })
    .select("id")
    .single();

  if (error) throw new Error("Failed to start session");

  revalidatePath("/gym/workout");
  return data.id;
}

// ── End a workout session ──
export async function endSession(
  sessionId: string,
  moodRating?: number,
  notes?: string
) {
  const { supabase, user } = await getUser();

  const now = new Date().toISOString();

  // Get session start time to calculate duration
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  const durationMinutes = session
    ? Math.round(
        (new Date(now).getTime() - new Date(session.started_at).getTime()) /
          60000
      )
    : null;

  const lockAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

  await supabase
    .from("workout_sessions")
    .update({
      ended_at: now,
      duration_minutes: durationMinutes,
      mood_rating: moodRating || null,
      notes: notes || null,
      locked_at: lockAt,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  // Set locked_at on all exercise logs that don't already have one
  await supabase
    .from("exercise_logs")
    .update({ locked_at: lockAt })
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .is("locked_at", null);

  revalidatePath("/gym/workout");
  revalidatePath("/gym");
}

// ── Toggle set completion ──
export async function toggleSetCompletion(
  sessionId: string,
  exerciseId: string,
  templateExerciseId: string,
  setNumber: number,
  isCompleted: boolean,
  weight: number | null,
  reps: number | null,
  weightUnit: string
) {
  const { supabase, user } = await getUser();

  // Server-side lock enforcement: check if session is locked
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("ended_at, locked_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (session?.locked_at && Date.now() >= new Date(session.locked_at).getTime()) {
    throw new Error("Session is locked. No further edits allowed.");
  }

  // Check if this specific exercise log is locked
  if (!isCompleted) {
    const { data: existingLog } = await supabase
      .from("exercise_logs")
      .select("locked_at")
      .eq("session_id", sessionId)
      .eq("template_exercise_id", templateExerciseId)
      .eq("set_number", setNumber)
      .eq("user_id", user.id)
      .single();

    if (existingLog?.locked_at && Date.now() >= new Date(existingLog.locked_at).getTime()) {
      throw new Error("This exercise is locked. Cannot uncheck.");
    }
  }

  const lockAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

  if (isCompleted) {
    // Insert log with 20-min lock window
    await supabase.from("exercise_logs").insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      template_exercise_id: templateExerciseId,
      user_id: user.id,
      set_number: setNumber,
      reps_completed: reps,
      weight_used: weight,
      weight_unit: weightUnit,
      is_completed: true,
      completed_at: new Date().toISOString(),
      locked_at: lockAt,
    });

    // Lock any previously completed exercises with lower sort_order immediately
    // Get sort_order of current template exercise
    const { data: currentTE } = await supabase
      .from("template_exercises")
      .select("sort_order")
      .eq("id", templateExerciseId)
      .single();

    if (currentTE) {
      // Find all template_exercises in same template with lower sort_order
      const { data: earlierTEs } = await supabase
        .from("template_exercises")
        .select("id")
        .eq("template_id", (
          await supabase
            .from("template_exercises")
            .select("template_id")
            .eq("id", templateExerciseId)
            .single()
        ).data?.template_id || "")
        .lt("sort_order", currentTE.sort_order);

      if (earlierTEs && earlierTEs.length > 0) {
        const earlierIds = earlierTEs.map((te) => te.id);
        // Lock earlier exercises immediately (set locked_at to now)
        await supabase
          .from("exercise_logs")
          .update({ locked_at: new Date().toISOString() })
          .eq("session_id", sessionId)
          .eq("user_id", user.id)
          .in("template_exercise_id", earlierIds)
          .is("locked_at", null);
      }
    }
  } else {
    // Delete log (uncheck)
    await supabase
      .from("exercise_logs")
      .delete()
      .eq("session_id", sessionId)
      .eq("template_exercise_id", templateExerciseId)
      .eq("set_number", setNumber)
      .eq("user_id", user.id);
  }

  revalidatePath("/gym/workout");
  revalidatePath("/gym");
}

// ── Log body weight ──
export async function logWeight(weightKg: number, notes?: string) {
  const { supabase, user } = await getUser();

  const today = new Date().toISOString().split("T")[0];

  // Upsert — one weigh-in per day
  await supabase.from("weight_logs").upsert(
    {
      user_id: user.id,
      weight_kg: weightKg,
      logged_at: today,
      notes: notes || null,
    },
    { onConflict: "user_id,logged_at" }
  );

  // Also update profile current weight
  await supabase
    .from("profiles")
    .update({ current_weight_kg: weightKg })
    .eq("id", user.id);

  revalidatePath("/gym/settings");
  revalidatePath("/gym");
}

// ── Update profile ──
export async function updateProfile(formData: FormData) {
  const { supabase, user } = await getUser();

  await supabase
    .from("profiles")
    .update({
      name: formData.get("name") as string,
      target_weight_kg: parseFloat(formData.get("targetWeight") as string) || 80,
      gym_start_time: (formData.get("gymStartTime") as string) || "17:30",
      preferred_weight_unit:
        (formData.get("preferredUnit") as string) || "lbs",
      rest_day: parseInt(formData.get("restDay") as string) || 6,
      timezone: (formData.get("timezone") as string) || "Asia/Kolkata",
    })
    .eq("id", user.id);

  revalidatePath("/gym/settings");
  revalidatePath("/gym");
}

// ── Regenerate program (after changing rest day) ──
export async function regenerateProgram() {
  const { supabase, user } = await getUser();

  // Deactivate current program (cascade deletes templates + template_exercises)
  await supabase
    .from("programs")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Delete inactive programs to clean up
  await supabase
    .from("programs")
    .delete()
    .eq("user_id", user.id)
    .eq("is_active", false);

  // Re-seed with new rest day
  const programId = await seedDefaultProgram();

  revalidatePath("/gym");
  revalidatePath("/gym/settings");
  return programId;
}
