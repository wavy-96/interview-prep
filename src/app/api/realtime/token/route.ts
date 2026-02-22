import { createClient } from "@/lib/supabase/server";
import { createWsToken } from "@/lib/realtime-token";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = body.sessionId as string | undefined;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: "Invalid sessionId format" },
        { status: 400 }
      );
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("user_id, status")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Session is not active", status: session.status },
        { status: 400 }
      );
    }

    const wsToken = await createWsToken(user.id, sessionId);
    if (!wsToken) {
      return NextResponse.json(
        { error: "Realtime token not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        token: wsToken.token,
        wsUrl: wsToken.wsUrl,
        expiresIn: wsToken.expiresIn,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("POST /api/realtime/token error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
