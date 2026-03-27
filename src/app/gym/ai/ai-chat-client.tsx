"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Bot, User, Loader2, Globe, Search, ImagePlus, X, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string; // base64 data URL for display
  toolStatus?: string;
  thinking?: string;
};

interface AIChatClientProps {
  userName: string;
  suggestions: {
    regular: string[];
    research: string[];
  };
}

export function AIChatClient({ userName, suggestions }: AIChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deepResearch, setDeepResearch] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null); // base64 data URL
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const header = document.querySelector("header");
    const nav = document.querySelector("nav");
    if (header && nav && containerRef.current) {
      containerRef.current.style.top = `${header.getBoundingClientRect().height}px`;
      containerRef.current.style.bottom = `${nav.getBoundingClientRect().height}px`;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 4MB
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be under 4 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset so same file can be re-selected
    e.target.value = "";
  }

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if ((!msg && !imageData) || isLoading) return;

    const currentImage = imageData;
    setInput("");
    setImageData(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: msg || (currentImage ? "What do you see in this image?" : ""),
      image: currentImage || undefined,
    };
    const assistantMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      // Build message payload — strip images from history (only send current)
      const historyMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/gym/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyMessages,
          deepResearch,
          // Send raw base64 (strip data URL prefix) only for the current message
          image: currentImage
            ? currentImage.replace(/^data:image\/\w+;base64,/, "")
            : undefined,
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
    <div
      ref={containerRef}
      className="flex flex-col fixed inset-x-0 mx-auto max-w-2xl px-4"
      style={{ top: 53, bottom: 57 }}
    >
      <div className="shrink-0 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Bot size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-none">AI Coach</h2>
            <p className="text-[10px] text-text-muted leading-none mt-1">Your personal training assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-text-muted">Online</span>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] text-text-muted border border-border hover:border-error/30 hover:text-error transition-colors cursor-pointer"
            >
              <Trash2 size={10} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot size={40} className="mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-sm text-text-muted">
              Hey {userName}! I can check your stats, create programs, and adjust your plan.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {suggestions.regular.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-xl border border-border px-3 py-2 text-xs text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] text-text-muted mb-2 flex items-center gap-1">
                  <Globe size={10} />
                  Enable Deep Research to search the web
                </p>
                <div className="flex flex-col gap-2">
                  {suggestions.research.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setDeepResearch(true);
                        handleSend(q);
                      }}
                      className="rounded-xl border border-accent/20 px-3 py-2 text-xs text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer text-left flex items-center gap-1.5"
                    >
                      <Search size={10} className="shrink-0 text-accent/50" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
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
            {/* Tool status — shown instead of the bubble when no content yet */}
            {msg.role === "assistant" && msg.toolStatus && !msg.content && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
                  <Loader2 size={14} className="text-accent animate-spin" />
                </div>
                <span className="text-xs text-text-muted">{msg.toolStatus}</span>
              </div>
            )}

            {/* Thinking indicator — shown while thinking with no content yet */}
            {msg.role === "assistant" && msg.thinking && !msg.content && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
                  <Bot size={14} className="text-accent" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-accent/60 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-accent/60 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-1 bg-accent/60 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                  <span className="text-[11px] text-text-muted">Thinking...</span>
                </div>
              </div>
            )}

            {/* Message bubble — only render when there's actual content (or it's a user msg) */}
            {(msg.role === "user" || msg.content) && (
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
                  {msg.role === "user" && msg.image && (
                    <img
                      src={msg.image}
                      alt="Uploaded"
                      className="rounded-lg max-h-48 w-auto mb-1.5"
                    />
                  )}
                  {msg.role === "assistant" && msg.content ? (
                    <div className="prose-chat">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2 rounded-lg border border-border">
                              <table>{children}</table>
                            </div>
                          ),
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          code: ({ children, className }) => {
                            const isBlock = className?.includes("language-");
                            return isBlock ? (
                              <pre>
                                <code>{children}</code>
                              </pre>
                            ) : (
                              <code>{children}</code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 mt-1">
                    <User size={16} className="text-text-muted" />
                  </div>
                )}
              </div>
            )}

            {/* Thinking toggle — shown after response arrives, below the bubble */}
            {msg.role === "assistant" && msg.thinking && msg.content && (
              <details className="mt-1 ml-6">
                <summary className="text-[10px] font-semibold text-text-muted cursor-pointer hover:text-accent transition-colors">
                  Show thinking process
                </summary>
                <div className="mt-1 rounded-lg bg-bg-elevated border border-border/50 px-3 py-2 text-[11px] text-text-muted leading-relaxed max-h-40 overflow-y-auto">
                  {msg.thinking}
                </div>
              </details>
            )}
          </div>
          );
        })}

        {isLoading && !messages[messages.length - 1]?.content && !messages[messages.length - 1]?.toolStatus && !messages[messages.length - 1]?.thinking && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
                <Bot size={14} className="text-accent" />
              </div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
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
        className="shrink-0 mb-2 rounded-2xl border border-border bg-bg-card shadow-sm focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/30 transition-all"
      >
        {imageData && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative inline-block">
              <img
                src={imageData}
                alt="Preview"
                className="h-20 w-auto rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => setImageData(null)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-bg-elevated border border-border text-text-muted hover:text-error transition-colors cursor-pointer"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        )}
        <div className="relative flex items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask your coach..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 pr-14 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !imageData)}
            className={clsx(
              "absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer",
              input.trim() || imageData
                ? "bg-accent text-white shadow-md hover:bg-accent-hover scale-100"
                : "bg-transparent text-text-muted scale-95 opacity-50"
            )}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowUp size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-2 pb-2">
          <button
            type="button"
            onClick={() => setDeepResearch((v) => !v)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all cursor-pointer border",
              deepResearch
                ? "bg-accent/15 text-accent border-accent/30"
                : "bg-transparent text-text-muted border-border hover:border-accent/30 hover:text-accent"
            )}
          >
            <Globe size={12} />
            <span>Deep Research</span>
            {deepResearch && (
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all cursor-pointer border",
              imageData
                ? "bg-accent/15 text-accent border-accent/30"
                : "bg-transparent text-text-muted border-border hover:border-accent/30 hover:text-accent"
            )}
          >
            <ImagePlus size={12} />
            <span>Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </form>
    </div>
  );
}
