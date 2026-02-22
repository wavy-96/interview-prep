import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("problems")
    .select("title")
    .eq("slug", slug)
    .single();

  return {
    title: data?.title ? `${data.title} | AI Interview Prep` : "Problem | AI Interview Prep",
    description: data?.title ? `Practice ${data.title}` : "Practice problem",
  };
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: problem, error } = await supabase
    .from("problems")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !problem) {
    notFound();
  }

  const { data: testCases } = await supabase
    .from("test_cases")
    .select("id, input, expected_output, explanation, order_index")
    .eq("problem_id", problem.id)
    .eq("is_example", true)
    .eq("is_hidden", false)
    .order("order_index", { ascending: true, nullsFirst: false });

  const starterCode = problem.starter_code as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-body-sm text-brand-clay hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <header className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                problem.difficulty === "easy"
                  ? "default"
                  : problem.difficulty === "medium"
                    ? "secondary"
                    : "outline"
              }
            >
              {problem.difficulty}
            </Badge>
            {problem.category?.map((c: string) => (
              <Badge key={c} variant="outline">
                {c}
              </Badge>
            ))}
          </div>
          <h1
            className="font-serif text-2xl font-medium text-ink"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            {problem.title}
          </h1>
        </header>
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 font-medium text-ink">Description</h2>
            <pre className="whitespace-pre-wrap rounded-lg border border-border-subtle bg-surface p-4 font-sans text-body-sm text-ink">
              {problem.description}
            </pre>
          </section>
          {testCases && testCases.length > 0 && (
            <section>
              <h2 className="mb-2 font-medium text-ink">Examples</h2>
              <div className="space-y-3">
                {testCases.map((tc, i) => (
                  <div
                    key={tc.id}
                    className="rounded-lg border border-border-subtle bg-surface p-4"
                  >
                    <p className="mb-1 text-caption font-medium text-ink-muted">
                      Example {i + 1}
                    </p>
                    <div className="text-body-sm">
                      <span className="font-medium">Input:</span>{" "}
                      <code className="rounded bg-code-bg px-1 py-0.5 font-mono text-caption text-white whitespace-pre-wrap block p-2 mt-1">
                        {JSON.stringify(tc.input, null, 2)}
                      </code>
                    </div>
                    <div className="mt-2 text-body-sm">
                      <span className="font-medium">Output:</span>{" "}
                      <code className="rounded bg-code-bg px-1 py-0.5 font-mono text-caption text-white whitespace-pre-wrap block p-2 mt-1">
                        {JSON.stringify(tc.expected_output, null, 2)}
                      </code>
                    </div>
                    {tc.explanation && (
                      <p className="mt-2 text-body-sm text-ink-muted">
                        {tc.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {starterCode && Object.keys(starterCode).length > 0 && (
            <section>
              <h2 className="mb-2 font-medium text-ink">Starter Code</h2>
              <div className="space-y-3">
                {Object.entries(starterCode).map(([lang, code]) => (
                  <div key={lang}>
                    <p className="mb-1 text-caption font-medium text-ink-muted">
                      {lang === "python"
                        ? "Python"
                        : lang === "javascript"
                          ? "JavaScript"
                          : lang === "java"
                            ? "Java"
                            : lang}
                    </p>
                    <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-code-bg p-4 font-mono text-caption text-white">
                      <code>{code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
