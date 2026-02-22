"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  category?: string[];
  starter_code?: Record<string, string>;
}

interface StartInterviewFormProps {
  initialDifficulty?: string;
  initialCategory?: string;
  problem: Problem | null;
  disabled: boolean;
}

export function StartInterviewForm({
  initialDifficulty,
  initialCategory,
  problem,
  disabled,
}: StartInterviewFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"python" | "javascript" | "java">("python");

  const handleGetProblem = () => {
    const params = new URLSearchParams();
    if (initialDifficulty) params.set("difficulty", initialDifficulty);
    if (initialCategory) params.set("category", initialCategory);
    params.set("_t", Date.now().toString());
    router.push(`/dashboard/start?${params.toString()}`);
    router.refresh();
  };

  const handleStart = async () => {
    if (!problem || disabled) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast.error("Insufficient credits");
          router.refresh();
          return;
        }
        throw new Error(data.error ?? "Failed to start session");
      }

      toast.success("Interview started!");
      router.push(`/interview/${data.sessionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-body-sm text-brand-clay hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h2 className="mb-2 font-medium text-ink">Filters</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/start"
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              !initialDifficulty && !initialCategory
                ? "border-brand-clay bg-brand-clay/10 text-brand-clay"
                : "border-border-subtle text-ink-muted hover:bg-paper-hover"
            }`}
          >
            Any
          </Link>
          {["easy", "medium", "hard"].map((d) => (
            <Link
              key={d}
              href={`/dashboard/start?difficulty=${d}`}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                initialDifficulty === d
                  ? "border-brand-clay bg-brand-clay/10 text-brand-clay"
                  : "border-border-subtle text-ink-muted hover:bg-paper-hover"
              }`}
            >
              {d}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <Button
          variant="outline"
          onClick={handleGetProblem}
          disabled={disabled}
          className="mb-4"
        >
          Get Random Problem
        </Button>

        {problem ? (
          <div className="rounded-lg border border-border-subtle bg-surface p-4">
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
              {problem.category?.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
            <h3 className="font-medium text-ink">{problem.title}</h3>
            <p className="mt-2 line-clamp-3 text-body-sm text-ink-muted">
              {problem.description}
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div>
                <label className="mb-1 block text-caption font-medium text-ink-muted">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as "python" | "javascript" | "java")
                  }
                  className="rounded border border-border-subtle bg-paper px-3 py-2 text-body-sm text-ink"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <Button
                onClick={handleStart}
                disabled={disabled || loading}
                className="mt-4 sm:mt-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting…
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-body-sm text-ink-muted">
            Click &quot;Get Random Problem&quot; to see a problem, then start your
            interview.
          </p>
        )}
      </div>
    </div>
  );
}
