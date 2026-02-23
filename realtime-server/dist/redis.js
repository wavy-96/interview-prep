import { Redis } from "ioredis";
const REDIS_URL = process.env.REDIS_URL;
const JTI_TTL = 7200;
let client = null;
function createRedisClient() {
    return new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
    });
}
const memoryStore = new Map();
export const redis = {
    async markUsedIfUnused(jti) {
        if (REDIS_URL) {
            const c = getClient();
            const result = await c.set(`jti:${jti}`, "1", "EX", JTI_TTL, "NX");
            return result === "OK";
        }
        if (memoryStore.has(jti))
            return false;
        memoryStore.set(jti, Date.now());
        setTimeout(() => memoryStore.delete(jti), JTI_TTL * 1000);
        return true;
    },
    async isUsed(jti) {
        if (REDIS_URL) {
            const c = getClient();
            const v = await c.get(`jti:${jti}`);
            return v !== null;
        }
        return memoryStore.has(jti);
    },
    async getRetryCount(stream, msgId) {
        if (!REDIS_URL)
            return 0;
        const c = getClient();
        const v = await c.get(`retry:${stream}:${msgId}`);
        return v ? parseInt(v, 10) : 0;
    },
    async incrementRetryCount(stream, msgId) {
        if (!REDIS_URL)
            return 0;
        const c = getClient();
        const key = `retry:${stream}:${msgId}`;
        const v = await c.get(key);
        const next = (v ? parseInt(v, 10) : 0) + 1;
        await c.setex(key, 3600, String(next));
        return next;
    },
    async markUsed(jti) {
        await this.markUsedIfUnused(jti);
    },
    async xadd(stream, ...fields) {
        if (!REDIS_URL)
            return null;
        const c = getClient();
        return c.xadd(stream, "MAXLEN", "~", "10000", "*", ...fields);
    },
    async ensureConsumerGroup(stream, group) {
        if (!REDIS_URL)
            return;
        const c = getClient();
        try {
            await c.xgroup("CREATE", stream, group, "0", "MKSTREAM");
        }
        catch (err) {
            const msg = err?.message ?? "";
            if (!msg.includes("BUSYGROUP"))
                throw err;
        }
    },
    async xreadgroup(stream, group, consumer, blockMs, count) {
        if (!REDIS_URL)
            return null;
        const c = getClient();
        // Use call() to bypass strict ioredis overloads for variadic stream commands
        const result = await c.xreadgroup("GROUP", group, consumer, "BLOCK", blockMs, "COUNT", count, "STREAMS", stream, ">");
        return result;
    },
    async xack(stream, group, ...ids) {
        if (!REDIS_URL)
            return 0;
        const c = getClient();
        return c.xack(stream, group, ...ids);
    },
    async xautoclaim(stream, group, consumer, minIdleMs, startId) {
        if (!REDIS_URL)
            return ["0-0", []];
        const c = getClient();
        const result = await c.xautoclaim(stream, group, consumer, minIdleMs, startId, "COUNT", 10);
        return result;
    },
    async xrange(stream, start, end, count) {
        if (!REDIS_URL)
            return [];
        const c = getClient();
        if (count) {
            return c.xrange(stream, start, end, "COUNT", count);
        }
        return c.xrange(stream, start, end);
    },
    async xaddDlq(originalPayload, errorReason) {
        if (!REDIS_URL)
            return null;
        const c = getClient();
        return c.xadd("events.dlq", "MAXLEN", "~", "10000", "*", "payload", JSON.stringify(originalPayload), "error", errorReason, "timestamp", String(Date.now()));
    },
    getClient() {
        return client;
    },
};
function getClient() {
    if (!client) {
        if (!REDIS_URL)
            throw new Error("REDIS_URL required for Redis operations");
        client = createRedisClient();
    }
    return client;
}
