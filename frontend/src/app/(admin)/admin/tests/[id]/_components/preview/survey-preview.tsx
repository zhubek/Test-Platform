"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuestionPreview } from "./question-preview";
import type { Section } from "../../../../_components/mock-data";

interface Props {
  sections: Section[];
  activeSectionIndex: number;
  onActiveSectionChange: (i: number) => void;
}

export function SurveyPreview({ sections, activeSectionIndex, onActiveSectionChange }: Props) {
  const { locale } = useLocale();
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});

  if (sections.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No sections yet. Add one on the left to see a preview.
      </div>
    );
  }

  const idx = Math.min(activeSectionIndex, sections.length - 1);
  const section = sections[idx];

  return (
    <div className="mx-auto max-w-xl">
      {/* Section stepper */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onActiveSectionChange(i)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              i === idx
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {i + 1}. {localize(s.title, locale) || "Section"}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="mb-5">
        <h3 className="text-lg font-bold tracking-tight">
          {localize(section.title, locale) || `Section ${idx + 1}`}
        </h3>
        {localize(section.description, locale) && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {localize(section.description, locale)}
          </p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {section.questions.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            No questions in this section.
          </div>
        ) : (
          section.questions.map((q) => (
            <QuestionPreview
              key={q.id}
              question={q}
              value={answers[q.id] ?? null}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
            />
          ))
        )}
      </div>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={idx === 0}
          onClick={() => onActiveSectionChange(idx - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          {idx + 1} / {sections.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={idx === sections.length - 1}
          onClick={() => onActiveSectionChange(idx + 1)}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
