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

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, problem_id, language")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.problem_id) {
      return NextResponse.json({ testCases: [], functionName: null });
    }

    const { data: testCases, error } = await supabase
      .from("test_cases")
      .select("id, input, expected_output, order_index")
      .eq("problem_id", session.problem_id)
      .eq("is_example", true)
      .eq("is_hidden", false)
      .order("order_index", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("[test-cases] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch test cases" },
        { status: 500 }
      );
    }

    const { data: problem } = await supabase
      .from("problems")
      .select("starter_code")
      .eq("id", session.problem_id)
      .single();

    const functionName = extractFunctionName(
      (problem?.starter_code as Record<string, string>) ?? {},
      (session.language as string) ?? "python"
    );

    return NextResponse.json({
      testCases: testCases ?? [],
      functionName,
    });
  } catch (err) {
    console.error("[test-cases] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractFunctionName(
  starterCode: Record<string, string>,
  language: string
): string | null {
  const code = starterCode[language] ?? starterCode.python ?? "";
  const defMatch = code.match(/\bdef\s+(\w+)\s*\(/);
  if (defMatch) return defMatch[1];
  const fnMatch = code.match(/\bfunction\s+(\w+)\s*\(/);
  if (fnMatch) return fnMatch[1];
  const javaMatch = code.match(/\bpublic\s+\w+\s+(\w+)\s*\(/);
  if (javaMatch) return javaMatch[1];
  return null;
}
