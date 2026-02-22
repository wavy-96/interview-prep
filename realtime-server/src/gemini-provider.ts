import WebSocket from "ws";
import type { Session } from "./auth.js";
import { getSessionContext, buildInterviewerInstructions } from "./session-context.js";
import { addTranscript, clearBuffer, flushNow } from "./transcript-store.js";
import { markSessionErrored } from "./session-status.js";
import { resample24kTo16k } from "./audio-utils.js";
import type { VoiceProvider, VoiceProviderCallbacks } from "./voice-provider.js";

const GEMINI_MODEL = "gemini-2.5-flash-preview-native-audio";
const GEMINI_WS_BASE = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function extractTranscriptFromGemini(
  sessionId: string,
  msg: {
    serverContent?: {
      modelTurn?: { parts?: Array<{ text?: { text?: string } }> };
      interpolatedTranscript?: { transcript?: string };
    };
    server_content?: {
      model_turn?: { parts?: Array<{ text?: { text?: string } }> };
      interpolated_transcript?: { transcript?: string };
    };
  }
): void {
  const ts = Date.now();
  const content = msg.serverContent ?? msg.server_content;
  if (!content) return;

  const interp =
    (content as { interpolatedTranscript?: { transcript?: string } }).interpolatedTranscript ??
    (content as { interpolated_transcript?: { transcript?: string } }).interpolated_transcript;
  if (interp?.transcript) {
    addTranscript({
      sessionId,
      speaker: "candidate",
      content: interp.transcript,
      timestampMs: ts,
      openaiItemId: null,
    });
  }

  const modelTurn =
    (content as { modelTurn?: { parts?: Array<{ text?: { text?: string } }> } }).modelTurn ??
    (content as { model_turn?: { parts?: Array<{ text?: { text?: string } }> } }).model_turn;
  if (modelTurn?.parts) {
    for (const part of modelTurn.parts) {
      const text = part.text?.text;
      if (text && typeof text === "string") {
        addTranscript({
          sessionId,
          speaker: "interviewer",
          content: text,
          timestampMs: ts,
          openaiItemId: null,
        });
      }
    }
  }
}

export function createGeminiProvider(
  session: Session,
  callbacks: VoiceProviderCallbacks
): VoiceProvider | null {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    callbacks.onError("provider_unavailable", "Gemini API key not configured");
    return null;
  }

  const url = `${GEMINI_WS_BASE}?key=${encodeURIComponent(apiKey.trim())}`;
  let ws: WebSocket | null = null;
  let isClosed = false;
  let retryAttempt = 0;

  /** Strip API key from error messages to prevent leakage in logs. */
  function sanitizeError(err: unknown): string {
    const msg = (err as Error)?.message ?? String(err);
    return msg.replace(/key=[^&\s]+/gi, "key=***");
  }

  async function cleanup() {
    if (isClosed) return;
    isClosed = true;
    if (ws) {
      try {
        ws.removeAllListeners();
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      } catch {
        /* ignore */
      }
      ws = null;
    }
    await flushNow(session.sessionId).catch((err) => {
      console.error("[Gemini] Flush error on cleanup:", (err as Error)?.message);
    });
    clearBuffer(session.sessionId);
    callbacks.onClose();
  }

  function doConnect(): void {
    if (isClosed) return;
    const socket = new WebSocket(url);
    ws = socket;

    socket.on("open", async () => {
      if (isClosed || !ws) return;
      try {
        const ctx = await getSessionContext(session.sessionId);
        const instructions = ctx
          ? buildInterviewerInstructions(ctx)
          : "You are a technical interview AI. Be concise and professional.";

        const setup = {
          setup: {
            model: GEMINI_MODEL,
            systemInstruction: {
              parts: [{ text: instructions }],
            },
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Puck",
                  },
                },
              },
            },
          },
        };
        ws.send(JSON.stringify(setup));
      } catch (err) {
        console.error("[Gemini] Session config error:", sanitizeError(err));
        callbacks.onError("provider_unavailable", "Failed to configure session");
        cleanup();
      }
    });

    socket.on("message", (data: Buffer | string) => {
      if (isClosed) return;
      try {
        const str = typeof data === "string" ? data : data.toString();
        const msg = JSON.parse(str) as Record<string, unknown>;
        extractTranscriptFromGemini(session.sessionId, msg as Parameters<typeof extractTranscriptFromGemini>[1]);

        const serverContent =
          (msg as { serverContent?: unknown }).serverContent ??
          (msg as { server_content?: unknown }).server_content;
        if (serverContent && typeof serverContent === "object") {
          const sc = serverContent as {
            modelTurn?: { parts?: Array<{ inlineData?: { data?: string }; inline_data?: { data?: string } }> };
            model_turn?: { parts?: Array<{ inlineData?: { data?: string }; inline_data?: { data?: string } }> };
          };
          const turn = sc.modelTurn ?? sc.model_turn;
          const parts = turn?.parts;
          if (Array.isArray(parts)) {
            for (const part of parts) {
              const inline = part.inlineData ?? part.inline_data;
              const audio = inline?.data;
              if (audio && typeof audio === "string") {
                callbacks.onMessage(
                  JSON.stringify({ type: "response.output_audio.delta", delta: audio })
                );
              }
            }
          }
        }

        if (
          (msg as { setupComplete?: unknown }).setupComplete ??
          (msg as { setup_complete?: unknown }).setup_complete
        ) {
          callbacks.onMessage(JSON.stringify({ type: "session.updated" }));
        }
      } catch {
        callbacks.onMessage(data);
      }
    });

    socket.on("error", (err) => {
      if (!isClosed) {
        console.error("[Gemini] WebSocket error:", sanitizeError(err));
      }
    });

    socket.on("close", () => {
      if (isClosed) return;
      ws = null;
      if (retryAttempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[retryAttempt] ?? 4000;
        retryAttempt++;
        console.log(`[Gemini] Reconnecting in ${delay}ms (attempt ${retryAttempt}/${MAX_RETRIES})`);
        setTimeout(doConnect, delay);
      } else {
        console.error("[Gemini] All retries exhausted");
        markSessionErrored(session.sessionId).catch(() => {});
        callbacks.onError("provider_unavailable", "Voice provider unavailable. Please try again.");
        cleanup();
      }
    });
  }

  doConnect();

  function send(data: string): void {
    if (isClosed || !ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      const msg = JSON.parse(data) as { type?: string; audio?: string };
      if (msg.type === "input_audio_buffer.append" && msg.audio) {
        const raw = Buffer.from(msg.audio, "base64");
        const resampled = resample24kTo16k(raw.buffer);
        const b64 = Buffer.from(resampled).toString("base64");
        ws.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: b64,
                },
              ],
            },
          })
        );
      } else if (msg.type === "input_audio_buffer.commit") {
        ws.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [],
              turnComplete: true,
            },
          })
        );
      } else if (msg.type === "response.cancel") {
        ws.send(JSON.stringify({ realtimeInput: { turnComplete: true } }));
      }
    } catch (err) {
      console.error("[Gemini] Send error:", sanitizeError(err));
      callbacks.onError("provider_unavailable");
    }
  }

  function injectTimeWarning(text: string): void {
    if (isClosed || !ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      // Send as a model turn to prime the AI with what to say,
      // rather than as a user turn which could be treated as candidate speech.
      ws.send(
        JSON.stringify({
          clientContent: {
            turns: [
              {
                role: "model",
                parts: [{ text: `Naturally mention to the candidate: ${text}. Say it conversationally as part of the interview flow.` }],
              },
            ],
            turnComplete: true,
          },
        })
      );
    } catch (err) {
      console.error("[Gemini] injectTimeWarning error:", sanitizeError(err));
    }
  }

  return {
    send,
    injectTimeWarning,
    disconnect() {
      retryAttempt = MAX_RETRIES;
      cleanup();
    },
  };
}
