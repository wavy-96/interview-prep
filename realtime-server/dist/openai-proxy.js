import WebSocket from "ws";
import { getSessionContext, buildInterviewerInstructions } from "./session-context.js";
import { addTranscript, clearBuffer, flushNow } from "./transcript-store.js";
import { markSessionErrored } from "./session-status.js";
const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-realtime";
const OPENAI_BETA = "realtime=v1";
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];
function extractTranscriptFromMessage(sessionId, msg) {
    const now = Date.now();
    const ts = now;
    if (msg.type === "conversation.item.created" && msg.item) {
        const item = msg.item;
        const speaker = item.role === "user"
            ? "candidate"
            : item.role === "assistant"
                ? "interviewer"
                : "system";
        const content = item.content;
        if (Array.isArray(content)) {
            for (const part of content) {
                const text = part.transcript ?? part.text;
                if (text && typeof text === "string") {
                    addTranscript({
                        sessionId,
                        speaker,
                        content: text,
                        timestampMs: ts,
                        openaiItemId: item.id ?? null,
                    });
                }
            }
        }
    }
    if (msg.type === "conversation.item.done" && msg.item) {
        const item = msg.item;
        const speaker = item.role === "user"
            ? "candidate"
            : item.role === "assistant"
                ? "interviewer"
                : "system";
        const content = item.content;
        if (Array.isArray(content)) {
            for (const part of content) {
                const text = part.transcript ?? part.text;
                if (text && typeof text === "string") {
                    addTranscript({
                        sessionId,
                        speaker,
                        content: text,
                        timestampMs: ts,
                        openaiItemId: item.id ?? null,
                    });
                }
            }
        }
    }
    if (msg.type === "conversation.item.input_audio_transcription.completed" && msg.transcript) {
        addTranscript({
            sessionId,
            speaker: "candidate",
            content: msg.transcript,
            timestampMs: ts,
            openaiItemId: msg.item_id ?? null,
        });
    }
    if (msg.type === "response.output_audio_transcript.done" && msg.transcript) {
        addTranscript({
            sessionId,
            speaker: "interviewer",
            content: msg.transcript,
            timestampMs: ts,
            openaiItemId: msg.item_id ?? null,
        });
    }
}
export function createOpenAIProxy(session, callbacks) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey?.trim()) {
        callbacks.onError("provider_unavailable", "OpenAI API key not configured");
        return null;
    }
    let ws = null;
    let isClosed = false;
    let retryAttempt = 0;
    async function cleanup() {
        if (isClosed)
            return;
        isClosed = true;
        if (ws) {
            try {
                ws.removeAllListeners();
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            }
            catch {
                /* ignore */
            }
            ws = null;
        }
        await flushNow(session.sessionId).catch((err) => {
            console.error("[OpenAI] Flush error on cleanup:", err?.message);
        });
        clearBuffer(session.sessionId);
        callbacks.onClose();
    }
    function doConnect() {
        if (isClosed)
            return;
        const socket = new WebSocket(OPENAI_REALTIME_URL, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "OpenAI-Beta": OPENAI_BETA,
            },
        });
        ws = socket;
        socket.on("open", async () => {
            if (isClosed || !ws)
                return;
            try {
                const ctx = await getSessionContext(session.sessionId);
                const instructions = ctx
                    ? buildInterviewerInstructions(ctx)
                    : "You are a technical interview AI. Be concise and professional.";
                const config = {
                    type: "session.update",
                    session: {
                        type: "realtime",
                        model: "gpt-realtime",
                        instructions,
                        output_modalities: ["audio"],
                        audio: {
                            input: {
                                format: { type: "audio/pcm", rate: 24000 },
                                turn_detection: {
                                    type: "server_vad",
                                    threshold: 0.5,
                                    prefix_padding_ms: 300,
                                    silence_duration_ms: 500,
                                    create_response: true,
                                    interrupt_response: true,
                                },
                            },
                            output: {
                                format: { type: "audio/pcm", rate: 24000 },
                                voice: "alloy",
                            },
                        },
                    },
                };
                ws.send(JSON.stringify(config));
            }
            catch (err) {
                console.error("[OpenAI] Session config error:", err?.message);
                callbacks.onError("provider_unavailable", "Failed to configure session");
                cleanup();
            }
        });
        socket.on("message", (data) => {
            if (isClosed)
                return;
            const str = typeof data === "string" ? data : data.toString();
            try {
                const msg = JSON.parse(str);
                extractTranscriptFromMessage(session.sessionId, msg);
                if (msg.type === "error") {
                    const err = msg.error;
                    const code = err?.code ?? "error";
                    if (code === "rate_limit_exceeded" || String(err?.message ?? "").includes("429")) {
                        callbacks.onError("rate_limit_exceeded", "Too many requests. Please wait a moment.");
                        return;
                    }
                }
            }
            catch {
                /* ignore parse errors */
            }
            callbacks.onMessage(str);
        });
        socket.on("error", (err) => {
            if (!isClosed) {
                console.error("[OpenAI] WebSocket error:", err?.message);
            }
        });
        socket.on("close", () => {
            if (isClosed)
                return;
            ws = null;
            if (retryAttempt < MAX_RETRIES) {
                const delay = RETRY_DELAYS_MS[retryAttempt] ?? 4000;
                retryAttempt++;
                console.log(`[OpenAI] Reconnecting in ${delay}ms (attempt ${retryAttempt}/${MAX_RETRIES})`);
                setTimeout(doConnect, delay);
            }
            else {
                console.error("[OpenAI] All retries exhausted");
                markSessionErrored(session.sessionId).catch(() => { });
                callbacks.onError("provider_unavailable", "Voice provider unavailable. Please try again.");
                cleanup();
            }
        });
    }
    doConnect();
    function injectTimeWarning(text) {
        if (isClosed || !ws || ws.readyState !== WebSocket.OPEN)
            return;
        try {
            const event = {
                type: "response.create",
                response: {
                    input: [
                        {
                            type: "message",
                            role: "system",
                            content: [{ type: "input_text", text: `Naturally mention to the candidate: ${text}. Say it conversationally as part of the interview flow — don't make it sound like a robotic announcement.` }],
                        },
                    ],
                    conversation: "auto",
                },
            };
            ws.send(JSON.stringify(event));
        }
        catch (err) {
            console.error("[OpenAI] injectTimeWarning error:", err?.message);
        }
    }
    function injectObserverInsights(text) {
        if (isClosed || !ws || ws.readyState !== WebSocket.OPEN)
            return;
        try {
            const event = {
                type: "response.create",
                response: {
                    input: [
                        {
                            type: "message",
                            role: "system",
                            content: [{ type: "input_text", text: `Background context about the candidate's code (use naturally in conversation, don't announce "my observer says" — just weave it in naturally): ${text}` }],
                        },
                    ],
                    conversation: "auto",
                },
            };
            ws.send(JSON.stringify(event));
        }
        catch (err) {
            console.error("[OpenAI] injectObserverInsights error:", err?.message);
        }
    }
    return {
        send(data) {
            if (isClosed || !ws || ws.readyState !== WebSocket.OPEN)
                return;
            try {
                ws.send(data);
            }
            catch (err) {
                console.error("[OpenAI] Send error:", err?.message);
                callbacks.onError("provider_unavailable");
            }
        },
        injectTimeWarning,
        injectObserverInsights,
        disconnect() {
            retryAttempt = MAX_RETRIES;
            cleanup();
        },
    };
}
