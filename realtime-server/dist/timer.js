import { redis } from "./redis.js";
import { markSessionCompleted } from "./session-status.js";
const REDIS_URL = process.env.REDIS_URL;
const DEFAULT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const BROADCAST_INTERVAL_MS = 5000;
const TIMER_KEY_PREFIX = "session:timer:";
const REDIS_TTL = 24 * 60 * 60; // 24 hours
const memoryTimers = new Map();
const sessionSockets = new Map();
const timeWarningCallbacks = new Map();
const warnedMilestones = new Map(); // sessionId -> Set of ms thresholds already warned
const endedSessions = new Set(); // track sessions already ended to avoid duplicate emitSessionEnded
let broadcastInterval = null;
const FIVE_MIN_MS = 5 * 60 * 1000;
const ONE_MIN_MS = 60 * 1000;
function getTimerKey(sessionId) {
    return `${TIMER_KEY_PREFIX}${sessionId}`;
}
export function registerSessionSocket(sessionId, ws) {
    let set = sessionSockets.get(sessionId);
    if (!set) {
        set = new Set();
        sessionSockets.set(sessionId, set);
    }
    set.add(ws);
    if (!broadcastInterval) {
        broadcastInterval = setInterval(broadcastTimerToAll, BROADCAST_INTERVAL_MS);
    }
}
export function unregisterSessionSocket(sessionId, ws) {
    const set = sessionSockets.get(sessionId);
    if (set) {
        set.delete(ws);
        if (set.size === 0) {
            sessionSockets.delete(sessionId);
            timeWarningCallbacks.delete(sessionId);
            warnedMilestones.delete(sessionId);
        }
    }
    if (sessionSockets.size === 0 && broadcastInterval) {
        clearInterval(broadcastInterval);
        broadcastInterval = null;
    }
}
export function registerTimeWarningCallback(sessionId, callback) {
    timeWarningCallbacks.set(sessionId, callback);
}
async function getExpiresAt(sessionId) {
    const key = getTimerKey(sessionId);
    if (REDIS_URL) {
        try {
            const c = redis.getClient();
            if (c) {
                const v = await c.get(key);
                if (v)
                    return parseInt(v, 10);
            }
        }
        catch {
            /* fall through to memory */
        }
    }
    const mem = memoryTimers.get(sessionId);
    if (mem !== undefined)
        return mem;
    return 0;
}
async function setExpiresAt(sessionId, expiresAt) {
    const key = getTimerKey(sessionId);
    if (REDIS_URL) {
        try {
            const c = redis.getClient();
            if (c) {
                await c.setex(key, REDIS_TTL, String(expiresAt));
                return;
            }
        }
        catch {
            /* fall through to memory */
        }
    }
    memoryTimers.set(sessionId, expiresAt);
}
async function deleteTimer(sessionId) {
    const key = getTimerKey(sessionId);
    if (REDIS_URL) {
        try {
            const c = redis.getClient();
            if (c) {
                await c.del(key);
                return;
            }
        }
        catch {
            /* fall through */
        }
    }
    memoryTimers.delete(sessionId);
}
export async function startOrResumeTimer(sessionId) {
    let expiresAt = await getExpiresAt(sessionId);
    const now = Date.now();
    if (expiresAt <= 0 || expiresAt <= now) {
        expiresAt = now + DEFAULT_DURATION_MS;
        await setExpiresAt(sessionId, expiresAt);
    }
    const remainingMs = Math.max(0, expiresAt - now);
    return { remainingMs, expiresAt };
}
export async function stopTimer(sessionId) {
    await deleteTimer(sessionId);
}
export async function getTimerState(sessionId) {
    const expiresAt = await getExpiresAt(sessionId);
    const now = Date.now();
    const remainingMs = Math.max(0, expiresAt - now);
    return { remainingMs, expiresAt, ended: remainingMs <= 0 };
}
function broadcastTimerToAll() {
    const entries = [...sessionSockets.entries()];
    for (const [sessionId, sockets] of entries) {
        getTimerState(sessionId).then((state) => {
            const payload = JSON.stringify({
                type: "session.timer",
                remainingMs: state.remainingMs,
                expiresAt: state.expiresAt,
                ended: state.ended,
            });
            for (const ws of sockets) {
                if (ws.readyState === 1)
                    ws.send(payload);
            }
            if (state.ended && !endedSessions.has(sessionId)) {
                endedSessions.add(sessionId);
                emitSessionEnded(sessionId);
            }
            // Fire AI time warnings at 5-min and 1-min marks (once per milestone)
            const cb = timeWarningCallbacks.get(sessionId);
            if (cb && !state.ended) {
                let warned = warnedMilestones.get(sessionId);
                if (!warned) {
                    warned = new Set();
                    warnedMilestones.set(sessionId, warned);
                }
                if (state.remainingMs <= FIVE_MIN_MS && !warned.has(FIVE_MIN_MS)) {
                    warned.add(FIVE_MIN_MS);
                    cb(FIVE_MIN_MS);
                }
                else if (state.remainingMs <= ONE_MIN_MS && !warned.has(ONE_MIN_MS)) {
                    warned.add(ONE_MIN_MS);
                    cb(ONE_MIN_MS);
                }
            }
        }).catch((err) => {
            console.error(`[Timer] broadcastTimerToAll error for ${sessionId}:`, err?.message);
        });
    }
}
async function emitSessionEnded(sessionId) {
    const sockets = sessionSockets.get(sessionId);
    if (sockets) {
        const payload = JSON.stringify({ type: "session.ended" });
        for (const ws of sockets) {
            if (ws.readyState === 1)
                ws.send(payload);
        }
        sessionSockets.delete(sessionId);
    }
    timeWarningCallbacks.delete(sessionId);
    warnedMilestones.delete(sessionId);
    endedSessions.add(sessionId);
    await stopTimer(sessionId);
    markSessionCompleted(sessionId).catch((err) => console.error("[Timer] markSessionCompleted error:", err?.message));
}
export async function endSessionEarly(sessionId) {
    if (endedSessions.has(sessionId))
        return; // already ended
    endedSessions.add(sessionId);
    await emitSessionEnded(sessionId);
}
