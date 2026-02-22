import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: "Valid sessionId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        user_id,
        problem_id,
        status,
        difficulty_override,
        language,
        started_at,
        ended_at,
        duration_seconds,
        hints_used,
        test_cases_passed,
        test_cases_total,
        credits_consumed,
        metadata,
        created_at,
        updated_at,
        problems (id, slug, title, description, difficulty, category, starter_code, hints),
        evaluations (*)
      `
      )
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      if (error?.code === "PGRST116") {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      console.error("Session fetch error:", error?.message);
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: latestSnapshot } = await supabase
      .from("code_snapshots")
      .select("id, code, language, timestamp_ms, snapshot_type, created_at")
      .eq("session_id", sessionId)
      .order("timestamp_ms", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      ...session,
      latest_code_snapshot: latestSnapshot ?? null,
    });
  } catch (err) {
    console.error("GET /api/sessions/[sessionId] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
