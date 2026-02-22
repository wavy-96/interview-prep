"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-md border border-status-success/50 bg-status-success/10 px-3 py-2 text-body-sm text-status-success"
          role="status"
        >
          Check your email to confirm your account.
        </div>
        <p className="text-body-sm text-ink-muted">
          We sent a confirmation link to <strong>{email}</strong>. Click the
          link to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="rounded-md border border-status-error/50 bg-status-error/10 px-3 py-2 text-body-sm text-status-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1"
          />
          <p className="mt-1 text-caption text-ink-muted">
            At least 6 characters
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-body-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-clay hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
