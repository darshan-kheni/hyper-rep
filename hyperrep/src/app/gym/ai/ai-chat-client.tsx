"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User } from "lucide-react";
import { clsx } from "clsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: fullContent } : m
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
      // Remove empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
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
        Powered by Ollama Cloud — ask about workouts, nutrition, or get plan suggestions
      </p>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4">
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
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 mt-1">
                <User size={16} className="text-text-muted" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.content === "" && (
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
