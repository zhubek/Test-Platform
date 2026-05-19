"use client";

import { useRef, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export function SqlEditor({
  value,
  onChange,
  placeholder = "SELECT * FROM ...",
  height = "200px",
}: Props) {
  const { t } = useLocale();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const lines = value ? value.split("\n") : [""];
  const lineCount = Math.max(lines.length, 1);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  return (
    <div className="rounded-xl border border-gray-700/50 overflow-hidden" style={{ background: "#1e1e2e" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 h-8 border-b border-gray-700/40"
        style={{ background: "#181825" }}
      >
        <span className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-wider">
          {t("sqlEditor.label")}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[0.65rem] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              {t("sqlEditor.copied")}
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              {t("sqlEditor.copy")}
            </>
          )}
        </button>
      </div>

      {/* Editor area */}
      <div className="flex" style={{ height }}>
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="select-none overflow-hidden shrink-0 py-3 text-right"
          style={{
            background: "#181825",
            width: "44px",
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="px-2 text-[0.75rem] leading-[1.625rem] text-gray-600 font-mono"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="flex-1 bg-transparent text-gray-200 font-mono text-[0.82rem] leading-[1.625rem] py-3 px-3 resize-none outline-none overflow-auto placeholder:text-gray-600"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
}
