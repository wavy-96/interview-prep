import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
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

    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("id, user_id, status, started_at")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      if (fetchError?.code === "PGRST116") {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.status !== "active" && session.status !== "scheduled") {
      return NextResponse.json(
        { error: "Session already ended", status: session.status },
        { status: 400 }
      );
    }

    const endedAt = new Date();
    const startedAt = session.started_at
      ? new Date(session.started_at)
      : endedAt;
    const durationSeconds = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / 1000
    );

    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        status: "completed",
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        updated_at: endedAt.toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Session end update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to end session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId,
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    });
  } catch (err) {
    console.error("POST /api/sessions/[sessionId]/end error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
