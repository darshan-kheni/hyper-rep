"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dumbbell } from "lucide-react";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-bg-card p-8 shadow-elevated">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle">
          <Dumbbell size={24} className="text-accent" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          <span className="text-accent drop-shadow-[0_0_8px_var(--color-accent-glow)]">
            HYPER
          </span>
          <span className="text-text-primary">REP</span>
        </h1>
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-text-muted">
          Create your account
        </p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          name="name"
          type="text"
          placeholder="Your name"
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Min. 6 characters"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Repeat password"
          required
          minLength={6}
          autoComplete="new-password"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Current Weight (kg)"
            name="currentWeight"
            type="number"
            placeholder="60"
            step="0.1"
            min="30"
            max="200"
          />
          <Input
            label="Target Weight (kg)"
            name="targetWeight"
            type="number"
            placeholder="80"
            step="0.1"
            min="30"
            max="200"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-error/10 border border-error/20 px-3 py-2.5 text-xs text-error font-medium">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
