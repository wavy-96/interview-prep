import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SummaryClient } from "./summary-client";

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
  if (!user) return { title: "Summary | AI Interview Prep" };

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
      ? `${problem.title} — Summary | AI Interview Prep`
      : "Summary | AI Interview Prep",
  };
}

export default async function SummaryPage({
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
    redirect(`/login?redirect=/sessions/${sessionId}/summary`);
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
      problems (id, slug, title, difficulty),
      evaluations (*)
    `
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error || !session) {
    notFound();
  }

  if (session.status !== "completed") {
    redirect(`/sessions/${sessionId}`);
  }

  const problemsData = session.problems;
  const problem = (
    Array.isArray(problemsData) ? problemsData[0] : problemsData
  ) as { id: string; slug: string; title: string; difficulty: string } | null;

  const evaluationsData = session.evaluations;
  const evaluation = (
    Array.isArray(evaluationsData) ? evaluationsData[0] : evaluationsData
  ) as {
    evaluation_status?: string;
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

        <SummaryClient
          sessionId={sessionId}
          problem={problem}
          duration={duration}
          startedAt={session.started_at}
          testCasesPassed={session.test_cases_passed ?? 0}
          testCasesTotal={session.test_cases_total ?? 0}
          initialEvaluation={evaluation}
        />
      </div>
    </div>
  );
}
