import Link from "next/link";

export const metadata = {
  title: "Terms of Service | AI Interview Prep",
  description: "Terms of Service for AI Interview Prep",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-body-sm text-brand-clay hover:underline"
        >
          ← Back to home
        </Link>
        <h1
          className="mt-8 font-serif text-2xl font-medium text-ink"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Terms of Service
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Terms of Service will be available here. This is a placeholder for the
          MVP.
        </p>
      </div>
    </div>
  );
}
