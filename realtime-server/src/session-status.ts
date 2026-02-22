import { getSupabase } from "./supabase.js";

export async function markSessionErrored(sessionId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("sessions")
    .update({ status: "errored", updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function markSessionCompleted(sessionId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const now = new Date().toISOString();
  const { data: session } = await supabase
    .from("sessions")
    .select("started_at, status")
    .eq("id", sessionId)
    .single();

  // Only complete sessions that are still active — avoids race with REST endpoint
  if (!session || session.status !== "active") return;

  const startedAt = session.started_at ? new Date(session.started_at).getTime() : Date.now();
  const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);
  await supabase
    .from("sessions")
    .update({
      status: "completed",
      ended_at: now,
      duration_seconds: durationSeconds,
      updated_at: now,
    })
    .eq("id", sessionId)
    .eq("status", "active"); // double-guard at DB level
}
