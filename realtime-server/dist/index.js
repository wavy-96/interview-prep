import { createServer } from "http";
import { WebSocketServer } from "ws";
import { auth } from "./auth.js";
import { eventBus } from "./events.js";
import { createVoiceProvider } from "./voice-provider-factory.js";
import { redis } from "./redis.js";
import { registerSessionSocket, registerTimeWarningCallback, startOrResumeTimer, unregisterSessionSocket, } from "./timer.js";
import { startWorkers } from "./workers.js";
const PORT = parseInt(process.env.PORT ?? "8080", 10);
const startTime = Date.now();
let connectionCount = 0;
async function init() {
    try {
        await redis.ensureConsumerGroup("events", "observer-workers");
        await redis.ensureConsumerGroup("events", "evaluator-workers");
    }
    catch (err) {
        console.warn("Redis consumer groups init (optional):", err?.message);
    }
}
init();
startWorkers();
const server = createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            ok: true,
            uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
            connections: connectionCount,
        }));
        return;
    }
    res.writeHead(404);
    res.end();
});
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", async (ws, req) => {
    connectionCount++;
    const protocol = req.headers["sec-websocket-protocol"];
    const token = protocol?.split(",").map((p) => p.trim())[0];
    try {
        const session = await auth.verify(token);
        if (!session) {
            ws.close(4001, "Unauthorized");
            connectionCount--;
            return;
        }
        let voiceProvider = null;
        voiceProvider = await createVoiceProvider(session, {
            onMessage: (data) => {
                if (ws.readyState === 1) {
                    ws.send(data);
                }
            },
            onError: (code, message) => {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({
                        type: "error",
                        code,
                        message: message ?? "Voice provider unavailable",
                    }));
                }
            },
            onClose: () => {
                voiceProvider = null;
            },
        });
        // If the provider couldn't be created (e.g. missing API key), notify the
        // client immediately so it doesn't sit in a silent "connected" state.
        if (!voiceProvider) {
            ws.send(JSON.stringify({
                type: "error",
                code: "provider_unavailable",
                message: "Voice provider is not configured. Please try again later.",
            }));
        }
        registerSessionSocket(session.sessionId, ws);
        registerTimeWarningCallback(session.sessionId, (remainingMs) => {
            if (!voiceProvider)
                return;
            const text = remainingMs <= 60 * 1000
                ? "We have about a minute left, so let's start wrapping up. Can you walk me through your overall approach?"
                : "Just a heads up, we have about five minutes left. How are you feeling about where you are?";
            voiceProvider.injectTimeWarning(text);
        });
        startOrResumeTimer(session.sessionId).then((state) => {
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({
                    type: "session.timer",
                    remainingMs: state.remainingMs,
                    expiresAt: state.expiresAt,
                    ended: state.remainingMs <= 0,
                }));
            }
        });
        ws.on("message", (data) => {
            eventBus.handleMessage(ws, session, data, {
                forwardToOpenAI: voiceProvider ? (d) => voiceProvider.send(d) : undefined,
            });
        });
        ws.on("close", () => {
            unregisterSessionSocket(session.sessionId, ws);
            voiceProvider?.disconnect();
            connectionCount--;
        });
    }
    catch {
        ws.close(4001, "Unauthorized");
        connectionCount--;
    }
});
server.listen(PORT, () => {
    console.log(`Realtime server listening on port ${PORT}`);
});
