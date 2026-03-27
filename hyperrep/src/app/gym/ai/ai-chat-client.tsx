"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolStatus?: string;
  thinking?: string;
};

interface AIChatClientProps {
  userName: string;
}

export function AIChatClient({ userName }: AIChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    setInput("");
    setError(null);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg };
    const assistantMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/gym/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line);

            if (parsed.type === "status") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, toolStatus: parsed.content }
                    : m
                )
              );
            } else if (parsed.type === "thinking") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, thinking: parsed.content, toolStatus: undefined }
                    : m
                )
              );
            } else if (parsed.type === "text") {
              fullContent += parsed.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: fullContent, toolStatus: undefined }
                    : m
                )
              );
            } else if (parsed.type === "error") {
              throw new Error(parsed.content);
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              fullContent += line;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: fullContent, toolStatus: undefined }
                    : m
                )
              );
            } else {
              throw e;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
      setMessages((prev) => prev.filter((m) => m.content !== "" || m.toolStatus));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 180px)" }}>
      <h2 className="mb-1 text-lg font-bold flex items-center gap-2">
        <Bot size={20} className="text-accent" />
        AI Coach
      </h2>
      <p className="mb-4 text-xs text-text-muted">
        Powered by Ollama Cloud — can query your data, generate plans, and adjust your program
      </p>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot size={40} className="mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-sm text-text-muted">
              Hey {userName}! I can check your stats, create programs, and adjust your plan.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {[
                "How am I doing this week?",
                "Create a 4-week hypertrophy program",
                "What can I do instead of leg press?",
                "Increase my chest press to 50 lbs",
                "I weighed 63.5 kg today",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-xl border border-border px-3 py-2 text-xs text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          // Skip rendering empty assistant messages that are still loading
          // (the loading indicator below handles that)
          const isLastMsg = idx === messages.length - 1;
          const isEmpty = !msg.content && !msg.toolStatus;
          if (msg.role === "assistant" && isEmpty && isLastMsg && isLoading) {
            return null;
          }

          return (<div key={msg.id}>
            {/* Tool status */}
            {msg.role === "assistant" && msg.toolStatus && (
              <div className="flex items-center gap-2 text-xs text-accent mb-1 ml-6">
                <Loader2 size={12} className="animate-spin" />
                {msg.toolStatus}
              </div>
            )}

            {/* Thinking process (collapsible) */}
            {msg.role === "assistant" && msg.thinking && (
              <details className="mb-1 ml-6">
                <summary className="text-[10px] font-semibold text-text-muted cursor-pointer hover:text-accent transition-colors">
                  Show thinking process
                </summary>
                <div className="mt-1 rounded-lg bg-bg-elevated border border-border/50 px-3 py-2 text-[11px] text-text-muted leading-relaxed max-h-40 overflow-y-auto">
                  {msg.thinking}
                </div>
              </details>
            )}

            <div
              className={clsx(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 mt-1">
                  <Bot size={16} className="text-accent" />
                </div>
              )}
              <div
                className={clsx(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "bg-bg-card border border-border"
                )}
              >
                {msg.role === "assistant" && msg.content ? (
                  <div className="prose-chat">
                    <ReactMarkdown
                      components={{
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-2 rounded-lg border border-border">
                            <table className="w-full text-xs">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-bg-elevated">{children}</thead>
                        ),
                        th: ({ children }) => (
                          <th className="px-3 py-1.5 text-left font-bold text-text-muted text-[10px] uppercase tracking-wider border-b border-border">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-1.5 border-b border-border/50">
                            {children}
                          </td>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold text-accent">{children}</strong>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-bold mt-2 mb-1 text-accent">{children}</h3>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm">{children}</li>
                        ),
                        p: ({ children }) => (
                          <p className="my-1">{children}</p>
                        ),
                        code: ({ children, className }) => {
                          const isBlock = className?.includes("language-");
                          return isBlock ? (
                            <pre className="bg-bg-elevated rounded-lg p-3 my-2 overflow-x-auto text-xs">
                              <code>{children}</code>
                            </pre>
                          ) : (
                            <code className="bg-bg-elevated px-1.5 py-0.5 rounded text-xs font-mono text-accent">
                              {children}
                            </code>
                          );
                        },
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-accent pl-3 my-2 text-text-muted italic">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {msg.content || (msg.toolStatus ? "" : isLoading ? "" : "")}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 mt-1">
                  <User size={16} className="text-text-muted" />
                </div>
              )}
            </div>
          </div>
          );
        })}

        {isLoading && !messages[messages.length - 1]?.content && !messages[messages.length - 1]?.toolStatus && (
            <div className="flex gap-2">
              <Bot size={16} className="text-accent mt-1" />
              <div className="rounded-2xl bg-bg-card border border-border px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}

        {error && (
          <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs text-error">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach..."
          className="flex-1 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-50 cursor-pointer transition-colors hover:bg-accent-hover"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
