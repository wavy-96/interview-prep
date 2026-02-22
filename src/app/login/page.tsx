import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export const metadata = {
  title: "Log in | AI Interview Prep",
  description: "Log in to your account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md">
        <h1
          className="mb-2 font-serif text-[1.875rem] font-medium text-ink"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Log in
        </h1>
        <p className="mb-6 text-body-sm text-ink-muted">
          Sign in to continue practicing
        </p>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-border-subtle" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
