"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, AlertTriangle } from "lucide-react";
import type { SurveyLogic } from "../../../_components/mock-data";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false, loading: () => <div className="text-[0.72rem] text-muted-foreground px-3 py-4">Loading editor...</div> },
);

interface Props {
  value: SurveyLogic;
  onChange: (next: SurveyLogic) => void;
}

const placeholder = `{
  "triggers": [
    { "type": "complete", "expression": "{score} > 50" }
  ],
  "calculatedValues": [
    { "name": "score", "expression": "{q1} + {q2}", "includeIntoResult": true }
  ],
  "completedHtmlOnCondition": []
}`;

export function SurveyLogicPanel({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const hasAny =
    (value.triggers && value.triggers.length > 0) ||
    (value.calculatedValues && value.calculatedValues.length > 0) ||
    (value.completedHtmlOnCondition && value.completedHtmlOnCondition.length > 0);

  const text = useMemo(() => {
    if (!hasAny) return placeholder;
    return JSON.stringify(value, null, 2);
  }, [value, hasAny]);

  const [draft, setDraft] = useState(text);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (next: string | undefined) => {
    const s = next ?? "";
    setDraft(s);
    if (s.trim() === "") {
      setError(null);
      onChange({});
      return;
    }
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
        setError("Expected a JSON object with triggers/calculatedValues/completedHtmlOnCondition.");
        return;
      }
      setError(null);
      const next: SurveyLogic = {};
      if (Array.isArray(parsed.triggers)) next.triggers = parsed.triggers;
      if (Array.isArray(parsed.calculatedValues)) next.calculatedValues = parsed.calculatedValues;
      if (Array.isArray(parsed.completedHtmlOnCondition)) {
        next.completedHtmlOnCondition = parsed.completedHtmlOnCondition;
      }
      onChange(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-[0.82rem] font-semibold text-foreground hover:bg-muted transition-colors"
      >
        <ChevronDown
          className={"w-3.5 h-3.5 transition-transform " + (open ? "" : "-rotate-90")}
        />
        <span>Survey-level Logic (JSON)</span>
        {hasAny && (
          <span className="text-[0.6rem] font-semibold uppercase bg-primary/10 text-primary rounded px-1.5 py-0.5">
            active
          </span>
        )}
        <span className="ml-auto text-[0.7rem] font-normal text-muted-foreground">
          triggers · calculatedValues · completedHtmlOnCondition
        </span>
      </button>

      {open && (
        <div className="border-t">
          <div className="px-4 py-2 flex items-start gap-2 bg-amber-50/60 border-b border-amber-100">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[0.72rem] text-amber-800">
              Preview-only for now — these rules take effect in the Preview runner but are not yet persisted to the backend.
            </p>
          </div>
          <div className="h-64">
            <MonacoEditor
              height="100%"
              defaultLanguage="json"
              value={draft}
              onChange={handleChange}
              theme="vs"
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                tabSize: 2,
                formatOnPaste: true,
              }}
            />
          </div>
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-[0.72rem] text-red-700 font-mono">
              {error}
            </div>
          )}
          <div className="px-4 py-2 bg-muted border-t text-[0.7rem] text-muted-foreground">
            Reference:{" "}
            <a
              href="https://surveyjs.io/form-library/documentation/design-survey/conditional-logic"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:text-teal-700 underline"
            >
              SurveyJS triggers &amp; calculated values
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
