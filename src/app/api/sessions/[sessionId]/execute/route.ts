import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_CODE_SIZE = 50 * 1024;
const MAX_RUNS_PER_MINUTE = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// In-memory rate limit: userId -> timestamps of recent runs
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  let timestamps = rateLimitMap.get(userId) ?? [];
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_RUNS_PER_MINUTE) return false;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return true;
}

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

    const validLanguage = ["python", "javascript", "java"].includes(language ?? "")
      ? (language as "python" | "javascript" | "java")
      : "python";

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, status, problem_id")
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

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Rate limited: max 3 runs per minute" },
        { status: 429 }
      );
    }

    const modalUrl = process.env.MODAL_EXECUTE_URL;
    const modalTokenId = process.env.MODAL_TOKEN_ID;
    const modalTokenSecret = process.env.MODAL_TOKEN_SECRET;

    if (!modalUrl?.trim()) {
      return NextResponse.json(
        {
          error: "Code execution not configured",
          hint: "Deploy Modal execute app and set MODAL_EXECUTE_URL",
        },
        { status: 503 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (modalTokenId && modalTokenSecret) {
      headers["Modal-Key"] = modalTokenId;
      headers["Modal-Secret"] = modalTokenSecret;
    }

    let testCases: Array<{ input: unknown; expected_output: unknown }> = [];
    let functionName: string | null = null;

    if (session.problem_id) {
      const { data: cases } = await supabase
        .from("test_cases")
        .select("input, expected_output")
        .eq("problem_id", session.problem_id)
        .eq("is_example", true)
        .eq("is_hidden", false)
        .order("order_index", { ascending: true, nullsFirst: false });
      testCases = (cases ?? []).map((c) => ({
        input: c.input,
        expected_output: c.expected_output,
      }));

      const { data: problem } = await supabase
        .from("problems")
        .select("starter_code")
        .eq("id", session.problem_id)
        .single();
      const starterCode = (problem?.starter_code as Record<string, string>) ?? {};
      const sc = starterCode[validLanguage] ?? starterCode.python ?? "";
      const defMatch = sc.match(/\bdef\s+(\w+)\s*\(/);
      if (defMatch) functionName = defMatch[1];
      else {
        const fnMatch = sc.match(/\bfunction\s+(\w+)\s*\(/);
        if (fnMatch) functionName = fnMatch[1];
        else {
          const javaMatch = sc.match(/\bpublic\s+\w+\s+(\w+)\s*\(/);
          if (javaMatch) functionName = javaMatch[1];
        }
      }
    }

    const modalBody: Record<string, unknown> = {
      code,
      language: validLanguage,
      timeout: 5,
    };
    if (testCases.length > 0 && functionName && validLanguage === "python") {
      modalBody.test_cases = testCases;
      modalBody.function_name = functionName;
    }

    const res = await fetch(modalUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(modalBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[execute] Modal error:", res.status, errText.slice(0, 300));
      return NextResponse.json(
        { error: "Execution failed", details: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    const result = (await res.json()) as
      | { stdout?: string; stderr?: string; exitCode?: number; duration_ms?: number }
      | { error?: string };

    if ("error" in result && result.error) {
      return NextResponse.json(result, { status: 200 });
    }

    const response: Record<string, unknown> = {
      stdout: (result as { stdout?: string }).stdout ?? "",
      stderr: (result as { stderr?: string }).stderr ?? "",
      exitCode: (result as { exitCode?: number }).exitCode ?? 0,
      duration_ms: (result as { duration_ms?: number }).duration_ms ?? 0,
    };
    if ("testResults" in result && Array.isArray((result as { testResults?: unknown }).testResults)) {
      response.testResults = (result as { testResults: unknown[] }).testResults;
      response.passed = (result as { passed?: number }).passed ?? 0;
      response.total = (result as { total?: number }).total ?? 0;
    }

    await supabase.from("code_snapshots").insert({
      session_id: sessionId,
      code,
      language: validLanguage,
      timestamp_ms: Date.now(),
      snapshot_type: "execution",
      execution_result: response,
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("[execute] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
