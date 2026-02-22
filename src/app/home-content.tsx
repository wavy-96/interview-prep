"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/pricing";
import { motion } from "motion/react";

export function HomeContent() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-end px-6 py-4 sm:px-8"
      >
        <Link
          href="/login"
          className="text-body-sm font-medium text-ink-muted hover:text-ink"
        >
          Log in
        </Link>
      </motion.header>

      {/* Hero */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-12 sm:px-8">
        <main className="mx-auto max-w-2xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-[2.25rem] font-medium leading-[1.2] text-ink sm:text-[2.75rem]"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Practice interviews with AI.
            <br />
            Land your dream role.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mt-6 text-body text-ink-muted"
          >
            Voice AI interviewer, real-time code observation, and post-interview
            evaluation. Get feedback, improve your answers, and build confidence.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <Button
              asChild
              size="lg"
              className="mt-8 bg-brand-clay hover:bg-brand-clay-hover"
            >
              <Link href="/signup">Start Practicing Free</Link>
            </Button>
            <p className="mt-3 text-caption text-ink-faint">
              {PRICING.free.credits} free sessions · No credit card required
            </p>
          </motion.div>
        </main>
      </section>

      {/* Features */}
      <section className="border-t border-border-subtle bg-surface px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center font-serif text-[1.5rem] font-medium leading-[1.35] text-ink"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            How it works
          </motion.h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureCard
              title="Voice AI Interviewer"
              description="Converse naturally with an AI that asks questions, listens to your answers, and adapts the conversation—just like a real interview."
              delay={0}
            />
            <FeatureCard
              title="Real-time Code Observation"
              description="Write code in a live editor. The AI watches your approach, offers hints when you're stuck, and evaluates your problem-solving."
              delay={0.1}
            />
            <FeatureCard
              title="Post-Interview Evaluation"
              description="Get a detailed breakdown: strengths, improvements, and scores. Learn from every session and track your progress."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border-subtle px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center font-serif text-[1.5rem] font-medium leading-[1.35] text-ink"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Simple pricing
          </motion.h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <PricingCard
              name={PRICING.free.name}
              price={PRICING.free.price}
              description={PRICING.free.description}
              features={PRICING.free.features}
              cta="Get started"
              ctaHref="/signup"
              highlighted={false}
              delay={0}
            />
            <PricingCard
              name={PRICING.pro.name}
              price={PRICING.pro.price}
              period={PRICING.pro.period}
              description={PRICING.pro.description}
              features={PRICING.pro.features}
              cta="Coming soon"
              ctaHref={null}
              highlighted
              delay={0.1}
            />
            <PricingCard
              name={PRICING.enterprise.name}
              price={null}
              description={PRICING.enterprise.description}
              features={PRICING.enterprise.features}
              cta="Contact us"
              ctaHref="mailto:hello@example.com"
              highlighted={false}
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle px-6 py-8 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-caption text-ink-muted">
            Made by humans & AI · © {new Date().getFullYear()}
          </p>
          <nav className="flex gap-6">
            <Link
              href="/terms"
              className="text-caption text-ink-muted hover:text-ink"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-caption text-ink-muted hover:text-ink"
            >
              Privacy Policy
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-ink-muted hover:text-ink"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  delay,
}: {
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl border border-border-subtle bg-paper p-6 shadow-sm"
    >
      <h3 className="font-medium text-ink">{title}</h3>
      <p className="mt-2 text-body-sm text-ink-muted">{description}</p>
    </motion.div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted,
  delay,
}: {
  name: string;
  price: number | null;
  period?: string;
  description: string;
  features: readonly string[];
  cta: string;
  ctaHref: string | null;
  highlighted?: boolean;
  delay: number;
}) {
  const CtaButton = ctaHref ? (
    <Button
      asChild
      variant={highlighted ? "default" : "outline"}
      className={`mt-6 w-full ${highlighted ? "bg-brand-clay hover:bg-brand-clay-hover" : ""}`}
    >
      <Link href={ctaHref}>{cta}</Link>
    </Button>
  ) : (
    <Button
      variant="outline"
      disabled
      className="mt-6 w-full"
    >
      {cta}
    </Button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-xl border p-6 ${
        highlighted
          ? "border-brand-clay bg-brand-sand/30 shadow-md"
          : "border-border-subtle bg-surface"
      }`}
    >
      <h3 className="font-medium text-ink">{name}</h3>
      <p className="mt-1 text-body-sm text-ink-muted">{description}</p>
      <div className="mt-4">
        {price !== null ? (
          <span className="font-serif text-2xl text-ink">
            ${price}
            {period && (
              <span className="text-body-sm font-normal text-ink-muted">
                /{period}
              </span>
            )}
          </span>
        ) : (
          <span className="font-serif text-2xl text-ink">Custom</span>
        )}
      </div>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-body-sm text-ink-muted">
            <span className="text-status-success">✓</span>
            {f}
          </li>
        ))}
      </ul>
      {CtaButton}
    </motion.div>
  );
}
