import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Trophy } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Session | AI Interview Prep" };

  const { data } = await supabase
    .from("sessions")
    .select("problems(title)")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  const problemsData = data?.problems;
  const problem = problemsData
    ? Array.isArray(problemsData)
      ? problemsData[0]
      : (problemsData as { title: string })
    : null;
  return {
    title: problem?.title
      ? `${problem.title} | Session | AI Interview Prep`
      : "Session | AI Interview Prep",
  };
}

export default async function SessionPage({
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
    redirect(`/login?redirect=/sessions/${sessionId}`);
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      status,
      language,
      started_at,
      ended_at,
      duration_seconds,
      hints_used,
      test_cases_passed,
      test_cases_total,
      credits_consumed,
      created_at,
      problems (id, slug, title, description, difficulty, category),
      evaluations (*)
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
  } | null;

  const evaluationsData = session.evaluations;
  const evaluation = (
    Array.isArray(evaluationsData) ? evaluationsData[0] : evaluationsData
  ) as {
    overall_score: number | null;
    problem_solving_score: number | null;
    code_quality_score: number | null;
    communication_score: number | null;
    efficiency_score: number | null;
    problem_solving_feedback: string | null;
    code_quality_feedback: string | null;
    communication_feedback: string | null;
    efficiency_feedback: string | null;
    strengths: string[] | null;
    improvements: string[] | null;
    hiring_recommendation: string | null;
    detailed_report: string | null;
  } | null;

  const duration =
    session.duration_seconds != null
      ? `${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`
      : null;

  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-body-sm text-brand-clay hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                session.status === "completed"
                  ? "default"
                  : session.status === "active"
                    ? "secondary"
                    : "outline"
              }
            >
              {session.status}
            </Badge>
            {problem?.difficulty && (
              <Badge variant="outline">{problem.difficulty}</Badge>
            )}
            {duration && (
              <span className="flex items-center gap-1 text-caption text-ink-muted">
                <Clock className="h-3 w-3" />
                {duration}
              </span>
            )}
          </div>
          <h1
            className="font-serif text-2xl font-medium text-ink"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            {problem?.title ?? "Session"}
          </h1>
          {session.started_at && (
            <p className="mt-1 text-body-sm text-ink-muted">
              {new Date(session.started_at).toLocaleString()}
            </p>
          )}
        </header>

        <div className="space-y-6">
          {session.status === "completed" && session.test_cases_total > 0 && (
            <section className="rounded-lg border border-border-subtle bg-surface p-4">
              <h2 className="mb-2 font-medium text-ink">Test Results</h2>
              <p className="text-body-sm text-ink">
                {session.test_cases_passed} / {session.test_cases_total} test
                cases passed
              </p>
            </section>
          )}

          {evaluation && (
            <section className="rounded-lg border border-border-subtle bg-surface p-4">
              <h2 className="mb-3 flex items-center gap-2 font-medium text-ink">
                <Trophy className="h-4 w-4 text-brand-clay" />
                Evaluation
              </h2>
              {evaluation.overall_score != null ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-ink">
                      {evaluation.overall_score}
                    </span>
                    <span className="text-ink-muted">/ 100</span>
                    {evaluation.hiring_recommendation && (
                      <Badge variant="secondary" className="ml-2">
                        {evaluation.hiring_recommendation.replace("-", " ")}
                      </Badge>
                    )}
                  </div>
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div>
                      <h3 className="mb-1 text-caption font-medium text-ink-muted">
                        Strengths
                      </h3>
                      <ul className="list-inside list-disc space-y-1 text-body-sm text-ink">
                        {evaluation.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.improvements && evaluation.improvements.length > 0 && (
                    <div>
                      <h3 className="mb-1 text-caption font-medium text-ink-muted">
                        Areas to Improve
                      </h3>
                      <ul className="list-inside list-disc space-y-1 text-body-sm text-ink">
                        {evaluation.improvements.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.detailed_report && (
                    <div>
                      <h3 className="mb-1 text-caption font-medium text-ink-muted">
                        Detailed Report
                      </h3>
                      <pre className="whitespace-pre-wrap rounded border border-border-subtle bg-paper p-4 text-body-sm text-ink">
                        {evaluation.detailed_report}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-body-sm text-ink-muted">
                  Evaluation is being generated…
                </p>
              )}
            </section>
          )}

          {problem && (
            <section className="rounded-lg border border-border-subtle bg-surface p-4">
              <h2 className="mb-2 font-medium text-ink">Problem</h2>
              <Link
                href={`/problems/${problem.slug}`}
                className="text-body-sm text-brand-clay hover:underline"
              >
                View {problem.title} →
              </Link>
            </section>
          )}

          <Link
            href="/dashboard/start"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-clay px-4 py-2 text-sm font-medium text-white hover:bg-brand-clay/90"
          >
            Practice Again
          </Link>
        </div>
      </div>
    </div>
  );
}
