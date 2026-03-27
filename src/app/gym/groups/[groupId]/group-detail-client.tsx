"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Crown, Users, MessageCircle, Dumbbell,
  Send, Copy, Check, UserPlus, Trash2, Share2, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clsx } from "clsx";
import {
  inviteMember, removeMember, leaveGroup, deleteGroup,
  sendGroupMessage, sharePlan, stopSharing,
} from "@/lib/gym/group-actions";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Member = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SharedPlan = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Message = any;

interface GroupDetailClientProps {
  group: { id: string; name: string; description: string | null; invite_code: string; created_by: string };
  members: Member[];
  sharedPlans: SharedPlan[];
  initialMessages: Message[];
  myRole: string;
  userId: string;
}

type Tab = "plan" | "chat" | "members";

export function GroupDetailClient({
  group,
  members,
  sharedPlans,
  initialMessages,
  myRole,
  userId,
}: GroupDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [isPending, startTransition] = useTransition();
  const isManager = myRole === "manager";

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "plan", label: "Plan", icon: <Dumbbell size={14} /> },
    { key: "chat", label: "Chat", icon: <MessageCircle size={14} /> },
    { key: "members", label: "Members", icon: <Users size={14} /> },
  ];

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 180px)" }}>
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => router.push("/gym/groups")}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Groups
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle">
            <Users size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{group.name}</h2>
            {group.description && (
              <p className="text-[11px] text-text-muted truncate">{group.description}</p>
            )}
          </div>
          <span className="text-[10px] text-text-muted tabular-nums">
            {members.filter((m: Member) => m.status === "accepted").length} members
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-xl bg-bg-elevated p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === tab.key
                ? "bg-bg-card text-accent shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === "plan" && (
          <PlanTab
            sharedPlans={sharedPlans}
            isManager={isManager}
            groupId={group.id}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}
        {activeTab === "chat" && (
          <ChatTab
            groupId={group.id}
            userId={userId}
            initialMessages={initialMessages}
          />
        )}
        {activeTab === "members" && (
          <MembersTab
            members={members}
            isManager={isManager}
            groupId={group.id}
            userId={userId}
            inviteCode={group.invite_code}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}
      </div>
    </div>
  );
}

// ── Plan Tab ──
function PlanTab({
  sharedPlans,
  isManager,
  groupId,
  isPending,
  startTransition,
}: {
  sharedPlans: SharedPlan[];
  isManager: boolean;
  groupId: string;
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareType, setShareType] = useState<"full" | "range">("full");
  const [includeMeals, setIncludeMeals] = useState(false);
  const [includeTimeline, setIncludeTimeline] = useState(false);

  function handleShare() {
    startTransition(async () => {
      await sharePlan(groupId, shareType, { includeMeals, includeTimeline });
      setShowShareForm(false);
    });
  }

  function handleStopSharing(planId: string) {
    if (!confirm("Stop sharing this plan?")) return;
    startTransition(async () => {
      await stopSharing(planId);
    });
  }

  return (
    <div>
      {isManager && (
        <div className="mb-4">
          {!showShareForm ? (
            <Button
              onClick={() => setShowShareForm(true)}
              variant="secondary"
              fullWidth
            >
              <span className="flex items-center justify-center gap-1.5">
                <Share2 size={14} />
                Share My Plan
              </span>
            </Button>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-bg-card p-4 shadow-card">
              <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
                Share Settings
              </div>

              <div className="flex gap-2 mb-3">
                {(["full", "range"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setShareType(t)}
                    className={clsx(
                      "flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer",
                      shareType === t
                        ? "bg-accent text-white"
                        : "bg-bg-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    {t === "full" ? "Full Plan" : "Day Range"}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMeals}
                    onChange={(e) => setIncludeMeals(e.target.checked)}
                    className="rounded accent-accent h-4 w-4"
                  />
                  <span className="text-xs">Include Meal Plan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTimeline}
                    onChange={(e) => setIncludeTimeline(e.target.checked)}
                    className="rounded accent-accent h-4 w-4"
                  />
                  <span className="text-xs">Include Timeline</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowShareForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleShare} disabled={isPending} className="flex-1">
                  {isPending ? "Sharing..." : "Share"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {sharedPlans.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {sharedPlans.map((plan: SharedPlan) => {
            const program = Array.isArray(plan.programs)
              ? plan.programs[0]
              : plan.programs;
            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-border/50 bg-bg-card p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell size={14} className="text-accent" />
                    <span className="text-sm font-bold">
                      {program?.name || "Workout Plan"}
                    </span>
                  </div>
                  <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[8px] font-bold text-accent uppercase">
                    {plan.share_type}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {plan.include_meals && (
                    <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[9px] font-semibold text-text-muted">
                      Meals
                    </span>
                  )}
                  {plan.include_timeline && (
                    <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[9px] font-semibold text-text-muted">
                      Timeline
                    </span>
                  )}
                </div>
                {isManager && plan.shared_by === plan.shared_by && (
                  <button
                    onClick={() => handleStopSharing(plan.id)}
                    className="mt-3 text-[10px] text-error hover:underline cursor-pointer"
                  >
                    Stop sharing
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Dumbbell size={24} className="mx-auto mb-2 text-text-muted opacity-30" />
          <p className="text-xs text-text-muted">
            {isManager
              ? "Share your workout plan with the group"
              : "No plans shared yet"}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Chat Tab ──
function ChatTab({
  groupId,
  userId,
  initialMessages,
}: {
  groupId: string;
  userId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
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

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch sender name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", payload.new.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...payload.new, profiles: profile },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    try {
      await sendGroupMessage(groupId, text);
    } catch {
      // Message will appear via realtime
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 320px)" }}>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-2"
      >
        {messages.length === 0 ? (
          <div className="py-12 text-center">
            <MessageCircle
              size={24}
              className="mx-auto mb-2 text-text-muted opacity-30"
            />
            <p className="text-xs text-text-muted">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((msg: Message) => {
            const isMine = msg.sender_id === userId;
            const senderName = Array.isArray(msg.profiles)
              ? msg.profiles[0]?.name
              : msg.profiles?.name;

            return (
              <div
                key={msg.id}
                className={clsx(
                  "flex",
                  isMine ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={clsx(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    isMine
                      ? "bg-accent text-white"
                      : "bg-bg-card border border-border/50"
                  )}
                >
                  {!isMine && (
                    <div className="text-[9px] font-bold text-accent mb-0.5">
                      {senderName || "Unknown"}
                    </div>
                  )}
                  <div className="leading-relaxed">{msg.content}</div>
                  <div
                    className={clsx(
                      "text-[8px] mt-0.5",
                      isMine ? "text-white/50" : "text-text-muted"
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chat input */}
      <div className="shrink-0 pt-2">
        <div className="flex items-end gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message..."
            className="flex-1 rounded-xl border border-border bg-bg-card px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all min-h-[44px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={clsx(
              "flex h-[44px] w-[44px] items-center justify-center rounded-xl transition-all cursor-pointer",
              input.trim()
                ? "bg-accent text-white shadow-md shadow-accent/20 active:scale-95"
                : "bg-bg-elevated text-text-muted"
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Members Tab ──
function MembersTab({
  members,
  isManager,
  groupId,
  userId,
  inviteCode,
  isPending,
  startTransition,
}: {
  members: Member[];
  isManager: boolean;
  groupId: string;
  userId: string;
  inviteCode: string;
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    startTransition(async () => {
      try {
        await inviteMember(groupId, inviteEmail.trim());
        setInviteEmail("");
      } catch (err) {
        setInviteError(err instanceof Error ? err.message : "Failed to invite");
      }
    });
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(
      `${window.location.origin}/gym/groups/join?code=${inviteCode}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRemove(targetUserId: string) {
    if (!confirm("Remove this member?")) return;
    startTransition(async () => {
      await removeMember(groupId, targetUserId);
    });
  }

  function handleLeave() {
    if (!confirm("Leave this group?")) return;
    startTransition(async () => {
      await leaveGroup(groupId);
      router.push("/gym/groups");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteGroup(groupId);
      router.push("/gym/groups");
    });
  }

  return (
    <div>
      {/* Invite section */}
      {isManager && (
        <div className="rounded-2xl border border-border/50 bg-bg-card p-4 shadow-card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={14} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Invite Member
            </span>
          </div>

          <div className="flex gap-2 mb-3">
            <Input
              type="email"
              placeholder="friend@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleInvite}
              disabled={isPending || !inviteEmail.trim()}
              className="flex-shrink-0"
            >
              Invite
            </Button>
          </div>

          {inviteError && (
            <p className="text-[10px] text-error mb-2">{inviteError}</p>
          )}

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 w-full rounded-lg bg-bg-elevated px-3 py-2 text-[11px] text-text-muted hover:text-accent transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            <span>{copied ? "Link copied!" : "Copy invite link"}</span>
          </button>
        </div>
      )}

      {/* Member list */}
      <div className="flex flex-col gap-1.5">
        {members
          .filter((m: Member) => m.status === "accepted")
          .map((m: Member) => {
            const name = Array.isArray(m.profiles)
              ? m.profiles[0]?.name
              : m.profiles?.name;
            const isMe = m.user_id === userId;

            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-bg-card border border-border/50 px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle text-xs font-bold text-accent">
                    {(name || "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {name || "Unknown"} {isMe && <span className="text-text-muted">(you)</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.role === "manager" && (
                    <span className="flex items-center gap-0.5 rounded-full bg-accent-subtle px-1.5 py-0.5 text-[8px] font-bold text-accent">
                      <Crown size={8} />
                      MANAGER
                    </span>
                  )}
                  {isManager && !isMe && (
                    <button
                      onClick={() => handleRemove(m.user_id)}
                      disabled={isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        {/* Pending members */}
        {members
          .filter((m: Member) => m.status === "pending")
          .map((m: Member) => {
            const name = Array.isArray(m.profiles)
              ? m.profiles[0]?.name
              : m.profiles?.name;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-bg-card border border-border/30 px-4 py-3 opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-elevated text-xs font-bold text-text-muted">
                    {(name || "?")[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-text-muted">
                    {name || "Unknown"}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-warning uppercase">
                  Pending
                </span>
              </div>
            );
          })}
      </div>

      {/* Leave / Delete */}
      <div className="mt-6 pt-4 border-t border-border/30">
        {isManager ? (
          <Button variant="danger" fullWidth onClick={handleDelete} disabled={isPending}>
            <span className="flex items-center justify-center gap-1.5">
              <Trash2 size={14} />
              Delete Group
            </span>
          </Button>
        ) : (
          <Button variant="danger" fullWidth onClick={handleLeave} disabled={isPending}>
            <span className="flex items-center justify-center gap-1.5">
              <LogOut size={14} />
              Leave Group
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
