import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Play, Clock, Trophy } from "lucide-react";

export const metadata = {
  title: "Dashboard | AI Interview Prep",
  description: "Your interview practice dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, credits, experience_level, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      `
      id,
      status,
      created_at,
      started_at,
      ended_at,
      duration_seconds,
      test_cases_passed,
      test_cases_total,
      problems (slug, title, difficulty, category),
      evaluations (overall_score, hiring_recommendation, created_at)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: problems } = await supabase
    .from("problems")
    .select("id, slug, title, difficulty, category")
    .order("created_at", { ascending: false })
    .limit(10);

  const displayName = profile?.full_name ?? user.email ?? "User";

  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <h1
            className="font-serif text-2xl font-medium text-ink"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Dashboard
          </h1>
          <LogoutButton />
        </header>
        <div className="space-y-6">
          <p className="text-body-sm text-ink-muted">
            Welcome, {displayName}. Practice technical interviews with AI.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
              <p className="text-body-sm text-ink">
                <span className="font-medium">Credits:</span> {profile?.credits ?? 0}
              </p>
              {profile?.experience_level && (
                <p className="mt-1 text-body-sm text-ink-muted">
                  <span className="font-medium">Level:</span>{" "}
                  {profile.experience_level}
                </p>
              )}
            </div>
            <Link
              href="/dashboard/start"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-clay px-4 py-3 font-medium text-white transition-colors hover:bg-brand-clay/90"
            >
              <Play className="h-4 w-4" />
              Start Interview
            </Link>
          </div>

          <section>
            <h2
              className="mb-3 font-serif text-lg font-medium text-ink"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              Past Sessions
            </h2>
            {sessions && sessions.length > 0 ? (
              <ul className="space-y-2">
                {sessions.map((s) => {
                  const problemsData = s.problems as
                    | { slug: string; title: string; difficulty: string; category?: string[] }
                    | { slug: string; title: string; difficulty: string; category?: string[] }[]
                    | null;
                  const problem = Array.isArray(problemsData)
                    ? problemsData[0]
                    : problemsData;
                  const evaluationsData = s.evaluations as
                    | { overall_score: number | null; hiring_recommendation: string | null; created_at: string }
                    | { overall_score: number | null; hiring_recommendation: string | null; created_at: string }[]
                    | null;
                  const evaluation = Array.isArray(evaluationsData)
                    ? evaluationsData.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
                    : evaluationsData;
                  const date = s.started_at
                    ? new Date(s.started_at).toLocaleDateString()
                    : new Date(s.created_at).toLocaleDateString();
                  const duration =
                    s.duration_seconds != null
                      ? `${Math.floor(s.duration_seconds / 60)}m ${s.duration_seconds % 60}s`
                      : null;

                  return (
                    <li key={s.id}>
                      <Link
                        href={`/sessions/${s.id}`}
                        className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-paper-hover sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-ink">
                            {problem?.title ?? "Unknown problem"}
                          </span>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-ink-muted">
                            {problem?.difficulty && (
                              <Badge
                                variant={
                                  problem.difficulty === "easy"
                                    ? "default"
                                    : problem.difficulty === "medium"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-caption"
                              >
                                {problem.difficulty}
                              </Badge>
                            )}
                            <span>{date}</span>
                            {duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {duration}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {evaluation?.overall_score != null ? (
                            <span className="flex items-center gap-1 text-body-sm font-medium text-ink">
                              <Trophy className="h-4 w-4 text-brand-clay" />
                              {evaluation.overall_score}/100
                            </span>
                          ) : s.status === "completed" ? (
                            <Badge variant="outline" className="text-caption">
                              Evaluating…
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                s.status === "active"
                                  ? "default"
                                  : s.status === "abandoned"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="text-caption"
                            >
                              {s.status}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-paper-hover/50 py-12 text-center">
                <FolderOpen className="mb-3 h-10 w-10 text-ink-faint" />
                <p className="text-body-sm text-ink-muted">
                  No sessions yet. Start your first interview!
                </p>
                <Link
                  href="/dashboard/start"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-clay px-4 py-2 text-sm font-medium text-white hover:bg-brand-clay/90"
                >
                  <Play className="h-4 w-4" />
                  Start Interview
                </Link>
              </div>
            )}
          </section>

          <section>
            <h2
              className="mb-3 font-serif text-lg font-medium text-ink"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              Practice Problems
            </h2>
            {problems && problems.length > 0 ? (
              <ul className="space-y-2">
                {problems.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/problems/${p.slug}`}
                      className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-paper-hover"
                    >
                      <span className="font-medium text-ink">{p.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            p.difficulty === "easy"
                              ? "default"
                              : p.difficulty === "medium"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-caption"
                        >
                          {p.difficulty}
                        </Badge>
                        {p.category?.[0] && (
                          <span className="text-caption text-ink-muted">
                            {p.category[0]}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-paper-hover/50 py-12 text-center">
                <FolderOpen className="mb-3 h-10 w-10 text-ink-faint" />
                <p className="text-body-sm text-ink-muted">
                  No problems yet. Run <code className="rounded bg-code-bg px-1 py-0.5 font-mono text-caption">npm run db:seed</code> to seed problems.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
