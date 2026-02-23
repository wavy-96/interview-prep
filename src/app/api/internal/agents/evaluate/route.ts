import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyInternalSignature } from "@/lib/internal-signature";
import { createAdminClient } from "@/lib/supabase/admin";

const MODEL = "claude-sonnet-4-6";
const MAX_RETRIES = 2;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVALUATE_PROMPT = `You are an expert technical interviewer evaluator. Analyze the interview transcript, code snapshots (with execution results when available), and the problem description. Return a JSON object with exactly these keys (no extra keys):

- overallScore: number (0-100, weighted average of dimension scores)
- problemSolvingScore: number (1-10)
- problemSolvingFeedback: string (1-2 sentences)
- codeQualityScore: number (1-10)
- codeQualityFeedback: string (1-2 sentences)
- communicationScore: number (1-10)
- communicationFeedback: string (1-2 sentences)
- efficiencyScore: number (1-10)
- efficiencyFeedback: string (1-2 sentences)
- strengths: string[] (3-5 bullet points)
- improvements: string[] (3-5 bullet points)
- hiringRecommendation: "strong-yes" | "yes" | "maybe" | "no"
- detailedReport: string (Markdown, 2-4 paragraphs summarizing the interview)

Rules:
- Be fair and constructive. Base scores on evidence from the transcript and code.
- If transcript or code is sparse, note that in the report and adjust scores accordingly.
- Return ONLY valid JSON, no markdown code fences or extra text.`;

interface EvaluationOutput {
  overallScore?: number;
  problemSolvingScore?: number;
  problemSolvingFeedback?: string;
  codeQualityScore?: number;
  codeQualityFeedback?: string;
  communicationScore?: number;
  communicationFeedback?: string;
  efficiencyScore?: number;
  efficiencyFeedback?: string;
  strengths?: string[];
  improvements?: string[];
  hiringRecommendation?: string;
  detailedReport?: string;
}

function parseEvaluationResponse(text: string): EvaluationOutput | null {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned) as EvaluationOutput;
  } catch {
    return null;
  }
}

function toDbRow(
  sessionId: string,
  parsed: EvaluationOutput
): Record<string, unknown> {
  const overall = typeof parsed.overallScore === "number" ? parsed.overallScore : null;
  const ps = typeof parsed.problemSolvingScore === "number" ? parsed.problemSolvingScore : null;
  const cq = typeof parsed.codeQualityScore === "number" ? parsed.codeQualityScore : null;
  const comm = typeof parsed.communicationScore === "number" ? parsed.communicationScore : null;
  const eff = typeof parsed.efficiencyScore === "number" ? parsed.efficiencyScore : null;
  const rec = ["strong-yes", "yes", "maybe", "no"].includes(
    String(parsed.hiringRecommendation ?? "")
  )
    ? parsed.hiringRecommendation
    : null;

  return {
    session_id: sessionId,
    overall_score: overall,
    problem_solving_score: ps,
    problem_solving_feedback: String(parsed.problemSolvingFeedback ?? "").slice(0, 2000) || null,
    code_quality_score: cq,
    code_quality_feedback: String(parsed.codeQualityFeedback ?? "").slice(0, 2000) || null,
    communication_score: comm,
    communication_feedback: String(parsed.communicationFeedback ?? "").slice(0, 2000) || null,
    efficiency_score: eff,
    efficiency_feedback: String(parsed.efficiencyFeedback ?? "").slice(0, 2000) || null,
    strengths: Array.isArray(parsed.strengths)
      ? (parsed.strengths as string[]).filter((x) => typeof x === "string").slice(0, 10)
      : [],
    improvements: Array.isArray(parsed.improvements)
      ? (parsed.improvements as string[]).filter((x) => typeof x === "string").slice(0, 10)
      : [],
    hiring_recommendation: rec,
    detailed_report: String(parsed.detailedReport ?? "").slice(0, 16000) || null,
    evaluator_model: MODEL,
    evaluation_status: "completed",
  };
}

export async function POST(request: Request) {
  try {
    const secret = process.env.INTERNAL_WEBHOOK_SECRET;
    if (!secret?.trim()) {
      return NextResponse.json({ error: "Internal API not configured" }, { status: 503 });
    }

    const signature = request.headers.get("X-Internal-Signature");
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey?.trim()) {
      return NextResponse.json({ error: "Idempotency-Key required" }, { status: 400 });
    }

    const rawBody = await request.text();
    if (!verifyInternalSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid or missing signature" }, { status: 401 });
    }

    let body: { sessionId?: string };
    try {
      body = JSON.parse(rawBody) as { sessionId?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const sessionId = body.sessionId;
    if (!sessionId || typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: "sessionId required and must be a valid UUID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("evaluations")
      .select("id, evaluation_status")
      .eq("session_id", sessionId)
      .single();

    if (existing?.evaluation_status === "completed") {
      return NextResponse.json(
        { error: "Evaluation already exists for this session" },
        { status: 409 }
      );
    }

    const [
      { data: session },
      { data: transcripts },
      { data: codeSnapshots },
    ] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, status, problem_id")
        .eq("id", sessionId)
        .single(),
      supabase
        .from("transcripts")
        .select("speaker, content, timestamp_ms")
        .eq("session_id", sessionId)
        .order("timestamp_ms", { ascending: true }),
      supabase
        .from("code_snapshots")
        .select("code, language, snapshot_type, execution_result, observer_analysis")
        .eq("session_id", sessionId)
        .order("timestamp_ms", { ascending: true }),
    ]);

    if (!session || session.status !== "completed") {
      return NextResponse.json(
        { error: "Session not found or not completed" },
        { status: 400 }
      );
    }

    let problem: { title: string; description: string; difficulty: string } | null = null;
    if (session.problem_id) {
      const { data: p } = await supabase
        .from("problems")
        .select("title, description, difficulty")
        .eq("id", session.problem_id)
        .single();
      problem = p;
    }

    const transcriptText =
      (transcripts ?? [])
        .map((t) => `[${t.speaker}] ${t.content}`)
        .join("\n") || "(No transcript)";

    const codeText =
      (codeSnapshots ?? [])
        .map((s) => {
          const exec = s.execution_result
            ? `\nExecution: ${JSON.stringify(s.execution_result)}`
            : "";
          return `--- ${s.snapshot_type} (${s.language}) ---\n${s.code}${exec}`;
        })
        .join("\n\n") || "(No code snapshots)";

    const problemText = problem
      ? `Title: ${problem.title}\nDifficulty: ${problem.difficulty}\n\n${problem.description}`
      : "(No problem assigned)";

    const userContent = `## Transcript\n${transcriptText}\n\n## Code Snapshots\n${codeText}\n\n## Problem\n${problemText}`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey?.trim()) {
      await supabase.from("evaluations").insert({
        session_id: sessionId,
        evaluation_status: "failed",
        detailed_report: "Evaluation failed: Anthropic API key not configured",
      });
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 4096,
          system: EVALUATE_PROMPT,
          messages: [{ role: "user", content: userContent }],
        });

        const text =
          response.content
            ?.filter((c) => c.type === "text" && "text" in c)
            .map((c) => (c as { text: string }).text)
            .join("") ?? "";

        const parsed = parseEvaluationResponse(text);
        if (!parsed) {
          throw new Error("Failed to parse evaluation response");
        }

        const row = toDbRow(sessionId, parsed);
        const { error: upsertError } = await supabase
          .from("evaluations")
          .upsert(row, { onConflict: "session_id" });

        if (upsertError) {
          console.error("[evaluate] Upsert error:", upsertError);
          throw new Error(upsertError.message);
        }

        return NextResponse.json({
          overallScore: parsed.overallScore ?? 0,
          problemSolvingScore: parsed.problemSolvingScore ?? 0,
          problemSolvingFeedback: parsed.problemSolvingFeedback,
          codeQualityScore: parsed.codeQualityScore ?? 0,
          codeQualityFeedback: parsed.codeQualityFeedback,
          communicationScore: parsed.communicationScore ?? 0,
          communicationFeedback: parsed.communicationFeedback,
          efficiencyScore: parsed.efficiencyScore ?? 0,
          efficiencyFeedback: parsed.efficiencyFeedback,
          strengths: parsed.strengths ?? [],
          improvements: parsed.improvements ?? [],
          hiringRecommendation: parsed.hiringRecommendation ?? "maybe",
          detailedReport: parsed.detailedReport ?? "",
        });
      } catch (err) {
        lastError = err as Error;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    const errMsg = lastError?.message ?? "Unknown error";
    await supabase
      .from("evaluations")
      .upsert(
        {
          session_id: sessionId,
          evaluation_status: "failed",
          detailed_report: `Evaluation failed after ${MAX_RETRIES + 1} attempts: ${errMsg}`,
        },
        { onConflict: "session_id" }
      );

    return NextResponse.json(
      { error: "Evaluation failed", details: errMsg },
      { status: 500 }
    );
  } catch (err) {
    console.error("[evaluate] Error:", err);
    return NextResponse.json(
      { error: "Evaluation failed" },
      { status: 500 }
    );
  }
}
