"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Crown, Check, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { respondToInvitation } from "@/lib/gym/group-actions";
import { clsx } from "clsx";

type GroupItem = {
  membershipId: string;
  role: string;
  status: string;
  groupId: string;
  name: string;
  description: string | null;
  inviteCode: string | null;
  isManager: boolean;
  memberCount: number;
};

interface GroupsClientProps {
  groups: GroupItem[];
  pendingInvitations: GroupItem[];
}

export function GroupsClient({ groups, pendingInvitations }: GroupsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [respondingId, setRespondingId] = useState<string | null>(null);

  function handleRespond(membershipId: string, accept: boolean) {
    setRespondingId(membershipId);
    startTransition(async () => {
      await respondToInvitation(membershipId, accept);
      setRespondingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">Groups</h2>
        <Button
          onClick={() => router.push("/gym/groups/create")}
          className="flex items-center gap-1.5 !px-3 !py-2 text-xs"
        >
          <Plus size={14} />
          New Group
        </Button>
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={14} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Pending Invitations
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.membershipId}
                className="rounded-2xl border border-accent/20 bg-bg-card p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">{inv.name}</div>
                    {inv.description && (
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {inv.description}
                      </div>
                    )}
                    <div className="text-[10px] text-text-muted mt-1">
                      {inv.memberCount} member{inv.memberCount !== 1 && "s"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond(inv.membershipId, false)}
                      disabled={isPending && respondingId === inv.membershipId}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-muted hover:border-error hover:text-error transition-all cursor-pointer active:scale-95"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleRespond(inv.membershipId, true)}
                      disabled={isPending && respondingId === inv.membershipId}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20 hover:brightness-110 transition-all cursor-pointer active:scale-95"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active groups */}
      {groups.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => (
            <button
              key={g.groupId}
              onClick={() => router.push(`/gym/groups/${g.groupId}`)}
              className={clsx(
                "w-full rounded-2xl border border-border/50 bg-bg-card p-4 text-left shadow-card",
                "transition-all duration-200 hover:border-accent/30 hover:shadow-elevated",
                "active:scale-[0.98] cursor-pointer"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle">
                    <Users size={18} className="text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{g.name}</span>
                      {g.isManager && (
                        <span className="flex items-center gap-0.5 rounded-full bg-accent-subtle px-1.5 py-0.5 text-[8px] font-bold text-accent">
                          <Crown size={8} />
                          MANAGER
                        </span>
                      )}
                    </div>
                    {g.description && (
                      <div className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                        {g.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-text-muted">
                  <Users size={12} />
                  <span className="text-xs font-semibold tabular-nums">
                    {g.memberCount}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        pendingInvitations.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-elevated">
              <Users size={28} className="text-text-muted" />
            </div>
            <h3 className="text-sm font-bold">No groups yet</h3>
            <p className="mt-1 text-xs text-text-muted">
              Create a group to work out with friends
            </p>
          </div>
        )
      )}
    </div>
  );
}
