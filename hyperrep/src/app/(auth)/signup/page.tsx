"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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
    <Card className="p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="text-accent">HYPER</span>REP
        </h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-text-muted">
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
          placeholder="••••••••"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
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
          <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
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
    </Card>
  );
}
