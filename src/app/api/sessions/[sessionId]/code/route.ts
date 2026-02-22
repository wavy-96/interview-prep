import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_CODE_SIZE = 50 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
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

    const body = await request.json().catch(() => ({}));
    const code = body.code as string | undefined;
    const language = body.language as string | undefined;
    const timestampMs = body.timestamp_ms as number | undefined;
    const snapshotType = ["auto", "manual", "execution", "final"].includes(
      body.snapshot_type
    )
      ? body.snapshot_type
      : "auto";

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "code is required and must be a string" },
        { status: 400 }
      );
    }

    const codeSize = new TextEncoder().encode(code).length;
    if (codeSize > MAX_CODE_SIZE) {
      return NextResponse.json(
        { error: "Code exceeds 50KB limit", size: codeSize },
        { status: 413 }
      );
    }

    const validLanguage = ["python", "javascript", "java"].includes(
      language ?? ""
    )
      ? (language as "python" | "javascript" | "java")
      : "python";

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, status")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      if (sessionError?.code === "PGRST116") {
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

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Session is not active", status: session.status },
        { status: 400 }
      );
    }

    // Rate limit auto snapshots to max 1 per 10 seconds.
    // Note: This check-then-insert is not atomic, so concurrent requests could
    // bypass the limit. For production, consider a database constraint or
    // Redis-based rate limiter for strict enforcement.
    if (snapshotType === "auto") {
      const { data: lastAuto } = await supabase
        .from("code_snapshots")
        .select("created_at")
        .eq("session_id", sessionId)
        .eq("snapshot_type", "auto")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastAuto) {
        const elapsed = Date.now() - new Date(lastAuto.created_at).getTime();
        if (elapsed < 10_000) {
          return NextResponse.json(
            { error: "Rate limited: max 1 auto snapshot per 10 seconds" },
            { status: 429 }
          );
        }
      }
    }

    const { data: snapshot, error } = await supabase
      .from("code_snapshots")
      .insert({
        session_id: sessionId,
        code,
        language: validLanguage,
        timestamp_ms: typeof timestampMs === "number" ? timestampMs : Date.now(),
        snapshot_type: snapshotType,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Code snapshot insert error:", error.message);
      return NextResponse.json(
        { error: "Failed to save code snapshot" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshotId: snapshot.id,
      created_at: snapshot.created_at,
    });
  } catch (err) {
    console.error("POST /api/sessions/[sessionId]/code error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
