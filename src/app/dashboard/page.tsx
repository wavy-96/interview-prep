import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";

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
    .select("full_name, credits, experience_level")
    .eq("id", user.id)
    .single();

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
            Welcome, {displayName}. Your dashboard will show practice sessions
            and progress here.
          </p>
          {profile && (
            <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
              <p className="text-body-sm text-ink">
                <span className="font-medium">Credits:</span> {profile.credits}
              </p>
              {profile.experience_level && (
                <p className="mt-1 text-body-sm text-ink-muted">
                  <span className="font-medium">Level:</span>{" "}
                  {profile.experience_level}
                </p>
              )}
            </div>
          )}
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
                  No problems yet. Check back soon.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
