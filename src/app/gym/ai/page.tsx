import { createClient } from "@/lib/supabase/server";
import { AIChatClient } from "./ai-chat-client";

function buildSuggestions(profile: {
  name?: string;
  current_weight_kg?: number;
  target_weight_kg?: number;
}, programName?: string): { regular: string[]; research: string[] } {
  const firstName = profile?.name?.split(" ")[0] || "User";
  const currentWeight = profile?.current_weight_kg;
  const targetWeight = profile?.target_weight_kg;

  const regular: string[] = [];
  const research: string[] = [];

  // Regular suggestions based on profile
  regular.push("How am I doing this week?");

  if (programName) {
    regular.push(`How's my progress on ${programName}?`);
  } else {
    regular.push("Create a 4-week hypertrophy program");
  }

  if (currentWeight && targetWeight) {
    const gaining = targetWeight > currentWeight;
    regular.push(
      gaining
        ? `I'm at ${currentWeight} kg — tips to reach ${targetWeight} kg?`
        : `How do I cut from ${currentWeight} kg to ${targetWeight} kg?`
    );
  } else {
    regular.push("What can I do instead of leg press?");
  }

  regular.push(
    currentWeight
      ? `I weighed ${currentWeight} kg today`
      : "Log my weight for today"
  );

  // Deep research suggestions based on profile
  if (currentWeight && targetWeight) {
    const gaining = targetWeight > currentWeight;
    research.push(
      gaining
        ? "Best diet plan for lean muscle gain"
        : "Effective cutting strategies while preserving muscle"
    );
  } else {
    research.push("Best creatine loading protocol for muscle gain");
  }

  if (programName) {
    research.push(`Latest research on ${programName.toLowerCase().includes("hypertrophy") ? "hypertrophy" : programName.toLowerCase().includes("strength") ? "strength training" : "workout"} optimization`);
  } else {
    research.push("Progressive overload techniques for beginners");
  }

  return { regular, research };
}

export default async function AICoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: program }] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, current_weight_kg, target_weight_kg")
      .eq("id", user.id)
      .single(),
    supabase
      .from("programs")
      .select("name")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single(),
  ]);

  const suggestions = buildSuggestions(
    profile || {},
    program?.name || undefined
  );

  return (
    <AIChatClient
      userName={profile?.name || "there"}
      suggestions={suggestions}
    />
  );
}
