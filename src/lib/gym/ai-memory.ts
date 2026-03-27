import { SupabaseClient } from "@supabase/supabase-js";

export type AIMemory = {
  id: string;
  category: string;
  content: string;
  created_at: string;
};

const MEMORY_CATEGORIES = [
  "goal",
  "preference",
  "struggle",
  "pattern",
  "health",
  "lifestyle",
  "nutrition",
  "motivation",
] as const;

/**
 * Load all AI memories for a user, formatted for the system prompt.
 */
export async function loadMemories(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: memories } = await supabase
    .from("ai_memories")
    .select("category, content, created_at")
    .eq("user_id", userId)
    .order("category")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!memories || memories.length === 0) {
    return "No previous memories about this user yet. Learn about them through conversation.";
  }

  // Group by category
  const grouped: Record<string, string[]> = {};
  for (const m of memories) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m.content);
  }

  const sections = Object.entries(grouped)
    .map(([cat, items]) => {
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      return `${label}:\n${items.map((i) => `  - ${i}`).join("\n")}`;
    })
    .join("\n\n");

  return `What you know about this user from past conversations:\n\n${sections}`;
}

/**
 * Save a conversation to the ai_conversations table.
 */
export async function saveConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string | null,
  messages: { role: string; content: string }[]
): Promise<string> {
  if (conversationId) {
    // Update existing conversation
    await supabase
      .from("ai_conversations")
      .update({
        messages: JSON.stringify(messages),
        title: messages[0]?.content?.slice(0, 50) || "Chat",
      })
      .eq("id", conversationId)
      .eq("user_id", userId);
    return conversationId;
  }

  // Create new conversation
  const { data } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      messages: JSON.stringify(messages),
      title: messages[0]?.content?.slice(0, 50) || "Chat",
    })
    .select("id")
    .single();

  return data?.id || "";
}

/**
 * Load the most recent conversation for a user.
 */
export async function loadRecentConversation(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  id: string;
  messages: { role: string; content: string }[];
} | null> {
  const { data } = await supabase
    .from("ai_conversations")
    .select("id, messages")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  const messages =
    typeof data.messages === "string"
      ? JSON.parse(data.messages)
      : data.messages;

  return { id: data.id, messages };
}

/**
 * Extract memories from a conversation using a simple rule-based approach.
 * Called after each conversation exchange.
 */
export async function extractMemories(
  supabase: SupabaseClient,
  userId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  const combined = `${userMessage}\n${assistantResponse}`.toLowerCase();

  const extractions: { category: string; content: string }[] = [];

  // Goal detection
  if (
    combined.match(
      /want to|goal is|aiming for|target|plan to|trying to|need to reach/
    )
  ) {
    const goalMatch = userMessage.match(
      /(?:want to|goal is|aiming for|target|plan to|trying to|need to reach)\s+(.{10,80})/i
    );
    if (goalMatch) {
      extractions.push({ category: "goal", content: goalMatch[1].trim() });
    }
  }

  // Struggle/problem detection
  if (
    combined.match(
      /struggling with|can't|difficult|hard to|problem with|issue with|pain in|hurts when/
    )
  ) {
    const struggleMatch = userMessage.match(
      /(?:struggling with|can't|difficult|hard to|problem with|issue with|pain in|hurts when)\s+(.{10,80})/i
    );
    if (struggleMatch) {
      extractions.push({
        category: "struggle",
        content: struggleMatch[1].trim(),
      });
    }
  }

  // Health detection
  if (
    combined.match(
      /injury|injured|doctor|medical|allergy|allergic|intolerant|condition/
    )
  ) {
    const healthMatch = userMessage.match(
      /(?:injury|injured|doctor|medical|allergy|allergic|intolerant|have a|condition)\s*[:\-]?\s*(.{5,80})/i
    );
    if (healthMatch) {
      extractions.push({
        category: "health",
        content: healthMatch[1].trim(),
      });
    }
  }

  // Preference detection
  if (
    combined.match(
      /prefer|like to|don't like|hate|favorite|rather|instead of/
    )
  ) {
    const prefMatch = userMessage.match(
      /(?:prefer|like to|don't like|hate|favorite|rather|instead of)\s+(.{5,80})/i
    );
    if (prefMatch) {
      extractions.push({
        category: "preference",
        content: prefMatch[1].trim(),
      });
    }
  }

  // Lifestyle detection
  if (
    combined.match(
      /work schedule|job|sleep|wake up|busy|travel|office|remote|shift/
    )
  ) {
    const lifestyleMatch = userMessage.match(
      /(?:work schedule|job|sleep|wake up|busy|travel|office|remote|shift)\s*[:\-]?\s*(.{5,80})/i
    );
    if (lifestyleMatch) {
      extractions.push({
        category: "lifestyle",
        content: lifestyleMatch[1].trim(),
      });
    }
  }

  // Nutrition detection
  if (
    combined.match(
      /eat|diet|food|meal|calorie|protein|vegetarian|vegan|fasting/
    )
  ) {
    const nutritionMatch = userMessage.match(
      /(?:i eat|my diet|food|meal plan|calorie|protein intake|i'm vegetarian|fasting)\s*[:\-]?\s*(.{5,80})/i
    );
    if (nutritionMatch) {
      extractions.push({
        category: "nutrition",
        content: nutritionMatch[1].trim(),
      });
    }
  }

  // Motivation detection
  if (
    combined.match(
      /motivated|motivation|why i|reason|inspire|driven by|because/
    )
  ) {
    const motivMatch = userMessage.match(
      /(?:motivated|motivation|why i|reason|inspire|driven by|because)\s*[:\-]?\s*(.{5,80})/i
    );
    if (motivMatch) {
      extractions.push({
        category: "motivation",
        content: motivMatch[1].trim(),
      });
    }
  }

  // Weight mention
  const weightMatch = userMessage.match(
    /(?:i weigh|my weight is|currently|i'm)\s+(\d{2,3}(?:\.\d)?)\s*kg/i
  );
  if (weightMatch) {
    extractions.push({
      category: "pattern",
      content: `Reported weight: ${weightMatch[1]} kg on ${new Date().toISOString().split("T")[0]}`,
    });
  }

  // Save unique memories (avoid duplicates)
  for (const ext of extractions) {
    // Check if a similar memory already exists
    const { data: existing } = await supabase
      .from("ai_memories")
      .select("id, content")
      .eq("user_id", userId)
      .eq("category", ext.category)
      .ilike("content", `%${ext.content.slice(0, 30)}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing memory
      await supabase
        .from("ai_memories")
        .update({ content: ext.content })
        .eq("id", existing[0].id);
    } else {
      // Insert new memory
      await supabase.from("ai_memories").insert({
        user_id: userId,
        category: ext.category,
        content: ext.content,
        source: "conversation",
      });
    }
  }
}

export { MEMORY_CATEGORIES };
