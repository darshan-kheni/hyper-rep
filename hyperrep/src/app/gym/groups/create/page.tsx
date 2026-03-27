"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Users } from "lucide-react";
import { createGroup } from "@/lib/gym/group-actions";

export default function CreateGroupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      setError("Group name is required");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const group = await createGroup(
          name,
          (formData.get("description") as string)?.trim() || undefined
        );
        router.push(`/gym/groups/${group.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create group");
      }
    });
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
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
          <h2 className="text-lg font-bold">Create Group</h2>
          <p className="text-[11px] text-text-muted">
            Start a workout group with friends
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border/50 bg-bg-card p-5 shadow-card">
          <Input
            label="Group Name"
            name="name"
            placeholder="e.g. Morning Grind Crew"
            required
          />
          <div className="mt-4">
            <label className="text-[11px] font-medium tracking-wide text-text-muted block mb-1.5">
              Description (optional)
            </label>
            <textarea
              name="description"
              placeholder="What's this group about?"
              rows={2}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all duration-150 resize-none min-h-[44px]"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-error/10 border border-error/20 px-3 py-2.5 text-xs text-error font-medium">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? "Creating..." : "Create Group"}
        </Button>
      </form>
    </div>
  );
}
