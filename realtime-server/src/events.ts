import type { WebSocket } from "ws";
import type { Session } from "./auth.js";
import { redis } from "./redis.js";
import { endSessionEarly } from "./timer.js";
import { updateCode } from "./code-session-store.js";

const MAX_PAYLOAD = 64 * 1024;
const AUDIO_EVENTS = new Set([
  "input_audio_buffer.append",
  "input_audio_buffer.commit",
  "response.cancel",
]);
const ALLOWED_TYPES = new Set([
  ...AUDIO_EVENTS,
  "session.ping",
  "session.end_early",
  "code_edit",
]);

export interface EventHandlerOptions {
  forwardToOpenAI?: (data: string) => void;
}

export const eventBus = {
  async handleMessage(
    ws: WebSocket,
    session: Session,
    data: Buffer | string,
    options: EventHandlerOptions = {}
  ): Promise<void> {
    if (Buffer.byteLength(data) > MAX_PAYLOAD) {
      ws.close(1009, "Payload too large");
      return;
    }

    if (Buffer.isBuffer(data)) {
      ws.send(JSON.stringify({ type: "error", code: "binary_not_supported" }));
      return;
    }

    let msg: { type?: string; [k: string]: unknown };
    try {
      msg = JSON.parse(data as string);
    } catch {
      ws.send(JSON.stringify({ type: "error", code: "invalid_payload" }));
      return;
    }

    if (!msg || typeof msg.type !== "string") {
      ws.send(JSON.stringify({ type: "error", code: "invalid_payload" }));
      return;
    }

    if (!ALLOWED_TYPES.has(msg.type)) {
      ws.send(JSON.stringify({ type: "error", code: "invalid_event_type" }));
      return;
    }

    if (msg.type === "code_edit") {
      const code = typeof msg.code === "string" ? msg.code : "";
      const language = typeof msg.language === "string" ? msg.language : "python";
      updateCode(session.sessionId, code, language);
      await this.publishCodeEdit(session, { code, language });
      ws.send(JSON.stringify({ type: "ack", event: msg.type }));
      return;
    }

    if (msg.type === "session.end_early") {
      await endSessionEarly(session.sessionId);
      ws.send(JSON.stringify({ type: "ack", event: msg.type }));
      return;
    }

    if (AUDIO_EVENTS.has(msg.type)) {
      const forward = options.forwardToOpenAI;
      if (forward) {
        forward(data as string);
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            code: "provider_unavailable",
            message: "Voice provider not connected",
          })
        );
      }
      return;
    }

    ws.send(JSON.stringify({ type: "ack", event: msg.type }));
  },

  async publishCodeEdit(
    session: Session,
    payload: { code: string; language: string }
  ): Promise<void> {
    const { code, language } = payload;

    await redis.xadd(
      "events",
      "type", "code.edited",
      "sessionId", session.sessionId,
      "payload", JSON.stringify({ code, language })
    );
  },
};
