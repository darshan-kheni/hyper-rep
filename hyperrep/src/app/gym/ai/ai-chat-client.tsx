"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useState, useMemo } from "react";
import { Send, Bot, User } from "lucide-react";
import { clsx } from "clsx";

interface AIChatClientProps {
  userName: string;
}

export function AIChatClient({ userName }: AIChatClientProps) {
  const transport = useMemo(
    () => new TextStreamChatTransport({ api: "/api/gym/ai/chat" }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";

  function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: msg }] });
    setInput("");
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 180px)" }}>
      <h2 className="mb-1 text-lg font-bold flex items-center gap-2">
        <Bot size={20} className="text-accent" />
        AI Coach
      </h2>
      <p className="mb-4 text-xs text-text-muted">
        Ask about your workouts, nutrition, or get plan suggestions
      </p>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot size={40} className="mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-sm text-text-muted">
              Hey {userName}! Ask me anything about your training.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {[
                "How should I adjust my plan this week?",
                "Am I progressing well on my lifts?",
                "What should I eat before my workout?",
                "Suggest a substitute for chest press machine",
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

        {messages.map((msg) => (
          <div
            key={msg.id}
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
              <div className="whitespace-pre-wrap">
                {msg.parts?.map((part, i) =>
                  part.type === "text" ? <span key={i}>{part.text}</span> : null
                )}
              </div>
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 mt-1">
                <User size={16} className="text-text-muted" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
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
            Failed to connect to AI. Make sure Ollama is running.
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
