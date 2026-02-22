import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyInternalSignature } from "@/lib/internal-signature";

const RATE_LIMIT_MS = 2000;
const CACHE_TTL_MS = 5000;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_CODE_SIZE = 50 * 1024;

// In-memory rate limit and cache (use Redis/Upstash for multi-instance)
const rateLimitMap = new Map<string, number>();
const cacheMap = new Map<string, { result: ObserveCodeResult; ts: number }>();

export interface ObserveCodeResult {
  syntaxErrors: string[];
  warnings: string[];
  approach: string;
  estimatedComplexity: string;
  suggestRun: boolean;
}

function cacheKey(code: string, language: string): string {
  return `${language}:${code}`;
}

function getCached(code: string, language: string): ObserveCodeResult | null {
  const key = cacheKey(code, language);
  const entry = cacheMap.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cacheMap.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(code: string, language: string, result: ObserveCodeResult): void {
  const key = cacheKey(code, language);
  cacheMap.set(key, { result, ts: Date.now() });
  // Evict old entries
  if (cacheMap.size > 500) {
    const oldest = [...cacheMap.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cacheMap.delete(oldest[0]);
  }
}

function checkRateLimit(sessionId: string): boolean {
  const last = rateLimitMap.get(sessionId);
  const now = Date.now();
  if (last && now - last < RATE_LIMIT_MS) return false;
  rateLimitMap.set(sessionId, now);
  return true;
}

const OBSERVE_PROMPT = `You are a code observer for a live coding interview. Analyze the candidate's code and return a JSON object with exactly these keys (no extra keys):
- syntaxErrors: string[] — list of syntax errors if any (empty if valid)
- warnings: string[] — style/approach warnings (e.g. "Consider handling edge case X")
- approach: string — brief 1–2 sentence description of the approach (e.g. "Using a hash map for O(1) lookups")
- estimatedComplexity: string — e.g. "O(n)", "O(n log n)", "O(1)"
- suggestRun: boolean — true if the code looks runnable and the candidate might benefit from testing

Rules:
- Be concise. approach and estimatedComplexity should be 1 short sentence each.
- If code is empty or clearly incomplete, return empty arrays and suggestRun: false.
- Handle partial/broken code gracefully — don't hallucinate errors.
- Return ONLY valid JSON, no markdown or extra text.`;

function parseObservationResponse(text: string): ObserveCodeResult {
  const fallback: ObserveCodeResult = {
    syntaxErrors: [],
    warnings: [],
    approach: "",
    estimatedComplexity: "",
    suggestRun: false,
  };
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object") return fallback;
    const p = parsed as Record<string, unknown>;
    return {
      syntaxErrors: Array.isArray(p.syntaxErrors)
        ? (p.syntaxErrors as string[]).filter((x) => typeof x === "string")
        : [],
      warnings: Array.isArray(p.warnings)
        ? (p.warnings as string[]).filter((x) => typeof x === "string")
        : [],
      approach: typeof p.approach === "string" ? p.approach : "",
      estimatedComplexity: typeof p.estimatedComplexity === "string" ? p.estimatedComplexity : "",
      suggestRun: typeof p.suggestRun === "boolean" ? p.suggestRun : false,
    };
  } catch {
    return fallback;
  }
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

    let body: { sessionId?: string; code?: string; language?: string };
    try {
      body = JSON.parse(rawBody) as { sessionId?: string; code?: string; language?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { sessionId, code, language } = body;
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    if (typeof code !== "string") {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const codeSize = new TextEncoder().encode(code).length;
    if (codeSize > MAX_CODE_SIZE) {
      return NextResponse.json(
        { error: "Code exceeds 50KB limit", size: codeSize },
        { status: 413 }
      );
    }

    const lang = ["python", "javascript", "java"].includes(language ?? "")
      ? (language as string)
      : "python";

    const cached = getCached(code, lang);
    if (cached) {
      return NextResponse.json(cached);
    }

    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: "Rate limited: max 1 observation per 2 seconds per session" },
        { status: 429 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: OBSERVE_PROMPT,
      messages: [
        {
          role: "user",
          content: `Language: ${lang}\n\nCode:\n\`\`\`${lang}\n${code}\n\`\`\``,
        },
      ],
    });

    const text =
      response.content
        ?.filter((c) => c.type === "text" && "text" in c)
        .map((c) => (c as { text: string }).text)
        .join("") ?? "";
    const result = parseObservationResponse(text);
    setCache(code, lang, result);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[observe-code] Error:", err);
    return NextResponse.json(
      { error: "Observation failed" },
      { status: 500 }
    );
  }
}
