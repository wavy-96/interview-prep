"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VoiceInterview } from "@/components/voice/voice-interview";
import { toast } from "sonner";

interface InterviewVoiceClientProps {
  sessionId: string;
}

export function InterviewVoiceClient({ sessionId }: InterviewVoiceClientProps) {
  const router = useRouter();
  const [tokenData, setTokenData] = useState<{
    token: string;
    wsUrl: string;
  } | null>(null);

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
          console.error("[Voice] Token fetch failed:", err);
          toast.error(err instanceof Error ? err.message : "Failed to connect voice");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <VoiceInterview
      sessionId={sessionId}
      wsToken={tokenData?.token ?? null}
      wsUrl={tokenData?.wsUrl ?? ""}
      onError={(msg) => toast.error(msg)}
      onSessionEnded={() => router.push(`/sessions/${sessionId}`)}
    />
  );
}
