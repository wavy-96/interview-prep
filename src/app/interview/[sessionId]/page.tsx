import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic, Code, Clock } from "lucide-react";
import { EndInterviewButton } from "./end-interview-button";
import { InterviewVoiceClient } from "./interview-voice-client";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/interview/${sessionId}`);
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      status,
      language,
      started_at,
      problems (id, slug, title, description, difficulty, category, starter_code)
    `
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error || !session) {
    notFound();
  }

  const problemsData = session.problems;
  const problem = (
    Array.isArray(problemsData) ? problemsData[0] : problemsData
  ) as {
    id: string;
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    category?: string[];
    starter_code?: Record<string, string>;
  } | null;

  const starterCode = problem?.starter_code?.[session.language] ?? problem?.starter_code?.python ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border-subtle bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-body-sm text-brand-clay hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-caption text-ink-muted">
              <Clock className="h-4 w-4" />
              Session in progress
            </span>
            <Badge variant="secondary">{session.status}</Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <InterviewVoiceClient sessionId={sessionId} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-border-subtle bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 font-medium text-ink">
              <Mic className="h-4 w-4" />
              Problem
            </h2>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge
                variant={
                  problem?.difficulty === "easy"
                    ? "default"
                    : problem?.difficulty === "medium"
                      ? "secondary"
                      : "outline"
                }
              >
                {problem?.difficulty}
              </Badge>
              {problem?.category?.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
            <h3 className="font-serif text-lg font-medium text-ink">
              {problem?.title}
            </h3>
            <pre className="mt-3 whitespace-pre-wrap text-body-sm text-ink-muted">
              {problem?.description}
            </pre>
          </section>

          <section className="rounded-lg border border-border-subtle bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 font-medium text-ink">
              <Code className="h-4 w-4" />
              Starter Code ({session.language})
            </h2>
            <pre className="overflow-x-auto rounded border border-border-subtle bg-code-bg p-4 font-mono text-caption text-white">
              <code>{starterCode || "// No starter code"}</code>
            </pre>
          </section>
        </div>

        <div className="mt-6 flex gap-4">
          <Link
            href={`/sessions/${sessionId}`}
            className="rounded-lg border border-border-subtle px-4 py-2 text-body-sm font-medium text-ink hover:bg-paper-hover"
          >
            View Session
          </Link>
          <EndInterviewButton sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
