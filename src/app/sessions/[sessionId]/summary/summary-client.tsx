"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Badge } from "@/components/ui/badge";
import { Trophy, Loader2, AlertCircle } from "lucide-react";

const POLL_INTERVAL_MS = 3000;

interface Evaluation {
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
}

interface SummaryClientProps {
  sessionId: string;
  problem: { id: string; slug: string; title: string; difficulty: string } | null;
  duration: string | null;
  startedAt: string | null;
  testCasesPassed: number;
  testCasesTotal: number;
  initialEvaluation: Evaluation | null;
}

function ScoreCard({
  label,
  score,
  feedback,
}: {
  label: string;
  score: number | null;
  feedback: string | null;
}) {
  if (score == null) return null;
  return (
    <div className="rounded-lg border border-border-subtle bg-paper p-3">
      <div className="text-caption font-medium text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{score}/10</div>
      {feedback && (
        <p className="mt-1 text-body-sm text-ink-muted">{feedback}</p>
      )}
    </div>
  );
}

export function SummaryClient({
  sessionId,
  problem,
  duration,
  startedAt,
  testCasesPassed,
  testCasesTotal,
  initialEvaluation,
}: SummaryClientProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(initialEvaluation);

  const shouldPoll = useCallback(() => {
    if (!evaluation) return true;
    if (evaluation.evaluation_status === "completed") return false;
    if (evaluation.evaluation_status === "failed") return false;
    return true;
  }, [evaluation]);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      const ev = Array.isArray(data.evaluations)
        ? data.evaluations[0]
        : data.evaluations;
      if (ev) {
        setEvaluation(ev);
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    if (!shouldPoll()) return;
    const id = setInterval(fetchSession, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [shouldPoll, fetchSession]);

  const isComplete = evaluation?.evaluation_status === "completed";
  const isFailed = evaluation?.evaluation_status === "failed";
  const isPending = !evaluation || (shouldPoll() && !isComplete && !isFailed);

  return (
    <>
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {problem?.difficulty && (
            <Badge variant="outline">{problem.difficulty}</Badge>
          )}
          {duration && (
            <span className="text-caption text-ink-muted">{duration}</span>
          )}
        </div>
        <h1
          className="font-serif text-2xl font-medium text-ink"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          {problem?.title ?? "Session Summary"}
        </h1>
        {startedAt && (
          <p className="mt-1 text-body-sm text-ink-muted">
            {new Date(startedAt).toLocaleString()}
          </p>
        )}
      </header>

      <div className="space-y-6">
        {testCasesTotal > 0 && (
          <section className="rounded-lg border border-border-subtle bg-surface p-4">
            <h2 className="mb-2 font-medium text-ink">Test Results</h2>
            <p className="text-body-sm text-ink">
              {testCasesPassed} / {testCasesTotal} test cases passed
            </p>
          </section>
        )}

        {isPending && (
          <section className="rounded-lg border border-border-subtle bg-surface p-6">
            <div className="flex items-center gap-3 text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-body-sm">Generating evaluation…</span>
            </div>
          </section>
        )}

        {isFailed && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Evaluation failed</span>
            </div>
            <p className="mt-1 text-body-sm text-red-600 dark:text-red-500">
              {evaluation?.detailed_report ?? "Unable to generate evaluation."}
            </p>
          </section>
        )}

        {isComplete && evaluation && (
          <section className="rounded-lg border border-border-subtle bg-surface p-4">
            <h2 className="mb-4 flex items-center gap-2 font-medium text-ink">
              <Trophy className="h-4 w-4 text-brand-clay" />
              Evaluation
            </h2>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {evaluation.overall_score != null && (
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-semibold text-ink">
                    {evaluation.overall_score}
                  </span>
                  <span className="text-ink-muted">/ 100</span>
                </div>
              )}
              {evaluation.hiring_recommendation && (
                <Badge variant="secondary" className="capitalize">
                  {evaluation.hiring_recommendation.replace(/-/g, " ")}
                </Badge>
              )}
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreCard
                label="Problem Solving"
                score={evaluation.problem_solving_score}
                feedback={evaluation.problem_solving_feedback}
              />
              <ScoreCard
                label="Code Quality"
                score={evaluation.code_quality_score}
                feedback={evaluation.code_quality_feedback}
              />
              <ScoreCard
                label="Communication"
                score={evaluation.communication_score}
                feedback={evaluation.communication_feedback}
              />
              <ScoreCard
                label="Efficiency"
                score={evaluation.efficiency_score}
                feedback={evaluation.efficiency_feedback}
              />
            </div>

            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div className="mb-4">
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
              <div className="mb-4">
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
                <h3 className="mb-2 text-caption font-medium text-ink-muted">
                  Detailed Report
                </h3>
                <div className="prose prose-sm max-w-none rounded border border-border-subtle bg-paper p-4 text-ink prose-headings:text-ink prose-p:text-ink prose-li:text-ink prose-strong:text-ink">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                    {evaluation.detailed_report}
                  </ReactMarkdown>
                </div>
              </div>
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
    </>
  );
}
