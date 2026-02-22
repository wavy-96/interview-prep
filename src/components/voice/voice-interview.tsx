"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";

const TARGET_SAMPLE_RATE = 24000;
const CHUNK_MS = 100;

interface VoiceInterviewProps {
  sessionId: string;
  wsToken: string | null;
  wsUrl: string;
  wsRef?: React.MutableRefObject<WebSocket | null>;
  onError?: (message: string) => void;
  onSessionEnded?: () => void;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function VoiceInterview({
  sessionId,
  wsToken,
  wsUrl,
  wsRef: externalWsRef,
  onError,
  onSessionEnded,
}: VoiceInterviewProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const sessionEndedRef = useRef(false);
  const micMutedRef = useRef(false);
  micMutedRef.current = micMuted;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const internalWsRef = useRef<WebSocket | null>(null);
  const wsRef = externalWsRef ?? internalWsRef;
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  // Use refs for callback props to avoid re-creating callbacks when props change
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onSessionEndedRef = useRef(onSessionEnded);
  onSessionEndedRef.current = onSessionEnded;

  const reportError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setStatus("error");
    onErrorRef.current?.(msg);
  }, []);

  // Playback uses a ref-based approach to avoid stale closure issues between
  // processPlaybackQueue and playAudioChunk calling each other.
  const processPlaybackQueueRef = useRef<() => void>(() => {});

  const processPlaybackQueue = useCallback(() => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;

    isPlayingRef.current = true;
    const chunk = playbackQueueRef.current.shift()!;
    const buffer = ctx.createBuffer(1, chunk.length, TARGET_SAMPLE_RATE);
    buffer.getChannelData(0).set(chunk);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      processPlaybackQueueRef.current();
    };
    source.start();
  }, []);

  processPlaybackQueueRef.current = processPlaybackQueue;

  const playAudioChunk = useCallback(
    (base64Audio: string) => {
      try {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const samples = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          float32[i] = samples[i] / 32768;
        }
        playbackQueueRef.current.push(float32);
        processPlaybackQueueRef.current();
      } catch (err) {
        console.error("[Voice] Playback decode error:", err);
      }
    },
    []
  );

  useEffect(() => {
    if (!wsToken?.trim() || !wsUrl?.trim()) {
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    const url = wsUrl.startsWith("ws") ? wsUrl : wsUrl.replace(/^http/, "ws");
    const ws = new WebSocket(url, wsToken);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      setErrorMessage(null);
      ws.send(JSON.stringify({ type: "session.ping" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "error") {
          reportError(msg.message ?? msg.code ?? "Connection error");
          return;
        }
        if (msg.type === "response.output_audio.delta" && msg.delta) {
          playAudioChunk(msg.delta);
        }
        if (msg.type === "conversation.item.created" && msg.item?.content) {
          for (const part of msg.item.content) {
            if (part.type === "output_audio" && part.audio) {
              playAudioChunk(part.audio);
            }
          }
        }
        if (msg.type === "conversation.item.added" && msg.item?.content) {
          for (const part of msg.item.content) {
            if (part.type === "output_audio" && part.audio) {
              playAudioChunk(part.audio);
            }
          }
        }
        if (msg.type === "session.timer") {
          setRemainingMs(msg.remainingMs ?? 0);
          if (msg.ended && !sessionEndedRef.current) {
            sessionEndedRef.current = true;
            onSessionEndedRef.current?.();
          }
        }
        if (msg.type === "session.ended" && !sessionEndedRef.current) {
          sessionEndedRef.current = true;
          onSessionEndedRef.current?.();
        }
      } catch {
        // Binary or non-JSON - ignore
      }
    };

    ws.onerror = () => {
      reportError("WebSocket connection failed");
    };

    ws.onclose = () => {
      wsRef.current = null;
      setStatus((s) => (s === "error" ? s : "idle"));
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [wsToken, wsUrl, reportError, playAudioChunk]);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: 48000,
      });
      audioContextRef.current = ctx;
      await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ScriptProcessorNode is deprecated in favor of AudioWorkletNode.
      // Using it here for MVP simplicity; migrate to AudioWorklet for production.
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const sendChunk = (samples: Float32Array) => {
        if (micMutedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const int16 = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          const s = Math.max(-1, Math.min(1, samples[i]));
          int16[i] = s < 0 ? s * 32768 : s * 32767;
        }
        const resampled = resample48to24(int16);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(resampled.buffer)));
        wsRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.append", audio: base64 })
        );
      };

      let buffer: number[] = [];
      const samplesNeeded = Math.floor((48000 * CHUNK_MS) / 1000 / 2);

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i++) {
          buffer.push(input[i]);
        }
        while (buffer.length >= samplesNeeded) {
          const chunk = buffer.splice(0, samplesNeeded);
          sendChunk(new Float32Array(chunk));
        }
      };

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      source.connect(processor);
      processor.connect(gainNode);
      gainNode.connect(ctx.destination);
    } catch (err) {
      reportError(
        err instanceof Error ? err.message : "Microphone access denied"
      );
    }
  }, [reportError]);

  const stopMic = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    if (status === "connected") {
      startMic();
    }
    return () => stopMic();
  }, [status, startMic, stopMic]);

  // Client-side countdown between server broadcasts (every 5s)
  useEffect(() => {
    if (remainingMs === null || remainingMs <= 0) return;
    const id = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev === null || prev <= 1000) {
          if (!sessionEndedRef.current) {
            sessionEndedRef.current = true;
            onSessionEndedRef.current?.();
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remainingMs]);

  const toggleMute = useCallback(() => {
    setMicMuted((m) => !m);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border-subtle bg-surface p-4">
      <h3 className="font-medium text-ink">Voice Interview</h3>
      {status === "idle" && !wsToken && (
        <p className="text-body-sm text-ink-muted">
          Start the session to connect your microphone.
        </p>
      )}
      {status === "connecting" && (
        <div className="flex items-center gap-2 text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting…
        </div>
      )}
      {status === "connected" && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {remainingMs !== null && (
            <div className="flex items-center gap-2 rounded border border-border-subtle px-3 py-1.5">
              <span className="font-mono text-lg font-medium tabular-nums text-ink">
                {formatTime(remainingMs)}
              </span>
              <span className="text-caption text-ink-muted">remaining</span>
            </div>
          )}
          <Button
            variant={micMuted ? "outline" : "default"}
            size="icon"
            onClick={toggleMute}
            title={micMuted ? "Unmute" : "Mute"}
          >
            {micMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <span className="text-body-sm text-ink-muted">
            {micMuted ? "Muted" : "Listening"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "session.end_early" }));
              }
            }}
          >
            End Early
          </Button>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-body-sm">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

function resample48to24(input: Int16Array): Int16Array {
  const output = new Int16Array(input.length / 2);
  for (let i = 0; i < output.length; i++) {
    output[i] = input[i * 2];
  }
  return output;
}
