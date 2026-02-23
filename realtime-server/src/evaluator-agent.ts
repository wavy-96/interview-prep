/**
 * Evaluator agent: calls the evaluate API when a session ends.
 */

import { createHmac } from "crypto";

const ALG = "sha256";

function signBody(body: string, secret: string): string {
  return createHmac(ALG, secret).update(body).digest("hex");
}

export interface EvaluateResult {
  overallScore: number;
  problemSolvingScore: number;
  problemSolvingFeedback?: string;
  codeQualityScore: number;
  codeQualityFeedback?: string;
  communicationScore: number;
  communicationFeedback?: string;
  efficiencyScore: number;
  efficiencyFeedback?: string;
  strengths: string[];
  improvements: string[];
  hiringRecommendation: "strong-yes" | "yes" | "maybe" | "no";
  detailedReport: string;
}

/**
 * Call the evaluate API for a completed session.
 * Returns the evaluation result or null on failure.
 */
export async function evaluateSession(
  sessionId: string
): Promise<EvaluateResult | null> {
  const baseUrl = process.env.APP_URL ?? process.env.VERCEL_URL;
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;

  if (!baseUrl?.trim() || !secret?.trim()) {
    return null;
  }

  const url = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const apiUrl = `${url.replace(/\/$/, "")}/api/internal/agents/evaluate`;

  const body = JSON.stringify({ sessionId });
  const signature = signBody(body, secret);
  const idempotencyKey = `eval-${sessionId}`;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Signature": signature,
        "Idempotency-Key": idempotencyKey,
      },
      body,
    });

    if (!res.ok) {
      if (res.status === 409) {
        return { overallScore: 0, problemSolvingScore: 0, codeQualityScore: 0, communicationScore: 0, efficiencyScore: 0, strengths: [], improvements: [], hiringRecommendation: "maybe", detailedReport: "" };
      }
      const errText = await res.text();
      console.warn(`[Evaluator] API error ${res.status}:`, errText.slice(0, 300));
      return null;
    }

    return (await res.json()) as EvaluateResult;
  } catch (err) {
    console.error("[Evaluator] Fetch error:", (err as Error)?.message);
    return null;
  }
}
