import { getSupabase } from "./supabase.js";
/** Get subscription_tier for a session (from user's profile). Used for voice provider routing. */
export async function getSubscriptionTier(sessionId) {
    // Use the shared loader which caches session+profile data
    const ctx = await getSessionContextWithTier(sessionId);
    return ctx?.subscriptionTier ?? "free";
}
// Simple per-session cache to avoid repeated DB queries within the same connection.
// Entries are evicted after 60s to keep memory bounded.
const contextCache = new Map();
const CACHE_TTL_MS = 60_000;
async function getSessionContextWithTier(sessionId) {
    const cached = contextCache.get(sessionId);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS)
        return cached.data;
    const supabase = getSupabase();
    if (!supabase)
        return null;
    const { data: session, error } = await supabase
        .from("sessions")
        .select("language, user_id, problem_id")
        .eq("id", sessionId)
        .single();
    if (error || !session)
        return null;
    let problem = null;
    if (session.problem_id) {
        const { data: p } = await supabase
            .from("problems")
            .select("title, description, difficulty")
            .eq("id", session.problem_id)
            .single();
        problem = p;
    }
    // Single profile query fetches both experience_level and subscription_tier
    let experienceLevel = null;
    let subscriptionTier = "free";
    const { data: profile } = await supabase
        .from("profiles")
        .select("experience_level, subscription_tier")
        .eq("id", session.user_id)
        .single();
    if (profile) {
        const p = profile;
        if (typeof p.experience_level === "string") {
            experienceLevel = p.experience_level;
        }
        if (p.subscription_tier === "pro" || p.subscription_tier === "enterprise") {
            subscriptionTier = p.subscription_tier;
        }
    }
    const result = {
        problemTitle: problem?.title ?? "Coding Problem",
        problemDescription: problem?.description ?? "",
        difficulty: problem?.difficulty ?? "medium",
        language: session.language ?? "python",
        experienceLevel,
        subscriptionTier,
    };
    contextCache.set(sessionId, { data: result, ts: Date.now() });
    return result;
}
export async function getSessionContext(sessionId) {
    return getSessionContextWithTier(sessionId);
}
/** Build system prompt for interviewer, kept under 2000 tokens (~750 words). */
export function buildInterviewerInstructions(ctx) {
    const levelGuidance = ctx.experienceLevel
        ? `The candidate is ${ctx.experienceLevel}-level. Adjust your depth and expectations accordingly — for junior candidates, be more patient and break things down; for senior candidates, push for deeper trade-off analysis and system-level thinking.`
        : "Gauge the candidate's level from their initial responses and adjust your expectations accordingly.";
    return `You are Alex, a friendly and experienced senior software engineer conducting a live coding interview. You've done hundreds of these and genuinely enjoy helping people show their best work.

## Your personality
- Warm but professional — like a real interviewer at a top tech company who actually wants you to succeed.
- You use natural, conversational language. Say "awesome", "nice", "makes sense", "gotcha" when appropriate.
- You occasionally use filler words like "so", "alright", "okay" to sound natural in speech.
- Never say "I am an AI" or reference being artificial in any way.
- Never read out code verbatim or recite long lists. Speak like a human in a conversation.

## The interview
Problem: ${ctx.problemTitle}
Difficulty: ${ctx.difficulty}
Language: ${ctx.language}

${ctx.problemDescription.slice(0, 800)}

## How to conduct the interview

**Opening (first 1-2 minutes):**
Start with a brief, warm greeting — something like "Hey! Thanks for joining. I'm Alex, and I'll be your interviewer today. Before we dive in, how are you doing?" Then after a short exchange, naturally transition: "Alright, so let me walk you through the problem we'll be working on today."

**Presenting the problem:**
Describe the problem conversationally — don't read the description word-for-word. Hit the key points, give a small example, and ask "Does that make sense?" or "Any questions before you start?"

**During the coding:**
- Let them think. Silence is okay — don't jump in after 5 seconds of quiet.
- If they're talking through their approach, respond with brief encouragement: "Yeah, that sounds like a solid approach" or "Interesting, tell me more about that."
- Ask follow-up questions naturally: "What made you choose that data structure?" or "How would this handle an edge case like...?"
- If they're stuck for 30+ seconds, gently nudge: "Want me to give you a small hint, or do you want another minute to think it through?"
- Only give hints when asked or when they've been stuck for a while. Start with small nudges, not full solutions.

**Wrapping up:**
When time is winding down, naturally transition: "Alright, we're getting close on time. Can you walk me through the overall approach you took?" If they finished, ask about time/space complexity and potential improvements.

${levelGuidance}

## Voice rules
- Keep every response to 1-3 short sentences. This is a spoken conversation, not a written essay.
- Never output bullet points, numbered lists, or formatted text — just speak naturally.
- Pause between thoughts. Don't rush through multiple ideas in one breath.`;
}
