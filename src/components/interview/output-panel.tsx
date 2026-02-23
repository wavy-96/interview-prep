"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

export interface TestCaseResult {
  index: number;
  passed: boolean;
  input: unknown;
  expected: unknown;
  actual: unknown;
  error?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration_ms: number;
  testResults?: TestCaseResult[];
  passed?: number;
  total?: number;
}

export interface ExecutionError {
  error: string;
}

type OutputState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; result: ExecutionResult | ExecutionError };

interface OutputPanelProps {
  state: OutputState;
  onClear: () => void;
}

export function OutputPanel({ state, onClear }: OutputPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (state.status === "idle") {
    return (
      <div className="shrink-0 border-t border-border-subtle bg-[#1e1e1e]">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-between px-4 py-2 text-left text-body-sm text-ink-muted hover:bg-white/5"
        >
          <span>Output</span>
          <span className="text-caption">{collapsed ? "▼" : "▲"}</span>
        </button>
        {!collapsed && (
          <div className="max-h-48 overflow-auto px-4 py-3 font-mono text-sm text-ink-muted">
            <p>Run your code to see output here.</p>
          </div>
        )}
      </div>
    );
  }

  if (state.status === "running") {
    return (
      <div className="shrink-0 border-t border-border-subtle bg-[#1e1e1e]">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="flex items-center gap-2 text-body-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running…
          </span>
        </div>
      </div>
    );
  }

  const result = state.result;
  const isError = "error" in result;
  const execResult = !isError ? (result as ExecutionResult) : null;
  const errResult = isError ? (result as ExecutionError) : null;
  const testResults = execResult?.testResults ?? [];
  const hasTests = testResults.length > 0;

  return (
    <div className="shrink-0 border-t border-border-subtle bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-body-sm text-ink-muted hover:text-ink"
        >
          <span>Output</span>
          <span>{collapsed ? "▼" : "▲"}</span>
          {execResult && (
            <span className="text-caption">
              {hasTests
                ? `${execResult.passed ?? 0}/${execResult.total ?? 0} tests passed`
                : `Completed in ${execResult.duration_ms}ms`}
              {execResult.exitCode !== 0 && !hasTests && ` · exit code ${execResult.exitCode}`}
            </span>
          )}
        </button>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 gap-1">
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>
      {!collapsed && (
        <div className="max-h-64 overflow-auto px-4 py-3 font-mono text-sm">
          {errResult && (
            <pre className="whitespace-pre-wrap text-red-400">{errResult.error}</pre>
          )}
          {hasTests && (
            <div className="mb-3 space-y-2">
              {testResults.map((t, i) => (
                <div
                  key={i}
                  className={`rounded border px-2 py-1.5 text-xs ${
                    t.passed
                      ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                      : "border-red-500/50 bg-red-950/30 text-red-300"
                  }`}
                >
                  <span className="font-semibold">
                    {t.passed ? "✅" : "❌"} Test {t.index + 1}
                  </span>
                  {!t.passed && (
                    <div className="mt-1 space-y-0.5">
                      <div>Expected: {JSON.stringify(t.expected)}</div>
                      <div>Actual: {t.error ?? JSON.stringify(t.actual)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {execResult && execResult.stdout && !hasTests && (
            <pre className="whitespace-pre-wrap text-emerald-300">{execResult.stdout}</pre>
          )}
          {execResult && execResult.stderr && (
            <pre className="mt-2 whitespace-pre-wrap text-amber-400">{execResult.stderr}</pre>
          )}
          {execResult &&
            !execResult.stdout &&
            !execResult.stderr &&
            execResult.exitCode === 0 &&
            !hasTests && <p className="text-ink-muted">(no output)</p>}
        </div>
      )}
    </div>
  );
}
