import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StartInterviewForm } from "./start-interview-form";

export const metadata = {
  title: "Start Interview | AI Interview Prep",
  description: "Select a problem and start your practice interview",
};

function pickDeterministicIndex(seed: string, length: number): number {
  if (length <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

export default async function StartInterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string; category?: string; _t?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/start");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const { difficulty, category, _t } = params;
  const hasFilters = !!difficulty || !!category;

  let problem = null;
  if (hasFilters) {
    let query = supabase
      .from("problems")
      .select("id, slug, title, description, difficulty, category, starter_code")
      .limit(50);

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      query = query.eq("difficulty", difficulty);
    }
    if (category?.trim()) {
      query = query.contains("category", [category.trim()]);
    }

    const { data: problems } = await query;
    if (problems && problems.length > 0) {
      const seed = _t?.trim() || `${difficulty ?? ""}:${category ?? ""}`;
      const selectedIndex = pickDeterministicIndex(seed, problems.length);
      problem = problems[selectedIndex];
    }
  }

  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-2xl">
        <h1
          className="mb-6 font-serif text-2xl font-medium text-ink"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Start Interview
        </h1>

        <p className="mb-6 text-body-sm text-ink-muted">
          You have <strong>{profile?.credits ?? 0} credits</strong>. Each
          interview uses 1 credit.
        </p>

        {(profile?.credits ?? 0) < 1 && (
          <div className="mb-6 rounded-lg border border-status-warning/50 bg-status-warning/10 px-4 py-3 text-body-sm text-ink">
            You need at least 1 credit to start an interview. Get more credits
            from the billing page.
          </div>
        )}

        <StartInterviewForm
          initialDifficulty={difficulty}
          initialCategory={category}
          problem={problem}
          disabled={(profile?.credits ?? 0) < 1}
        />
      </div>
    </div>
  );
}
