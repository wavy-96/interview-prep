/**
 * Code observer agent: calls the observe-code API and injects insights into the voice session.
 */
import { createHmac } from "crypto";
import { getObserverInject } from "./observer-registry.js";
const ALG = "sha256";
function signBody(body, secret) {
    return createHmac(ALG, secret).update(body).digest("hex");
}
/**
 * Call the observe-code API and inject insights into the voice session if connected.
 */
export async function observeCodeAndInject(sessionId, code, language) {
    const baseUrl = process.env.APP_URL ?? process.env.VERCEL_URL;
    const secret = process.env.INTERNAL_WEBHOOK_SECRET;
    if (!baseUrl?.trim() || !secret?.trim()) {
        return null;
    }
    const url = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    const apiUrl = `${url.replace(/\/$/, "")}/api/internal/agents/observe-code`;
    const body = JSON.stringify({ sessionId, code, language });
    const signature = signBody(body, secret);
    const idempotencyKey = crypto.randomUUID();
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
            const errText = await res.text();
            console.warn(`[Observer] API error ${res.status}:`, errText.slice(0, 200));
            return null;
        }
        const result = (await res.json());
        const inject = getObserverInject(sessionId);
        if (inject && (result.syntaxErrors?.length || result.approach || result.warnings?.length)) {
            const parts = [];
            if (result.syntaxErrors?.length) {
                parts.push(`Syntax issues: ${result.syntaxErrors.slice(0, 3).join("; ")}`);
            }
            if (result.approach) {
                parts.push(`Approach: ${result.approach}`);
            }
            if (result.estimatedComplexity) {
                parts.push(`Estimated complexity: ${result.estimatedComplexity}`);
            }
            if (result.warnings?.length) {
                parts.push(`Consider: ${result.warnings.slice(0, 2).join("; ")}`);
            }
            if (result.suggestRun) {
                parts.push("Code looks runnable — candidate might benefit from testing.");
            }
            if (parts.length > 0) {
                const text = parts.join(". ");
                inject(text);
            }
        }
        return result;
    }
    catch (err) {
        console.error("[Observer] Fetch error:", err?.message);
        return null;
    }
}
