import WebSocket from "ws";
import { getSessionContext, buildInterviewerInstructions } from "./session-context.js";
import { addTranscript, clearBuffer, flushNow } from "./transcript-store.js";
import { markSessionErrored } from "./session-status.js";
import { resample24kTo16k } from "./audio-utils.js";
const GEMINI_MODEL = "gemini-2.5-flash-preview-native-audio";
const GEMINI_WS_BASE = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
function extractTranscriptFromGemini(sessionId, msg) {
    const ts = Date.now();
    const content = msg.serverContent ?? msg.server_content;
    if (!content)
        return;
    const interp = content.interpolatedTranscript ??
        content.interpolated_transcript;
    if (interp?.transcript) {
        addTranscript({
            sessionId,
            speaker: "candidate",
            content: interp.transcript,
            timestampMs: ts,
            openaiItemId: null,
        });
    }
    const modelTurn = content.modelTurn ??
        content.model_turn;
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
export function createGeminiProvider(session, callbacks) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
    if (!apiKey?.trim()) {
        callbacks.onError("provider_unavailable", "Gemini API key not configured");
        return null;
    }
    const url = `${GEMINI_WS_BASE}?key=${encodeURIComponent(apiKey.trim())}`;
    let ws = null;
    let isClosed = false;
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
            console.error("[Gemini] Flush error on cleanup:", err?.message);
        });
        clearBuffer(session.sessionId);
        callbacks.onClose();
    }
    function doConnect() {
        if (isClosed)
            return;
        const socket = new WebSocket(url);
        ws = socket;
        socket.on("open", async () => {
            if (isClosed || !ws)
                return;
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
            }
            catch (err) {
                console.error("[Gemini] Session config error:", err?.message);
                callbacks.onError("provider_unavailable", "Failed to configure session");
                cleanup();
            }
        });
        socket.on("message", (data) => {
            if (isClosed)
                return;
            try {
                const str = typeof data === "string" ? data : data.toString();
                const msg = JSON.parse(str);
                extractTranscriptFromGemini(session.sessionId, msg);
                const serverContent = msg.serverContent ??
                    msg.server_content;
                if (serverContent && typeof serverContent === "object") {
                    const sc = serverContent;
                    const turn = sc.modelTurn ?? sc.model_turn;
                    const parts = turn?.parts;
                    if (Array.isArray(parts)) {
                        for (const part of parts) {
                            const inline = part.inlineData ?? part.inline_data;
                            const audio = inline?.data;
                            if (audio && typeof audio === "string") {
                                callbacks.onMessage(JSON.stringify({ type: "response.output_audio.delta", delta: audio }));
                            }
                        }
                    }
                }
                if (msg.setupComplete ??
                    msg.setup_complete) {
                    callbacks.onMessage(JSON.stringify({ type: "session.updated" }));
                }
            }
            catch {
                callbacks.onMessage(data);
            }
        });
        socket.on("error", (err) => {
            if (!isClosed) {
                console.error("[Gemini] WebSocket error:", err?.message);
            }
        });
        socket.on("close", () => {
            if (isClosed)
                return;
            ws = null;
            markSessionErrored(session.sessionId).catch(() => { });
            callbacks.onError("provider_unavailable", "Voice provider unavailable. Please try again.");
            cleanup();
        });
    }
    doConnect();
    function send(data) {
        if (isClosed || !ws || ws.readyState !== WebSocket.OPEN)
            return;
        try {
            const msg = JSON.parse(data);
            if (msg.type === "input_audio_buffer.append" && msg.audio) {
                const raw = Buffer.from(msg.audio, "base64");
                const resampled = resample24kTo16k(raw.buffer);
                const b64 = Buffer.from(resampled).toString("base64");
                ws.send(JSON.stringify({
                    realtimeInput: {
                        mediaChunks: [
                            {
                                mimeType: "audio/pcm;rate=16000",
                                data: b64,
                            },
                        ],
                    },
                }));
            }
            else if (msg.type === "input_audio_buffer.commit") {
                ws.send(JSON.stringify({
                    realtimeInput: {
                        mediaChunks: [],
                        turnComplete: true,
                    },
                }));
            }
            else if (msg.type === "response.cancel") {
                ws.send(JSON.stringify({ realtimeInput: { turnComplete: true } }));
            }
        }
        catch (err) {
            console.error("[Gemini] Send error:", err?.message);
            callbacks.onError("provider_unavailable");
        }
    }
    function injectTimeWarning(text) {
        if (isClosed || !ws || ws.readyState !== WebSocket.OPEN)
            return;
        try {
            ws.send(JSON.stringify({
                clientContent: {
                    turns: [
                        {
                            role: "user",
                            parts: [{ text: `[System: Say this aloud naturally: "${text}"]` }],
                        },
                    ],
                    turnComplete: true,
                },
            }));
        }
        catch (err) {
            console.error("[Gemini] injectTimeWarning error:", err?.message);
        }
    }
    return {
        send,
        injectTimeWarning,
        disconnect() {
            cleanup();
        },
    };
}
