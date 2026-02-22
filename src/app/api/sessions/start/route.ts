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
    const problemId = body.problemId as string | undefined;
    const language = ["python", "javascript", "java"].includes(body.language)
      ? body.language
      : "python";

    if (!problemId || typeof problemId !== "string") {
      return NextResponse.json(
        { error: "problemId is required" },
        { status: 400 }
      );
    }

    // Validate UUID format to prevent invalid IDs from reaching the RPC
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: "Invalid problemId format" },
        { status: 400 }
      );
    }

    // Verify the problem exists before starting the session
    const { data: problemExists, error: problemError } = await supabase
      .from("problems")
      .select("id")
      .eq("id", problemId)
      .single();

    if (problemError || !problemExists) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase.rpc("start_interview_session", {
      p_user_id: user.id,
      p_problem_id: problemId,
      p_language: language,
    });

    if (error) {
      console.error("Session start RPC error:", error.message);
      return NextResponse.json(
        { error: "Failed to start session" },
        { status: 500 }
      );
    }

    if (data?.error) {
      if (data.error === "Insufficient credits") {
        return NextResponse.json(
          { error: "Insufficient credits", credits: data.credits ?? 0 },
          { status: 402 }
        );
      }
      if (data.error === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }

    const wsToken = await createWsToken(user.id, data.sessionId);

    return NextResponse.json(
      {
        sessionId: data.sessionId,
        problem: data.problem,
        wsToken: wsToken
          ? { token: wsToken.token, wsUrl: wsToken.wsUrl, expiresIn: wsToken.expiresIn }
          : null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("POST /api/sessions/start error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
