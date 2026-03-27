"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Users, ArrowLeft } from "lucide-react";
import { joinGroupByCode } from "@/lib/gym/group-actions";

export default function JoinGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-fill from URL
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) setCode(urlCode);
  }, [searchParams]);

  function handleJoin() {
    if (!code.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const groupId = await joinGroupByCode(code.trim());
        setSuccess(true);
        setTimeout(() => router.push(`/gym/groups/${groupId}`), 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join group");
      }
    });
  }

  return (
    <div>
      <button
        onClick={() => router.push("/gym/groups")}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle">
          <Users size={18} className="text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Join Group</h2>
          <p className="text-[11px] text-text-muted">Enter an invite code to join</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-bg-card p-5 shadow-card">
        <Input
          label="Invite Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste invite code here"
        />

        {error && (
          <p className="mt-3 rounded-xl bg-error/10 border border-error/20 px-3 py-2.5 text-xs text-error font-medium">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-3 rounded-xl bg-success-subtle border border-success/20 px-3 py-2.5 text-xs text-success font-medium">
            Joined successfully! Redirecting...
          </p>
        )}

        <div className="mt-4">
          <Button
            fullWidth
            onClick={handleJoin}
            disabled={isPending || !code.trim() || success}
          >
            {isPending ? "Joining..." : success ? "Joined!" : "Join Group"}
          </Button>
        </div>
      </div>
    </div>
  );
}
