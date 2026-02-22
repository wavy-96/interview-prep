"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Mic } from "lucide-react";
import { useInterviewWs } from "./interview-ws-context";
import { InterviewMonacoEditor } from "@/components/interview/interview-monaco-editor";
import { InterviewSplitPane } from "@/components/interview/interview-split-pane";

const CODE_EDIT_DEBOUNCE_MS = 300;
const MAX_CODE_SIZE = 50 * 1024;

interface InterviewClientProps {
  sessionId: string;
  language: string;
  problem: {
    title: string;
    description: string;
    difficulty: string;
    category?: string[];
    starter_code?: Record<string, string>;
  } | null;
}

export function InterviewClient({
  sessionId,
  language,
  problem,
}: InterviewClientProps) {
  const wsCtx = useInterviewWs();
  const starterCode =
    problem?.starter_code?.[language] ?? problem?.starter_code?.python ?? "";
  const [code, setCode] = useState(starterCode);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef(starterCode);
  const isProgrammaticRef = useRef(false);

  const handleEditorChange = useCallback(
    (value: string) => {
      setCode(value);
      if (!wsCtx?.sendCodeEdit) return;
      if (new TextEncoder().encode(value).length > MAX_CODE_SIZE) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        if (isProgrammaticRef.current) return;
        if (lastSentRef.current === value) return;
        lastSentRef.current = value;
        wsCtx.sendCodeEdit(value, language);
      }, CODE_EDIT_DEBOUNCE_MS);
    },
    [wsCtx, language]
  );

  useEffect(() => {
    isProgrammaticRef.current = true;
    lastSentRef.current = starterCode;
    setCode(starterCode);
    const t = setTimeout(() => {
      isProgrammaticRef.current = false;
    }, 100);
    return () => clearTimeout(t);
  }, [starterCode]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <main className="mx-auto flex flex-1 flex-col overflow-hidden p-4 md:max-w-6xl md:p-6">
      <InterviewSplitPane
        left={
          <section className="flex h-full flex-col overflow-auto rounded-lg border border-border-subtle bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 font-medium text-ink">
              <Mic className="h-4 w-4" />
              Problem
            </h2>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge
                variant={
                  problem?.difficulty === "easy"
                    ? "default"
                    : problem?.difficulty === "medium"
                      ? "secondary"
                      : "outline"
                }
              >
                {problem?.difficulty}
              </Badge>
              {problem?.category?.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
            <h3 className="font-serif text-lg font-medium text-ink">
              {problem?.title}
            </h3>
            <pre className="mt-3 flex-1 whitespace-pre-wrap text-body-sm text-ink-muted">
              {problem?.description}
            </pre>
          </section>
        }
        right={
          <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface">
            <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-2">
              <h2 className="flex items-center gap-2 font-medium text-ink">
                <Code className="h-4 w-4" />
                Code ({language})
              </h2>
              <Button variant="outline" size="sm" disabled>
                Run Code
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <InterviewMonacoEditor
                value={code}
                language={language}
                onChange={handleEditorChange}
              />
            </div>
          </section>
        }
      />
    </main>
  );
}
