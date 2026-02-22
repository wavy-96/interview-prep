import { getSupabase } from "./supabase.js";
const BATCH_INTERVAL_MS = 5000;
const buffers = new Map();
const flushTimers = new Map();
function getBuffer(sessionId) {
    let buf = buffers.get(sessionId);
    if (!buf) {
        buf = [];
        buffers.set(sessionId, buf);
    }
    return buf;
}
function scheduleFlush(sessionId) {
    const existing = flushTimers.get(sessionId);
    if (existing)
        return;
    const timer = setTimeout(() => {
        flushTimers.delete(sessionId);
        flush(sessionId);
    }, BATCH_INTERVAL_MS);
    flushTimers.set(sessionId, timer);
}
export function addTranscript(chunk) {
    const buf = getBuffer(chunk.sessionId);
    if (chunk.openaiItemId) {
        const idx = buf.findIndex((c) => c.openaiItemId === chunk.openaiItemId);
        if (idx >= 0)
            buf[idx] = chunk;
        else
            buf.push(chunk);
    }
    else {
        buf.push(chunk);
    }
    scheduleFlush(chunk.sessionId);
}
async function flush(sessionId) {
    const buf = buffers.get(sessionId);
    if (!buf || buf.length === 0)
        return;
    buffers.set(sessionId, []);
    const rows = buf.map((c) => ({
        session_id: c.sessionId,
        speaker: c.speaker,
        content: c.content,
        timestamp_ms: c.timestampMs,
        openai_item_id: c.openaiItemId,
        metadata: c.openaiItemId ? { openai_item_id: c.openaiItemId } : null,
    }));
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("[Transcript] Supabase not configured, skipping store");
        return;
    }
    const withId = rows.filter((r) => r.openai_item_id);
    const withoutId = rows.filter((r) => !r.openai_item_id);
    if (withId.length > 0) {
        const { error } = await supabase.from("transcripts").upsert(withId.map((r) => ({
            session_id: r.session_id,
            speaker: r.speaker,
            content: r.content,
            timestamp_ms: r.timestamp_ms,
            openai_item_id: r.openai_item_id,
            metadata: r.metadata,
        })), { onConflict: "openai_item_id", ignoreDuplicates: true });
        if (error) {
            console.error("[Transcript] Upsert error:", error.message);
            getBuffer(sessionId).push(...buf.filter((c) => c.openaiItemId));
            scheduleFlush(sessionId);
        }
    }
    if (withoutId.length > 0) {
        const { error } = await supabase.from("transcripts").insert(withoutId.map((r) => ({
            session_id: r.session_id,
            speaker: r.speaker,
            content: r.content,
            timestamp_ms: r.timestamp_ms,
            metadata: r.metadata,
        })));
        if (error) {
            console.error("[Transcript] Insert error:", error.message);
            getBuffer(sessionId).push(...buf.filter((c) => !c.openaiItemId));
            scheduleFlush(sessionId);
        }
    }
}
export async function flushNow(sessionId) {
    const timer = flushTimers.get(sessionId);
    if (timer) {
        clearTimeout(timer);
        flushTimers.delete(sessionId);
    }
    await flush(sessionId);
}
export function clearBuffer(sessionId) {
    const timer = flushTimers.get(sessionId);
    if (timer) {
        clearTimeout(timer);
        flushTimers.delete(sessionId);
    }
    buffers.delete(sessionId);
}
