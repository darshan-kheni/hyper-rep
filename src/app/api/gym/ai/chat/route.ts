import { createClient } from "@/lib/supabase/server";
import { buildAIContext } from "@/lib/gym/ai-context";
import { AI_TOOLS, TOOL_STATUS, executeTool } from "@/lib/gym/ai-tools";
import { saveConversation, extractMemories } from "@/lib/gym/ai-memory";
import { webSearch } from "@/lib/gym/web-search";
import { analyzeImage } from "@/lib/gym/analyze-image";

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

  const { messages: clientMessages, conversationId: incomingConvId, deepResearch, image } = await req.json();
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

  // Analyze image with Gemini Vision if provided, then inject description as text
  let imageAnalysis: string | null = null;
  if (image) {
    imageAnalysis = "pending"; // flag to handle in stream
  }

  // NDJSON stream to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        // ── Image Analysis: use Gemini Vision ──
        if (imageAnalysis === "pending" && image) {
          send({ type: "status", content: "Analyzing your photo..." });

          try {
            const description = await analyzeImage(image);
            // Inject analysis as context into the last user message
            const lastMsg = ollamaMessages[ollamaMessages.length - 1];
            if (lastMsg && lastMsg.role === "user") {
              lastMsg.content =
                `${lastMsg.content}\n\n[IMAGE ANALYSIS — the user attached a photo, here is what it shows]:\n${description}\n\nUse this analysis to give specific, actionable coaching advice about what you see.`;
            }
            send({ type: "status", content: "Photo analyzed. Preparing response..." });
          } catch (imgErr) {
            send({
              type: "status",
              content: `Could not analyze photo: ${imgErr instanceof Error ? imgErr.message : "unknown error"}. Answering based on text only.`,
            });
          }
        }

        // ── Deep Research: search the web first ──
        if (deepResearch) {
          const lastUserMsg = clientMessages[clientMessages.length - 1];
          const searchQuery =
            lastUserMsg?.content ||
            lastUserMsg?.parts?.map((p: { type: string; text: string }) => p.text).join("") ||
            "";

          if (searchQuery) {
            send({ type: "status", content: "Searching the web..." });

            try {
              const searchData = await webSearch(searchQuery, 6);

              let searchContext = "\n\nWEB SEARCH RESULTS (user enabled Deep Research — use these sources to inform your answer):\n";
              if (searchData.answer) {
                searchContext += `\nQuick answer: ${searchData.answer}\n`;
              }
              searchData.results.forEach((r, i) => {
                searchContext += `\n[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}\n`;
              });
              searchContext += "\nIMPORTANT: Cite sources with their URL when using information from search results. Format citations as markdown links.";

              // Inject search results as a system message before the last user message
              ollamaMessages.splice(ollamaMessages.length - 1, 0, {
                role: "system",
                content: searchContext,
              });

              send({ type: "status", content: `Found ${searchData.results.length} sources. Analyzing...` });
            } catch (searchErr) {
              send({
                type: "status",
                content: `Web search unavailable: ${searchErr instanceof Error ? searchErr.message : "unknown error"}. Answering without it.`,
              });
            }
          }
        }

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

          // No tool calls — send the response directly (no second Ollama call)
          if (assistantMsg.content) {
            const raw = assistantMsg.content as string;

            // Extract thinking content if present (qwen3-next uses <think> tags)
            const thinkMatch = raw.match(/<think>([\s\S]*?)<\/think>/);
            if (thinkMatch && thinkMatch[1].trim()) {
              send({ type: "thinking", content: thinkMatch[1].trim() });
            }

            // Send the actual response (without thinking tags)
            const content = raw.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
            if (content) {
              send({ type: "text", content });

              // Save conversation and extract memories before closing stream
              const lastUserMsg = clientMessages[clientMessages.length - 1];
              const userText = lastUserMsg?.content || lastUserMsg?.parts?.map((p: { type: string; text: string }) => p.text).join("") || "";

              const convoMessages = clientMessages.map((m: { role: string; content?: string }) => ({
                role: m.role,
                content: m.content || "",
              }));
              convoMessages.push({ role: "assistant", content });

              // Save conversation (await so we can send convId before closing)
              try {
                const convId = await saveConversation(supabase, user.id, incomingConvId || null, convoMessages);
                if (convId) send({ type: "conversationId", content: convId });
              } catch {}

              // Extract memories (fire-and-forget, not critical for response)
              extractMemories(supabase, user.id, userText, content).catch(() => {});
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
