import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
const JTI_TTL = 7200;

let client: Redis | null = null;

function createRedisClient() {
  return new Redis(REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    tls: REDIS_URL!.startsWith("rediss://") ? {} : undefined,
  });
}
const memoryStore = new Map<string, number>();

export const redis = {
  async isUsed(jti: string): Promise<boolean> {
    if (REDIS_URL) {
      const c = getClient();
      const v = await c.get(`jti:${jti}`);
      return v !== null;
    }
    return memoryStore.has(jti);
  },

  async getRetryCount(stream: string, msgId: string): Promise<number> {
    if (!REDIS_URL) return 0;
    const c = getClient();
    const v = await c.get(`retry:${stream}:${msgId}`);
    return v ? parseInt(v, 10) : 0;
  },

  async incrementRetryCount(stream: string, msgId: string): Promise<number> {
    if (!REDIS_URL) return 0;
    const c = getClient();
    const key = `retry:${stream}:${msgId}`;
    const v = await c.get(key);
    const next = (v ? parseInt(v, 10) : 0) + 1;
    await c.setex(key, 3600, String(next));
    return next;
  },

  async markUsed(jti: string): Promise<void> {
    if (REDIS_URL) {
      const c = getClient();
      await c.setex(`jti:${jti}`, JTI_TTL, "1");
    } else {
      memoryStore.set(jti, Date.now());
      setTimeout(() => memoryStore.delete(jti), JTI_TTL * 1000);
    }
  },

  async xadd(stream: string, ...fields: string[]): Promise<string | null> {
    if (!REDIS_URL) return null;
    const c = getClient();
    return c.xadd(stream, "MAXLEN", "~", "10000", "*", ...fields);
  },

  async ensureConsumerGroup(stream: string, group: string): Promise<void> {
    if (!REDIS_URL) return;
    const c = getClient();
    try {
      await c.xgroup("CREATE", stream, group, "0", "MKSTREAM");
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "";
      if (!msg.includes("BUSYGROUP")) throw err;
    }
  },

  async xreadgroup(
    stream: string,
    group: string,
    consumer: string,
    blockMs: number,
    count: number
  ): Promise<[string, [string, string[]][]][] | null> {
    if (!REDIS_URL) return null;
    const c = getClient();
    // Use call() to bypass strict ioredis overloads for variadic stream commands
    const result = await (c as unknown as {
      xreadgroup: (...args: (string | number)[]) => Promise<unknown>;
    }).xreadgroup(
      "GROUP",
      group,
      consumer,
      "BLOCK",
      blockMs,
      "COUNT",
      count,
      "STREAMS",
      stream,
      ">"
    );
    return result as [string, [string, string[]][]][] | null;
  },

  async xack(stream: string, group: string, ...ids: string[]): Promise<number> {
    if (!REDIS_URL) return 0;
    const c = getClient();
    return c.xack(stream, group, ...ids);
  },

  async xautoclaim(
    stream: string,
    group: string,
    consumer: string,
    minIdleMs: number,
    startId: string
  ): Promise<[string, unknown[]]> {
    if (!REDIS_URL) return ["0-0", []];
    const c = getClient();
    const result = await (c as unknown as {
      xautoclaim: (...args: (string | number)[]) => Promise<unknown>;
    }).xautoclaim(
      stream,
      group,
      consumer,
      minIdleMs,
      startId,
      "COUNT",
      10
    );
    return result as [string, unknown[]];
  },

  async xrange(
    stream: string,
    start: string,
    end: string,
    count?: number
  ): Promise<[string, string[]][]> {
    if (!REDIS_URL) return [];
    const c = getClient();
    if (count) {
      return c.xrange(stream, start, end, "COUNT", count) as Promise<[string, string[]][]>;
    }
    return c.xrange(stream, start, end) as Promise<[string, string[]][]>;
  },

  async xaddDlq(
    originalPayload: Record<string, unknown>,
    errorReason: string
  ): Promise<string | null> {
    if (!REDIS_URL) return null;
    const c = getClient();
    return c.xadd(
      "events.dlq",
      "MAXLEN",
      "~",
      "10000",
      "*",
      "payload",
      JSON.stringify(originalPayload),
      "error",
      errorReason,
      "timestamp",
      String(Date.now())
    );
  },

  getClient() {
    return client;
  },
};

function getClient() {
  if (!client) {
    if (!REDIS_URL) throw new Error("REDIS_URL required for Redis operations");
    client = createRedisClient();
  }
  return client;
}
