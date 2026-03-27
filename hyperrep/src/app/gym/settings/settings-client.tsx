"use client";

import { useState, useTransition } from "react";
import { updateProfile, logWeight, regenerateProgram } from "@/lib/gym/actions";
import { signOut } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WeightChart } from "@/components/gym/WeightChart";
import { RefreshCw, Scale, LogOut, User, Check } from "lucide-react";
import { clsx } from "clsx";

type Profile = {
  id: string;
  name: string | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  gym_start_time: string | null;
  preferred_weight_unit: string | null;
  rest_day: number | null;
  timezone: string | null;
};

interface SettingsClientProps {
  profile: Profile | null;
  weightLogs: { weight_kg: number; logged_at: string }[];
  email: string;
}

export function SettingsClient({
  profile,
  weightLogs,
  email,
}: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [weightInput, setWeightInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);

  function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      await updateProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleLogWeight() {
    const w = parseFloat(weightInput);
    if (!w || w < 20 || w > 300) return;
    startTransition(async () => {
      await logWeight(w);
      setWeightInput("");
      setWeightSaved(true);
      setTimeout(() => setWeightSaved(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Settings</h2>

      {/* Profile form */}
      <div className="rounded-2xl border border-border/50 bg-bg-card p-5 shadow-card">
        <form action={handleProfileSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-subtle">
              <User size={14} className="text-accent" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Profile
            </span>
          </div>

          <Input
            label="Name"
            name="name"
            defaultValue={profile?.name || ""}
          />
          <Input
            label="Email"
            value={email}
            disabled
            className="opacity-50"
          />
          <Input
            label="Target Weight (kg)"
            name="targetWeight"
            type="number"
            step="0.1"
            defaultValue={profile?.target_weight_kg?.toString() || "80"}
          />
          <Input
            label="Gym Start Time"
            name="gymStartTime"
            type="time"
            defaultValue={profile?.gym_start_time || "17:30"}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium tracking-wide text-text-muted">
              Preferred Weight Unit
            </label>
            <select
              name="preferredUnit"
              defaultValue={profile?.preferred_weight_unit || "lbs"}
              className="rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all duration-150 min-h-[44px]"
            >
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium tracking-wide text-text-muted">
              Rest Day
            </label>
            <select
              name="restDay"
              defaultValue={profile?.rest_day || 6}
              className="rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all duration-150 min-h-[44px]"
            >
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={7}>Sunday</option>
            </select>
          </div>

          <input
            type="hidden"
            name="timezone"
            value={profile?.timezone || "Asia/Kolkata"}
          />

          <Button type="submit" disabled={isPending}>
            {saved ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check size={14} /> Saved
              </span>
            ) : isPending ? (
              "Saving..."
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>

        <div className="mt-3 pt-3 border-t border-border/30">
          <Button
            variant="secondary"
            fullWidth
            disabled={isPending}
            onClick={() => {
              if (confirm("This will regenerate your workout program with the new rest day. Existing session history is preserved. Continue?")) {
                startTransition(async () => {
                  await regenerateProgram();
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                });
              }
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <RefreshCw size={14} />
              Regenerate Program
            </span>
          </Button>
        </div>
      </div>

      {/* Weight logging */}
      <div className="rounded-2xl border border-border/50 bg-bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-subtle">
            <Scale size={14} className="text-accent" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Log Weight
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            step="0.1"
            min="20"
            max="300"
            placeholder="e.g. 62.5"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1"
          />
          <span className="flex items-center text-xs text-text-muted font-bold">
            kg
          </span>
          <Button
            onClick={handleLogWeight}
            disabled={isPending || !weightInput}
            className="flex-shrink-0"
          >
            {weightSaved ? (
              <span className="flex items-center gap-1">
                <Check size={14} /> Done
              </span>
            ) : (
              "Log"
            )}
          </Button>
        </div>

        {weightLogs.length > 1 && (
          <div className="mt-4">
            <WeightChart data={weightLogs} target={profile?.target_weight_kg || 80} />
          </div>
        )}
      </div>

      {/* Sign out */}
      <form action={signOut}>
        <Button variant="danger" type="submit" fullWidth>
          <span className="flex items-center justify-center gap-1.5">
            <LogOut size={14} />
            Sign Out
          </span>
        </Button>
      </form>
    </div>
  );
}
