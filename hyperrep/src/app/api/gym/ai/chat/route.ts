import { createClient } from "@/lib/supabase/server";
import { buildAIContext } from "@/lib/gym/ai-context";
import { AI_TOOLS, TOOL_STATUS, executeTool } from "@/lib/gym/ai-tools";

const OLLAMA_API = "https://ollama.com/api/chat";
const MAX_TOOL_ITERATIONS = 5;

type OllamaMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: {
    function: { name: string; arguments: Record<string, unknown> };
  }[];
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages: clientMessages } = await req.json();
  const systemPrompt = await buildAIContext(supabase, user.id);
  const model = process.env.OLLAMA_MODEL || "qwen3-next:80b";

  // Build message history
  const ollamaMessages: OllamaMessage[] = [
    { role: "system", content: systemPrompt },
    ...clientMessages.map(
      (m: { role: string; content?: string; parts?: { type: string; text: string }[] }) => ({
        role: m.role as "user" | "assistant",
        content:
          m.parts?.map((p) => (p.type === "text" ? p.text : "")).join("") ||
          m.content ||
          "",
      })
    ),
  ];

  // NDJSON stream to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        // ── Tool loop (non-streamed) ──
        let iteration = 0;
        while (iteration < MAX_TOOL_ITERATIONS) {
          const response = await fetch(OLLAMA_API, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OLLAMA_API_KEY || ""}`,
            },
            body: JSON.stringify({
              model,
              messages: ollamaMessages,
              tools: AI_TOOLS,
              stream: false,
            }),
          });

          if (!response.ok) {
            send({ type: "error", content: `Ollama API error: ${response.status}` });
            controller.close();
            return;
          }

          const data = await response.json();
          const assistantMsg = data.message;

          if (!assistantMsg) {
            send({ type: "error", content: "No response from AI" });
            controller.close();
            return;
          }

          // Check for tool calls
          if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
            // Append assistant message with tool calls to history
            ollamaMessages.push({
              role: "assistant",
              content: assistantMsg.content || "",
              tool_calls: assistantMsg.tool_calls,
            });

            // Execute each tool
            for (const toolCall of assistantMsg.tool_calls) {
              const toolName = toolCall.function.name;
              const toolArgs = toolCall.function.arguments || {};

              // Send status to client
              send({
                type: "status",
                content: TOOL_STATUS[toolName] || `Running ${toolName}...`,
              });

              const result = await executeTool(toolName, toolArgs, supabase, user.id);

              // Append tool result to history
              ollamaMessages.push({
                role: "tool",
                content: result,
              });
            }

            iteration++;
            continue;
          }

          // No tool calls — this is the final text response
          // Stream it to the client
          if (assistantMsg.content) {
            // Make a streaming call for better UX
            const streamResponse = await fetch(OLLAMA_API, {
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

            if (streamResponse.ok && streamResponse.body) {
              const reader = streamResponse.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter((l) => l.trim());

                for (const line of lines) {
                  try {
                    const parsed = JSON.parse(line);
                    if (parsed.message?.content) {
                      send({ type: "text", content: parsed.message.content });
                    }
                  } catch {
                    // Skip malformed lines
                  }
                }
              }
            } else {
              // Fallback: send the non-streamed content
              send({ type: "text", content: assistantMsg.content });
            }
          }

          send({ type: "done" });
          controller.close();
          return;
        }

        // Max iterations reached
        send({ type: "text", content: "I've gathered the data. Let me know if you need anything else." });
        send({ type: "done" });
        controller.close();
      } catch (err) {
        send({
          type: "error",
          content: err instanceof Error ? err.message : "An error occurred",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
    },
  });
}
