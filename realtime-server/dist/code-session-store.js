import { getSupabase } from "./supabase.js";
const MAX_CODE_SIZE = 50 * 1024;
const PERSIST_INTERVAL_MS = 30_000;
const store = new Map();
let persistTimer = null;
export function updateCode(sessionId, code, language) {
    const size = Buffer.byteLength(code, "utf8");
    if (size > MAX_CODE_SIZE)
        return;
    store.set(sessionId, {
        code,
        language: ["python", "javascript", "java"].includes(language) ? language : "python",
        lastUpdated: Date.now(),
    });
    if (!persistTimer) {
        persistTimer = setInterval(persistAll, PERSIST_INTERVAL_MS);
    }
}
export function removeSession(sessionId) {
    store.delete(sessionId);
    if (store.size === 0 && persistTimer) {
        clearInterval(persistTimer);
        persistTimer = null;
    }
}
async function persistAll() {
    const supabase = getSupabase();
    if (!supabase)
        return;
    const entries = [...store.entries()];
    for (const [sessionId, data] of entries) {
        try {
            const { error } = await supabase.from("code_snapshots").insert({
                session_id: sessionId,
                code: data.code,
                language: data.language,
                timestamp_ms: data.lastUpdated,
                snapshot_type: "auto",
            });
            if (error) {
                console.error("[CodeStore] Persist error:", error.message);
            }
        }
        catch (err) {
            console.error("[CodeStore] Persist error:", err?.message);
        }
    }
}
