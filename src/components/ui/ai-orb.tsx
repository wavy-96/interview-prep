"use client";

import { motion } from "motion/react";
import { SparklesCore } from "@/components/ui/sparkles";

type AiOrbProps = {
  className?: string;
};

export function AiOrb({ className }: AiOrbProps) {
  return (
    <div
      className={`relative size-24 overflow-hidden rounded-full bg-brand-forest/15 ${className ?? ""}`}
    >
      <motion.div
        className="absolute inset-4 rounded-full bg-brand-clay/30 blur-xl"
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-8 rounded-full border border-brand-forest/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <SparklesCore
        className="absolute inset-0"
        background="transparent"
        particleColor="#d97757"
        particleDensity={45}
        minSize={0.8}
        maxSize={1.8}
      />
    </div>
  );
}
