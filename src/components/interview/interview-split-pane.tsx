"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface InterviewSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  minRightPercent?: number;
}

export function InterviewSplitPane({
  left,
  right,
  defaultLeftPercent = 45,
  minLeftPercent = 25,
  minRightPercent = 25,
}: InterviewSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(minLeftPercent, Math.min(100 - minRightPercent, (x / rect.width) * 100));
      setLeftPercent(percent);
    },
    [isDragging, minLeftPercent, minRightPercent]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-[400px] overflow-hidden"
    >
      <div
        className="overflow-auto"
        style={{ width: `${leftPercent}%`, minWidth: `${minLeftPercent}%` }}
      >
        {left}
      </div>
      <div
        role="separator"
        aria-valuenow={leftPercent}
        aria-valuemin={minLeftPercent}
        aria-valuemax={100 - minRightPercent}
        className={`flex w-1 shrink-0 cursor-col-resize items-stretch bg-border-subtle transition-colors hover:bg-brand-clay/30 ${
          isDragging ? "bg-brand-clay/50" : ""
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="w-px bg-border-subtle" />
      </div>
      <div
        className="flex-1 overflow-hidden"
        style={{ minWidth: `${minRightPercent}%` }}
      >
        {right}
      </div>
    </div>
  );
}
