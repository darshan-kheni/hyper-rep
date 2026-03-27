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

  const { messages: clientMessages } = await req.json();

  // Build context from user data
  const systemPrompt = await buildAIContext(supabase, user.id);

  // Convert client messages to Ollama format
  const ollamaMessages = [
    { role: "system", content: systemPrompt },
    ...clientMessages.map((m: { role: string; parts?: { type: string; text: string }[]; content?: string }) => ({
      role: m.role,
      content: m.parts?.map((p) => (p.type === "text" ? p.text : "")).join("") || m.content || "",
    })),
  ];

  const model = process.env.OLLAMA_MODEL || "qwen3.5:32b";

  // Call Ollama Cloud API with streaming
  const response = await fetch("https://ollama.com/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY || ""}`,
    },
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(`Ollama API error: ${error}`, { status: response.status });
  }

  // Transform Ollama's streaming NDJSON to a text stream for the client
  const reader = response.body?.getReader();
  if (!reader) {
    return new Response("No response body", { status: 500 });
  }

  const decoder = new TextDecoder();
  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        // Ollama streams NDJSON — each line is a JSON object
        const lines = chunk.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              controller.enqueue(new TextEncoder().encode(parsed.message.content));
            }
            if (parsed.done) {
              controller.close();
              return;
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
