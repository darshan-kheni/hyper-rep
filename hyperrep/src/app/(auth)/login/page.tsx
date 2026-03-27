"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await login(formData);
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
          60 → 80 KG
        </p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
        />

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </Card>
  );
}
