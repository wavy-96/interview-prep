import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { InterviewWsProvider } from "./interview-ws-context";
import { InterviewClient } from "./interview-client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  if (!UUID_RE.test(sessionId)) notFound();

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

  return (
    <InterviewWsProvider sessionId={sessionId}>
      <InterviewClient
        sessionId={sessionId}
        language={(session.language as string) ?? "python"}
        problem={problem}
      />
    </InterviewWsProvider>
  );
}
