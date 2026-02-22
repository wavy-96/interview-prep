import { redis } from "./redis.js";
import { observeCodeAndInject } from "./observer-agent.js";

const STREAM = "events";
const DLQ_STREAM = "events.dlq";
const MAX_RETRIES = 5;
const BLOCK_MS = 5000;
const PENDING_IDLE_MS = 30_000;
const RETRY_COUNT = 10;

type StreamEntry = { id: string; fields: string[] };

function parseStreamResult(
  result: [string, [string, string[]][]][] | null
): { stream: string; entries: StreamEntry[] }[] {
  if (!result) return [];
  return result.map(([stream, entries]) => ({
    stream,
    entries: entries.map(([id, fields]) => ({ id, fields })),
  }));
}

function parsePayload(fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < fields.length; i += 2) {
    const k = fields[i];
    const v = fields[i + 1];
    if (k === "payload" && typeof v === "string") {
      try {
        out.payload = JSON.parse(v) as unknown;
      } catch {
        out.payload = v;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Process events. Observer runs for code.edited in observer-workers; evaluator in later epic. */
async function processEvent(
  type: string,
  sessionId: string,
  payload: unknown,
  group: string
): Promise<{ success: boolean; error?: string }> {
  if (type === "code.edited" && group === "observer-workers") {
    const p = payload as { code?: string; language?: string } | undefined;
    const code = typeof p?.code === "string" ? p.code : "";
    const language = typeof p?.language === "string" ? p.language : "python";
    observeCodeAndInject(sessionId, code, language).catch((err) => {
      console.warn("[Observer] observeCodeAndInject error:", (err as Error)?.message);
    });
  }
  return { success: true };
}

async function handleMessage(
  group: string,
  consumer: string,
  stream: string,
  entry: StreamEntry
): Promise<void> {
  const { id, fields } = entry;
  const parsed = parsePayload(fields);
  const type = (parsed.type as string) ?? "unknown";
  const sessionId = (parsed.sessionId as string) ?? "";
  const payload = parsed.payload;

  const retryCount = await redis.getRetryCount(stream, id);
  if (retryCount >= MAX_RETRIES) {
    const dlqPayload = {
      originalStream: stream,
      messageId: id,
      type,
      sessionId,
      payload,
      retryCount,
    };
    await redis.xaddDlq(dlqPayload, `Exceeded ${MAX_RETRIES} retries`);
    await redis.xack(stream, group, id);
    console.warn(
      `[DLQ] Event moved to ${DLQ_STREAM}: type=${type} sessionId=${sessionId} msgId=${id} retries=${retryCount}`
    );
    return;
  }

  const result = await processEvent(type, sessionId, payload, group);
  if (result.success) {
    await redis.xack(stream, group, id);
  } else {
    const next = await redis.incrementRetryCount(stream, id);
    if (next >= MAX_RETRIES) {
      const dlqPayload = {
        originalStream: stream,
        messageId: id,
        type,
        sessionId,
        payload,
        retryCount: next,
        lastError: result.error,
      };
      await redis.xaddDlq(dlqPayload, result.error ?? `Failed after ${next} retries`);
      await redis.xack(stream, group, id);
      console.warn(
        `[DLQ] Event moved to ${DLQ_STREAM}: type=${type} sessionId=${sessionId} msgId=${id} retries=${next}`
      );
    }
    // Don't ack - message stays pending for XAUTOCLAIM
  }
}

async function runConsumer(
  group: string,
  consumer: string,
  readFn: () => Promise<[string, [string, string[]][]][] | null>
): Promise<void> {
  const result = await readFn();
  const batches = parseStreamResult(result);
  for (const { stream, entries } of batches) {
    for (const entry of entries) {
      try {
        await handleMessage(group, consumer, stream, entry);
      } catch (err) {
        console.error(
          `[Worker] Error processing ${entry.id}:`,
          (err as Error)?.message
        );
        await redis.incrementRetryCount(stream, entry.id);
        // Don't ack - will be retried via XAUTOCLAIM
      }
    }
  }
}

async function workerLoop(
  group: string,
  consumer: string,
  blockMs: number,
  count: number
): Promise<void> {
  while (true) {
    try {
      const result = await redis.xreadgroup(
        STREAM,
        group,
        consumer,
        blockMs,
        count
      );
      await runConsumer(group, consumer, async () => result);
    } catch (err) {
      console.error(
        `[Worker ${group}/${consumer}] Read error:`,
        (err as Error)?.message
      );
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

function parseAutoclaimEntries(claimed: unknown[]): StreamEntry[] {
  const entries: StreamEntry[] = [];
  for (const item of claimed) {
    if (Array.isArray(item) && item.length >= 2) {
      const id = String(item[0]);
      const fields = Array.isArray(item[1]) ? (item[1] as string[]) : [];
      entries.push({ id, fields });
    } else if (typeof item === "string") {
      // JUSTID format - id only, need to fetch via xrange
      entries.push({ id: item, fields: [] });
    }
  }
  return entries;
}

async function autoclaimLoop(
  group: string,
  consumer: string,
  intervalMs: number
): Promise<void> {
  while (true) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const [, claimed] = await redis.xautoclaim(
        STREAM,
        group,
        consumer,
        PENDING_IDLE_MS,
        "0"
      );

      const entries = parseAutoclaimEntries(
        Array.isArray(claimed) ? claimed : []
      );

      for (const entry of entries) {
        if (entry.fields.length === 0) {
          const range = await redis.xrange(STREAM, entry.id, entry.id, 1);
          if (range.length > 0) {
            entry.fields = range[0][1];
          }
        }
        if (entry.fields.length > 0) {
          try {
            await handleMessage(group, consumer, STREAM, entry);
          } catch (err) {
            console.error(
              `[Worker] Error processing claimed ${entry.id}:`,
              (err as Error)?.message
            );
            await redis.incrementRetryCount(STREAM, entry.id);
          }
        }
      }
    } catch (err) {
      console.error(
        `[Worker ${group}/${consumer}] Autoclaim error:`,
        (err as Error)?.message
      );
    }
  }
}

export function startWorkers(): void {
  const client = redis.getClient();
  if (!client) {
    console.log("[Workers] Redis not configured, skipping consumer workers");
    return;
  }

  const groups = ["observer-workers", "evaluator-workers"];
  const consumerId = `worker-${process.pid}-${Date.now()}`;

  for (const group of groups) {
    workerLoop(group, consumerId, BLOCK_MS, RETRY_COUNT).catch((err) => {
      console.error(`[Worker ${group}] Fatal:`, err);
    });
    autoclaimLoop(group, consumerId, 15_000).catch((err) => {
      console.error(`[Worker ${group}] Autoclaim fatal:`, err);
    });
  }
  console.log("[Workers] Started consumer workers for", groups.join(", "));
}
