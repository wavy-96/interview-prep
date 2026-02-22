"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { VoiceInterview } from "@/components/voice/voice-interview";
import { EndInterviewButton } from "./end-interview-button";

const MAX_CODE_SIZE = 50 * 1024;

interface InterviewWsContextValue {
  sendCodeEdit: (code: string, language: string) => void;
  tokenData: { token: string; wsUrl: string } | null;
}

const InterviewWsContext = createContext<InterviewWsContextValue | null>(null);

export function useInterviewWs() {
  const ctx = useContext(InterviewWsContext);
  return ctx;
}

interface InterviewWsProviderProps {
  sessionId: string;
  children: ReactNode;
}

export function InterviewWsProvider({ sessionId, children }: InterviewWsProviderProps) {
  const router = useRouter();
  const [tokenData, setTokenData] = useState<{ token: string; wsUrl: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/realtime/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(data.error ?? `Token request failed (${res.status})`);
        }
        if (data.token && data.wsUrl) {
          setTokenData({ token: data.token, wsUrl: data.wsUrl });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[InterviewWs] Token fetch failed:", err);
          toast.error(err instanceof Error ? err.message : "Failed to connect");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const sendCodeEdit = useCallback((code: string, language: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const size = new TextEncoder().encode(code).length;
    if (size > MAX_CODE_SIZE) return;
    try {
      ws.send(JSON.stringify({ type: "code_edit", code, language }));
    } catch (err) {
      console.error("[InterviewWs] sendCodeEdit error:", err);
    }
  }, []);

  const value: InterviewWsContextValue = {
    sendCodeEdit,
    tokenData,
  };

  return (
    <InterviewWsContext.Provider value={value}>
      <div className="flex min-h-screen flex-col bg-paper">
        <header className="shrink-0 border-b border-border-subtle bg-surface px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-body-sm text-brand-clay hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <VoiceInterview
                sessionId={sessionId}
                wsToken={tokenData?.token ?? null}
                wsUrl={tokenData?.wsUrl ?? ""}
                wsRef={wsRef}
                onError={(msg) => toast.error(msg)}
                onSessionEnded={() => router.push(`/sessions/${sessionId}`)}
              />
              <EndInterviewButton sessionId={sessionId} />
            </div>
          </div>
        </header>
        {children}
      </div>
    </InterviewWsContext.Provider>
  );
}
