"use client";

import { useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="flex h-64 items-center justify-center bg-[#1e1e1e] text-ink-muted">Loading editor…</div> }
);

const LANG_MAP: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  java: "java",
};

interface InterviewMonacoEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  onLayout?: () => void;
  className?: string;
}

export function InterviewMonacoEditor({
  value,
  language,
  onChange,
  onLayout,
  className = "",
}: InterviewMonacoEditorProps) {
  const editorRef = useRef<{ layout: () => void } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticChangeRef = useRef(false);

  const handleMount = useCallback(
    (editor: { layout: () => void; updateOptions: (opts: Record<string, unknown>) => void }) => {
      editorRef.current = editor;
      editor.updateOptions({
        lineNumbers: "on",
        bracketPairColorization: { enabled: true },
        autoIndent: "full",
        tabSize: 4,
        insertSpaces: true,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
      });
      onLayout?.();
    },
    [onLayout]
  );

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (isProgrammaticChangeRef.current) return;
      onChange?.(newValue ?? "");
    },
    [onChange]
  );

  const handleResize = useCallback(() => {
    editorRef.current?.layout();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(handleResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [handleResize]);

  const monacoLang = LANG_MAP[language] ?? "plaintext";

  return (
    <div ref={containerRef} className={`h-full min-h-[300px] ${className}`}>
      <MonacoEditor
        height="100%"
        language={monacoLang}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          wordWrap: "on",
          scrollBeyondLastLine: false,
          padding: { top: 12 },
        }}
        loading={null}
      />
    </div>
  );
}

export { LANG_MAP };
