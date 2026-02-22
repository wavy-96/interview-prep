"use client";

import { useState, useEffect } from "react";
import { Monitor, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN_WIDTH = 1024;

interface DesktopGateProps {
  children: React.ReactNode;
}

export function DesktopGate({ children }: DesktopGateProps) {
  const [width, setWidth] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isWide = width !== null && width >= MIN_WIDTH;
  const showGate = !dismissed && width !== null && width < MIN_WIDTH;

  if (showGate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper p-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border-subtle bg-surface p-8 text-center">
          <Monitor className="h-16 w-16 text-ink-muted" aria-hidden />
          <h2 className="text-xl font-semibold text-ink">
            Desktop recommended
          </h2>
          <p className="text-body text-ink-muted">
            For the best experience, use a screen at least 1024px wide. The
            problem pane, code editor, and timer work best on larger displays.
          </p>
          <Button
            onClick={() => setDismissed(true)}
            variant="outline"
            className="gap-2"
          >
            Continue anyway
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
