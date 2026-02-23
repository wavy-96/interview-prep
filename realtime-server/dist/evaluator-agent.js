/**
 * Evaluator agent: calls the evaluate API when a session ends.
 */
import { createHmac } from "crypto";
const ALG = "sha256";
function signBody(body, secret) {
    return createHmac(ALG, secret).update(body).digest("hex");
}
/**
 * Call the evaluate API for a completed session.
 * Returns the evaluation result or null on failure.
 */
export async function evaluateSession(sessionId) {
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
        return (await res.json());
    }
    catch (err) {
        console.error("[Evaluator] Fetch error:", err?.message);
        return null;
    }
}
