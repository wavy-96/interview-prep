import { getSubscriptionTier } from "./session-context.js";
import { createOpenAIProxy } from "./openai-proxy.js";
import { createGeminiProvider } from "./gemini-provider.js";
/**
 * Creates a voice provider based on user's subscription_tier.
 * - free: Gemini (if GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY set), else OpenAI
 * - pro/enterprise: OpenAI
 */
export async function createVoiceProvider(session, callbacks) {
    const tier = await getSubscriptionTier(session.sessionId);
    if (tier === "pro" || tier === "enterprise") {
        return createOpenAIProxy(session, callbacks);
    }
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (geminiKey?.trim()) {
        const provider = createGeminiProvider(session, callbacks);
        if (provider)
            return provider;
    }
    if (openaiKey?.trim()) {
        return createOpenAIProxy(session, callbacks);
    }
    callbacks.onError("provider_unavailable", "No voice provider configured. Set GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY.");
    return null;
}
