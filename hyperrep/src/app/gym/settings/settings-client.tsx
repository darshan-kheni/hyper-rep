"use client";

import { useState, useTransition } from "react";
import { updateProfile, logWeight } from "@/lib/gym/actions";
import { signOut } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { WeightChart } from "@/components/gym/WeightChart";

type Profile = {
  id: string;
  name: string | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  gym_start_time: string | null;
  preferred_weight_unit: string | null;
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
      <Card>
        <form action={handleProfileSubmit} className="flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
            Profile
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
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Preferred Weight Unit
            </label>
            <select
              name="preferredUnit"
              defaultValue={profile?.preferred_weight_unit || "lbs"}
              className="rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          <input
            type="hidden"
            name="timezone"
            value={profile?.timezone || "Asia/Kolkata"}
          />

          <Button type="submit" disabled={isPending}>
            {saved ? "Saved!" : isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      {/* Weight logging */}
      <Card>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          Log Today's Weight
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
            {weightSaved ? "Logged!" : "Log"}
          </Button>
        </div>

        {/* Weight chart */}
        {weightLogs.length > 1 && (
          <div className="mt-4">
            <WeightChart data={weightLogs} target={profile?.target_weight_kg || 80} />
          </div>
        )}
      </Card>

      {/* Sign out */}
      <form action={signOut}>
        <Button variant="danger" type="submit" fullWidth>
          Sign Out
        </Button>
      </form>
    </div>
  );
}
