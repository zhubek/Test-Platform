"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { sectionsToSurveyJson } from "@/lib/surveyjs";
import { Button } from "@/components/ui/button";
import type { Section } from "../../../_components/mock-data";

// Read-only view of the generated SurveyJS schema. Regenerates live from the
// blocks (sections) — the blocks constructor is the source of truth.
export function JsonView({ sections }: { sections: Section[] }) {
  const [copied, setCopied] = useState(false);

  const json = useMemo(
    () => JSON.stringify(sectionsToSurveyJson(sections), null, 2),
    [sections],
  );

  const copy = () => {
    navigator.clipboard?.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs text-muted-foreground">
          Generated SurveyJS schema (read-only)
        </span>
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="flex-1 overflow-auto bg-muted/40 p-4 font-mono text-[0.72rem] leading-relaxed text-foreground">
        {json}
      </pre>
    </div>
  );
}
