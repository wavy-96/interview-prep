import { Suspense } from "react";
import { SignupForm } from "@/app/signup/signup-form";

export const metadata = {
  title: "Sign up | AI Interview Prep",
  description: "Create an account to start practicing",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md">
        <h1
          className="mb-2 font-serif text-[1.875rem] font-medium text-ink"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Sign up
        </h1>
        <p className="mb-6 text-body-sm text-ink-muted">
          Create an account to start practicing
        </p>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-border-subtle" />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
