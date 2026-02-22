"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AiOrb } from "@/components/ui/ai-orb";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { SparklesCore } from "@/components/ui/sparkles";

export function DesignClient() {
  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <h1
          className="font-serif text-[2.25rem] leading-[1.2] text-ink"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Design System Test
        </h1>

        <p
          className="text-body font-sans text-ink"
          style={{ fontSize: "1rem", lineHeight: 1.6 }}
        >
          This page verifies the Technical Zen design system. Body text uses
          Inter for clarity and legibility across dashboard and UI elements.
        </p>

        <pre
          className="overflow-x-auto rounded-lg bg-code-bg p-4 font-mono text-[0.875rem] leading-[1.6] text-white"
          style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
        >
          <code>{`const greeting = "Hello, Interview Prep!";
console.log(greeting);`}</code>
        </pre>

        <div className="flex gap-4">
          <Button
            onClick={() => toast.success("Design system verified!")}
            className="bg-brand-clay hover:bg-brand-clay-hover"
          >
            Trigger Toast
          </Button>
          <Button variant="outline">Outline Button</Button>
        </div>

        <section>
          <h2
            className="mb-4 font-serif text-[1.5rem] font-medium text-ink"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Color Palette
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            <ColorSwatch name="paper" className="bg-paper" />
            <ColorSwatch name="paper-hover" className="bg-paper-hover" />
            <ColorSwatch
              name="surface"
              className="bg-surface border border-border-subtle"
            />
            <ColorSwatch name="ink" className="bg-ink text-white" />
            <ColorSwatch name="ink-muted" className="bg-ink-muted text-white" />
            <ColorSwatch name="brand-clay" className="bg-brand-clay text-white" />
            <ColorSwatch
              name="brand-forest"
              className="bg-brand-forest text-white"
            />
            <ColorSwatch
              name="status-success"
              className="bg-status-success text-white"
            />
            <ColorSwatch name="status-error" className="bg-status-error text-white" />
            <ColorSwatch name="status-warning" className="bg-status-warning text-ink" />
          </div>
        </section>

        <section>
          <h2
            className="mb-4 font-serif text-[1.5rem] font-medium text-ink"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Aceternity Components
          </h2>
          <div className="relative">
            <div className="absolute right-0 top-0 h-32 w-48">
              <SparklesCore
                background="transparent"
                particleColor="#d97757"
                particleDensity={80}
              />
            </div>
            <BentoGrid>
              <BentoGridItem
                title="Bento Grid"
                description="Aceternity Bento Grid component"
                header={<div className="h-24 rounded-lg bg-brand-sand" />}
              />
              <BentoGridItem
                title="AI Orb"
                description="Dedicated orb component for interviewer presence"
                header={
                  <div className="flex h-24 items-center justify-center rounded-lg bg-brand-forest/10">
                    <AiOrb className="size-16" />
                  </div>
                }
              />
            </BentoGrid>
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorSwatch({
  name,
  className,
}: {
  name: string;
  className: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle">
      <div className={`h-16 ${className}`} />
      <p className="bg-surface px-2 py-1 text-caption font-medium text-ink-muted">
        {name}
      </p>
    </div>
  );
}
