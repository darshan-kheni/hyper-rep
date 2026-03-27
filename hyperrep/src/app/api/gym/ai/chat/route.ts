import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildAIContext } from "@/lib/gym/ai-context";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  // Build context from user data
  const systemPrompt = await buildAIContext(supabase, user.id);

  // Create Ollama-compatible client via OpenAI SDK
  const ollama = createOpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    apiKey: "ollama",
  });

  const model = process.env.OLLAMA_MODEL || "llama3.1";

  const result = streamText({
    model: ollama(model),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
