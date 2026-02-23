"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface EndInterviewButtonProps {
  sessionId: string;
}

export function EndInterviewButton({ sessionId }: EndInterviewButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnd = async () => {
    if (!confirm("End this interview? Your progress will be saved.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to end session");
      }

      toast.success("Interview ended");
      router.push(`/sessions/${sessionId}/summary`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to end session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEnd}
      disabled={loading}
      className="rounded-lg bg-brand-clay px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-clay/90 disabled:opacity-50"
    >
      {loading ? "Ending…" : "End Interview"}
    </button>
  );
}
