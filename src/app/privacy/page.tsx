import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | AI Interview Prep",
  description: "Privacy Policy for AI Interview Prep",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Privacy Policy will be available here. This is a placeholder for the
          MVP.
        </p>
      </div>
    </div>
  );
}
