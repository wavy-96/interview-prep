"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic, Volume2, Layout, Sparkles, ChevronRight, SkipForward } from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to AI Interview Prep",
    icon: Sparkles,
    content: (
      <ul className="mt-4 space-y-3 text-left text-body text-ink">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-brand-clay">•</span>
          <span>Practice technical interviews with an AI voice interviewer</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-brand-clay">•</span>
          <span>Write code in real-time while the AI observes your approach</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-brand-clay">•</span>
          <span>Get detailed feedback and scores after each session</span>
        </li>
      </ul>
    ),
  },
  {
    id: "mic",
    title: "Microphone Test",
    icon: Mic,
    content: null,
  },
  {
    id: "speaker",
    title: "Speaker Test",
    icon: Volume2,
    content: null,
  },
  {
    id: "layout",
    title: "Interview Screen",
    icon: Layout,
    content: (
      <div className="mt-4 space-y-3 text-left text-body text-ink">
        <p>
          During the interview you&apos;ll see: the problem description on the left, a code editor on the right, and a timer at the top. The AI will speak to you and listen to your responses.
        </p>
      </div>
    ),
  },
] as const;

async function markOnboardingComplete(): Promise<void> {
  const res = await fetch("/api/users/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarding_completed: true }),
  });
  if (!res.ok) {
    throw new Error("Failed to save onboarding state");
  }
}

export function OnboardingClient() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [micPassed, setMicPassed] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakerPlayed, setSpeakerPlayed] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const completeOnboarding = useCallback(async () => {
    try {
      await markOnboardingComplete();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Onboarding complete error:", err);
    }
  }, [router]);

  const handleNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      completeOnboarding();
    }
  }, [stepIndex, completeOnboarding]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Mic test: request permission and show level meter
  useEffect(() => {
    if (STEPS[stepIndex]?.id !== "mic") return;

    let cancelled = false;
    const threshold = 0.01;
    let peakLevel = 0;

    async function runMicTest() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);

        function checkLevel() {
          if (cancelled || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          const level = avg / 255;
          peakLevel = Math.max(peakLevel, level);
          setMicLevel(level);
          if (level > threshold) {
            setMicPassed(true);
          }
          animationRef.current = requestAnimationFrame(checkLevel);
        }
        checkLevel();
      } catch (err) {
        setMicError(
          err instanceof Error ? err.message : "Could not access microphone. Check browser permissions."
        );
      }
    }

    runMicTest();
    return () => {
      cancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      analyserRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [stepIndex]);

  // Speaker test: play short greeting on button click
  const playSpeakerTest = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSpeakerPlayed(true);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      "Hello! This is a quick speaker test. If you can hear this, your setup is ready for the interview."
    );
    u.rate = 0.95;
    // Some browsers (especially mobile) don't reliably fire onend,
    // so use a timeout fallback to unblock the user.
    const fallbackTimer = setTimeout(() => setSpeakerPlayed(true), 8000);
    u.onend = () => {
      clearTimeout(fallbackTimer);
      setSpeakerPlayed(true);
    };
    u.onerror = () => {
      clearTimeout(fallbackTimer);
      setSpeakerPlayed(true);
    };
    window.speechSynthesis.speak(u);
  }, []);

  const currentStep = STEPS[stepIndex];
  const Icon = currentStep?.icon ?? Sparkles;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-12">
      <div className="flex flex-1 flex-col">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-clay/10">
            <Icon className="h-5 w-5 text-brand-clay" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-ink-muted hover:text-ink"
          >
            <SkipForward className="mr-1 h-4 w-4" />
            Skip
          </Button>
        </div>

        <div className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-muted">
          Step {stepIndex + 1} of {STEPS.length}
        </div>
        <h1
          className="font-serif text-2xl font-medium text-ink"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          {currentStep?.title}
        </h1>

        {currentStep?.content}

        {currentStep?.id === "mic" && (
          <div className="mt-6 space-y-4">
            {micError ? (
              <div className="rounded-lg border border-status-error/30 bg-status-error/5 p-4 text-body-sm text-ink">
                <p className="font-medium">Microphone access denied or unavailable</p>
                <p className="mt-2 text-ink-muted">
                  Check your browser permissions, try a different browser (Chrome recommended), or ensure no other app is using your microphone.
                </p>
              </div>
            ) : (
              <>
                <p className="text-body-sm text-ink-muted">
                  Speak into your microphone. The meter will show when we detect your voice.
                </p>
                <div className="h-3 w-full overflow-hidden rounded-full bg-paper-hover">
                  <div
                    className="h-full rounded-full bg-brand-clay transition-all duration-75"
                    style={{
                      width: `${Math.min(100, micLevel * 500)}%`,
                    }}
                  />
                </div>
                {micPassed && (
                  <p className="text-body-sm font-medium text-status-success">Microphone working!</p>
                )}
              </>
            )}
          </div>
        )}

        {currentStep?.id === "speaker" && (
          <div className="mt-6 space-y-4">
            <p className="text-body-sm text-ink-muted">
              Click the button below to play a short greeting. You should hear the AI speak.
            </p>
            <Button
              onClick={playSpeakerTest}
              className="bg-brand-clay hover:bg-brand-clay/90"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Play Speaker Test
            </Button>
            {speakerPlayed && (
              <p className="text-body-sm font-medium text-status-success">Did you hear it? Continue when ready.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          onClick={handleNext}
          className="flex-1 bg-brand-clay hover:bg-brand-clay/90"
        >
          {stepIndex < STEPS.length - 1 ? "Continue" : "Get Started"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
